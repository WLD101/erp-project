-- 20260202_enterprise_foundation.sql

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. DATABASE STRUCTURE
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'staff', 'viewer');

CREATE TABLE public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    deactivated_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Secure organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Profiles: Links auth.users to organizations
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    role public.user_role DEFAULT 'viewer',
    updated_at timestamptz DEFAULT now()
);

-- Secure profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Profiles policies generally allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);


-- 2. JWT AUTH HOOK (High Performance)
-- This function injects org_id and role into the user's token so we don't have to join tables in RLS
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claims jsonb;
  user_org_id uuid;
  user_role text;
BEGIN
  -- Fetch org and role from profiles
  SELECT org_id, role INTO user_org_id, user_role FROM profiles WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  
  -- Inject into app_metadata
  claims := jsonb_set(claims, '{app_metadata, org_id}', to_jsonb(user_org_id));
  claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant permissions to the Auth service
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;


-- 3. RLS HELPER FUNCTIONS (Cached)
-- Moving to public schema to avoid potential permission issues with 'auth' schema
CREATE OR REPLACE FUNCTION public.auth_org_id() 
RETURNS uuid 
LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.auth_role() 
RETURNS text 
LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$;

-- 4. TENANT ISOLATION POLICIES (Inventory & Transactions)

-- Ensure inventory table exists
CREATE TABLE IF NOT EXISTS public.inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name text NOT NULL,
    quantity numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.inventory ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 5. PARTITIONED TRANSACTIONS TABLE (Missing in previous step)
CREATE TABLE public.inventory_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    inventory_id uuid REFERENCES public.inventory(id),
    transaction_type text NOT NULL,
    quantity numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    PRIMARY KEY (id, org_id) -- Partitioning requirement
) PARTITION BY LIST (org_id);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.inventory_transactions_default PARTITION OF public.inventory_transactions DEFAULT;

-- Auto-Partition Trigger
CREATE OR REPLACE FUNCTION public.create_org_partition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    partition_name text;
    hashed_id text;
BEGIN
    hashed_id := replace(NEW.org_id::text, '-', '_');
    partition_name := format('inventory_transactions_%s', hashed_id);

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name AND n.nspname = 'public'
    ) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.inventory_transactions FOR VALUES IN (%L)', partition_name, NEW.org_id);
        -- Performance: Add Index to new partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_org_created ON public.%I(org_id, created_at)', partition_name, partition_name);
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_partition_exists
BEFORE INSERT ON public.inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION public.create_org_partition();


-- 6. GLOBAL INDEXES (Performance)
CREATE INDEX IF NOT EXISTS idx_organizations_id ON public.organizations(id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org_id ON public.inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_org_created ON public.inventory_transactions(org_id, created_at);


-- 7. RLS POLICIES (Consolidated)

-- A. Restrictive: Soft-Delete Lockout
-- Applies to ALL tables with org_id
-- Update: Allow super_admin to bypass this check (to view inactive tenants)
CREATE POLICY "Block inactive organizations" ON public.inventory AS RESTRICTIVE 
    USING (
        (EXISTS (SELECT 1 FROM organizations WHERE id = public.auth_org_id() AND is_active = true))
        OR (SELECT public.auth_role()) = 'super_admin'
    );

CREATE POLICY "Block inactive organizations" ON public.inventory_transactions AS RESTRICTIVE 
    USING (
        (EXISTS (SELECT 1 FROM organizations WHERE id = public.auth_org_id() AND is_active = true))
        OR (SELECT public.auth_role()) = 'super_admin'
    );

-- B. Permissive: Isolation
-- Update: Allow super_admin to view ANY org data
CREATE POLICY "Users can see their own org data" ON public.inventory FOR SELECT TO authenticated 
    USING ( 
        org_id = (SELECT public.auth_org_id()) 
        OR (SELECT public.auth_role()) = 'super_admin' 
    );

CREATE POLICY "Users can see their own org data" ON public.inventory_transactions FOR SELECT TO authenticated 
    USING ( 
        org_id = (SELECT public.auth_org_id()) 
        OR (SELECT public.auth_role()) = 'super_admin' 
    );

-- C. Permissive: Write Access
-- C. Permissive: Write Access (Split for Granularity)
CREATE POLICY "Admins and Staff can insert/update" ON public.inventory 
    FOR INSERT TO authenticated 
    WITH CHECK ( org_id = (SELECT public.auth_org_id()) AND (SELECT public.auth_role()) IN ('admin', 'staff') );

CREATE POLICY "Admins and Staff can update" ON public.inventory 
    FOR UPDATE TO authenticated 
    USING ( org_id = (SELECT public.auth_org_id()) AND (SELECT public.auth_role()) IN ('admin', 'staff') )
    WITH CHECK ( org_id = (SELECT public.auth_org_id()) AND (SELECT public.auth_role()) IN ('admin', 'staff') );

-- DELETE is now protected by specific permission
CREATE POLICY "Authorized users can delete" ON public.inventory 
    FOR DELETE TO authenticated 
    USING ( org_id = (SELECT public.auth_org_id()) AND public.can('inventory.delete') );

CREATE POLICY "Admins and Staff can write" ON public.inventory_transactions FOR ALL TO authenticated USING ( org_id = (SELECT public.auth_org_id()) AND (SELECT public.auth_role()) IN ('admin', 'staff') ) WITH CHECK ( org_id = (SELECT public.auth_org_id()) AND (SELECT public.auth_role()) IN ('admin', 'staff') );

-- 5. DATA LIFECYCLE & AUDIT SYSTEM

-- A. Private Audit Logging
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE private.cleanup_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid, -- Keep as plain uuid
    deleted_at timestamptz DEFAULT now(),
    inventory_count int DEFAULT 0,
    status text
);
-- Secure the private schema
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;


-- B. Deactivation Function
CREATE OR REPLACE FUNCTION public.deactivate_organization(target_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.organizations
    SET is_active = false,
        deactivated_at = now()
    WHERE id = target_org_id;
END;
$$;


-- C. Restoration Function
CREATE OR REPLACE FUNCTION public.restore_organization(target_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    org_record record;
BEGIN
    SELECT * INTO org_record FROM public.organizations WHERE id = target_org_id;
    
    IF org_record IS NULL THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;

    -- Check if eligible for restoration (within 30 days)
    IF org_record.is_active = false AND org_record.deactivated_at < (now() - interval '30 days') THEN
        RAISE EXCEPTION 'Data already purged or scheduled for deletion';
    END IF;

    -- Restore
    UPDATE public.organizations
    SET is_active = true,
        deactivated_at = NULL
    WHERE id = target_org_id;

    -- Log to private table
    INSERT INTO private.cleanup_logs (org_id, status)
    VALUES (target_org_id, 'RESTORED');
END;
$$;


-- D. Safe Purge Function (Destructive)
CREATE OR REPLACE FUNCTION public.purge_inactive_org_data(target_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    partition_name text;
    hashed_id text;
BEGIN
    -- 1. Optimally Drop Partition for Transactions (Instant cleanup)
    hashed_id := replace(target_org_id::text, '-', '_');
    partition_name := format('inventory_transactions_%s', hashed_id);
    
    -- Check and Drop
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name AND n.nspname = 'public'
    ) THEN
        EXECUTE format('DROP TABLE IF EXISTS public.%I', partition_name);
    ELSE
         -- Fallback if not partitioned or already gone
        DELETE FROM public.inventory_transactions WHERE org_id = target_org_id;
    END IF;

    -- 2. Delete from Standard Tables
    DELETE FROM public.inventory WHERE org_id = target_org_id;
    -- Add other tables here as they are created...
    
    -- 3. Delete Profiles & Organization
    DELETE FROM public.profiles WHERE org_id = target_org_id;
    DELETE FROM public.organizations WHERE id = target_org_id;
END;
$$;


-- E. Lifecycle Automation Function
CREATE OR REPLACE FUNCTION public.fn_purge_and_log_inactive_orgs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec record;
    inv_count int;
BEGIN
    -- 1. Find inactive orgs (> 30 days)
    FOR rec IN 
        SELECT id 
        FROM public.organizations 
        WHERE is_active = false 
        AND deactivated_at < (now() - interval '30 days')
    LOOP
        -- 2. Calculate Counts
        SELECT count(*) INTO inv_count FROM public.inventory WHERE org_id = rec.id;

        -- 3. Log to private table
        INSERT INTO private.cleanup_logs (org_id, inventory_count, status)
        VALUES (rec.id, inv_count, 'PURGED');

        -- 4. Execute Deletion
        PERFORM public.purge_inactive_org_data(rec.id);
        
    END LOOP;

    -- 5. Maintenance: Clean old logs (> 2 years)
    DELETE FROM private.cleanup_logs WHERE deleted_at < (now() - interval '2 years');
END;
$$;


-- F. Schedule (Every Sunday at 3:00 AM)
-- SELECT cron.unschedule('weekly_lifecycle_purge');

SELECT cron.schedule(
    'weekly_lifecycle_purge',
    '0 3 * * 0', -- 03:00 on Sunday (0)
    $$SELECT public.fn_purge_and_log_inactive_orgs()$$
);


-- 8. TENANT ONBOARDING
CREATE OR REPLACE FUNCTION public.signup_new_tenant(
    org_name text,
    user_id uuid,
    user_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id uuid;
BEGIN
    -- Duplicate Check
    IF EXISTS (SELECT 1 FROM public.organizations WHERE name = org_name) THEN
        RAISE EXCEPTION 'Organization name already exists';
    END IF;

    -- 1. Create Organization
    INSERT INTO public.organizations (name)
    VALUES (org_name)
    RETURNING id INTO new_org_id;

    -- 2. Create Admin Profile
    INSERT INTO public.profiles (id, org_id, role)
    VALUES (user_id, new_org_id, 'admin');

    -- 3. Welcome Inventory
    INSERT INTO public.inventory (org_id, item_name, quantity)
    VALUES (new_org_id, 'Welcome Package', 1);

    RETURN new_org_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.signup_new_tenant TO authenticated;


-- 9. INVITATION SYSTEM
CREATE TABLE public.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    role public.user_role NOT NULL,
    token uuid NOT NULL DEFAULT gen_random_uuid(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_org_id ON public.invitations(org_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage their own org's invitations
-- Using 'super_admin' in check for future proofing, though strictly only 'admin' is in enum currently
CREATE POLICY "Admins can view/create/delete invitations" ON public.invitations
    FOR ALL
    TO authenticated
    USING (
        org_id = public.auth_org_id() AND 
        public.auth_role() IN ('admin', 'super_admin')
    )
    WITH CHECK (
        org_id = public.auth_org_id() AND 
        public.auth_role() IN ('admin', 'super_admin')
    );

-- Function: Accept Invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(
    lookup_token uuid,
    target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record record;
BEGIN
    -- 1. Validate Token & Expiry
    SELECT * INTO invite_record 
    FROM public.invitations 
    WHERE token = lookup_token;

    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Invalid invitation token';
    END IF;

    IF invite_record.expires_at < now() THEN
        RAISE EXCEPTION 'Invitation token has expired';
    END IF;

    -- 2. Create Profile
    -- Ensure user doesn't already have one (optional, but good safety)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
         RAISE EXCEPTION 'User profile already exists';
    END IF;

    INSERT INTO public.profiles (id, org_id, role)
    VALUES (target_user_id, invite_record.org_id, invite_record.role);

    -- 3. Cleanup
    DELETE FROM public.invitations WHERE id = invite_record.id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation TO authenticated;


-- 10. PERMISSIONS SYSTEM
CREATE TABLE public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE, -- e.g. 'inventory.delete'
    description text
);

CREATE TABLE public.role_permissions (
    role public.user_role NOT NULL, 
    permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

-- Seed Initial Permissions
INSERT INTO public.permissions (name, description) VALUES
    ('inventory.create', 'Can create inventory items'),
    ('inventory.read', 'Can read inventory items'),
    ('inventory.update', 'Can update inventory items'),
    ('inventory.delete', 'Can delete inventory items');

-- Seed Role Assignments
-- Admin gets all
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions;

-- Staff gets everything EXCEPT delete
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'staff', id FROM public.permissions WHERE name != 'inventory.delete';

-- Function: Check Permission
-- Note: User requested auth.can(), but we place it in public schema for safety and easier maintenance.
-- Usage: public.can('inventory.delete')
CREATE OR REPLACE FUNCTION public.can(
    requested_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    user_role public.user_role;
BEGIN
    -- Get current user's role (using our existing helper)
    user_role := (SELECT public.auth_role()::public.user_role);

    -- Check if that role has the permission
    RETURN EXISTS (
        SELECT 1 
        FROM public.role_permissions rp
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role
        AND p.name = requested_permission
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.can TO authenticated;


-- 11. SYSTEM HEALTH MONITOR
CREATE OR REPLACE FUNCTION public.fn_generate_system_health_report()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rls_issues jsonb;
    orphan_issues jsonb;
    partition_issues jsonb;
    cron_issues jsonb;
    admin_stats jsonb;
    report jsonb;
BEGIN
    -- 1. RLS Safety Check (Find public tables without RLS)
    SELECT jsonb_agg(format('%s', c.relname))
    INTO rls_issues
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = false;

    -- 2. Orphaned Profile Check
    SELECT jsonb_agg(p.id)
    INTO orphan_issues
    FROM public.profiles p 
    LEFT JOIN public.organizations o ON p.org_id = o.id 
    WHERE o.id IS NULL;

    -- 3. Partition Gap Check
    SELECT jsonb_agg(o.id)
    INTO partition_issues
    FROM public.organizations o
    WHERE NOT EXISTS (
        SELECT 1 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = format('inventory_transactions_%s', replace(o.id::text, '-', '_'))
    );

    -- 4. Cron Health (Failed runs in last 7 days)
    -- Wrap in exception block in case pg_cron schemas/tables are missing or permission denied
    BEGIN
        SELECT jsonb_agg(jsonb_build_object('job', jobname, 'error', return_message, 'time', end_time))
        INTO cron_issues
        FROM cron.job_run_details 
        WHERE status = 'failed' 
        AND end_time > now() - interval '7 days';
    EXCEPTION WHEN OTHERS THEN
        cron_issues := jsonb_build_array('Error checking cron status: ' || SQLERRM);
    END;

    -- 5. Admin Access Log (Placeholder / Basic Count if table existed)
    -- Since we don't have a specific access log table yet, we report status.
    admin_stats := jsonb_build_object(
        'status', 'Audit Logging Not Enabled', 
        'super_admin_activity_24h', 0
    );

    -- Assemble Report
    report := jsonb_build_object(
        'generated_at', now(),
        'status', CASE 
            WHEN rls_issues IS NOT NULL 
              OR orphan_issues IS NOT NULL 
              OR partition_issues IS NOT NULL 
              OR cron_issues IS NOT NULL THEN 'WARNING' 
            ELSE 'HEALTHY' 
        END,
        'issues', jsonb_build_object(
            'rls_disabled_tables', COALESCE(rls_issues, '[]'::jsonb),
            'orphaned_profiles', COALESCE(orphan_issues, '[]'::jsonb),
            'missing_partitions', COALESCE(partition_issues, '[]'::jsonb),
            'cron_failures', COALESCE(cron_issues, '[]'::jsonb)
        ),
        'audit', admin_stats
    );

    RETURN report;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_generate_system_health_report TO authenticated;


-- 12. EXTERNAL MONITORING

-- A. Dedicated Schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- B. Tenant Metrics View
-- Provides a snapshot of usage per org for Prometheus/Grafana scrapers
CREATE OR REPLACE VIEW monitoring.tenant_metrics AS
SELECT 
    o.id AS org_id,
    o.name AS org_name,
    o.is_active,
    -- Inventory Count (Shared Table)
    (SELECT count(*) FROM public.inventory WHERE org_id = o.id) AS inventory_rows,
    -- Transaction Partition Size (Isolated Data)
    (
        SELECT COALESCE(pg_total_relation_size(c.oid), 0)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = format('inventory_transactions_%s', replace(o.id::text, '-', '_'))
    ) AS transaction_storage_bytes
FROM public.organizations o;

GRANT SELECT ON monitoring.tenant_metrics TO authenticated; -- Or specific service role

-- C. Alerting Logic Function
-- Checks for 'Stuck' Deletions (> 45 days inactive but not purged)
CREATE OR REPLACE FUNCTION monitoring.check_critical_purge_delays()
RETURNS table(status text, message text, org_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stuck_count bigint;
BEGIN
    SELECT count(*) 
    INTO stuck_count
    FROM public.organizations
    WHERE is_active = false 
    AND deactivated_at < (now() - interval '45 days');

    IF stuck_count > 0 THEN
        RETURN QUERY SELECT 
            'CRITICAL'::text, 
            'Organizations found lingering in deactivated state > 45 days. Purge job may be failing.'::text, 
            stuck_count;
    ELSE
        RETURN QUERY SELECT 
            'OK'::text, 
            'Purge lifecycle operating normally.'::text, 
            0::bigint;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION monitoring.check_critical_purge_delays TO authenticated;

