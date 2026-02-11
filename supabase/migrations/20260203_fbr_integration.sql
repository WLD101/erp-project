-- 20260203_fbr_integration.sql

-- 1. AD-HOC FEATURES (To allow "selecting" options per tenant regardless of plan)

CREATE TABLE public.organization_adhoc_features (
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    feature_key text NOT NULL REFERENCES public.features(key) ON DELETE CASCADE,
    is_enabled boolean DEFAULT true, -- Can be used to Enable OR Disable (if we want to block a plan feature, logic gets complex, let's assume Additive only for now)
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (org_id, feature_key)
);

-- Update the check function to include ad-hoc features
CREATE OR REPLACE FUNCTION public.org_has_feature(
    feature_check text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    my_org uuid;
BEGIN
    my_org := public.auth_org_id();
    
    -- Super Admin has all features
    IF public.auth_role() = 'super_admin' THEN
        RETURN true;
    END IF;

    -- Check Plan Features OR Ad-hoc Features
    RETURN EXISTS (
        SELECT 1
        FROM public.organization_subscriptions os
        JOIN public.plan_features pf ON os.plan_id = pf.plan_id
        WHERE os.org_id = my_org
        AND pf.feature_key = feature_check
        AND os.status = 'active'
    ) OR EXISTS (
        SELECT 1
        FROM public.organization_adhoc_features oaf
        WHERE oaf.org_id = my_org
        AND oaf.feature_key = feature_check
        AND oaf.is_enabled = true
    );
END;
$$;


-- 2. FBR CONFIGURATION

CREATE TABLE public.fbr_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pos_id int, -- Provided by FBR
    usin text,  -- Provided by FBR (e.g., specific to branch)
    auth_token text, -- Bearer token (if static) or credentials to fetch it
    environment text DEFAULT 'sandbox', -- 'sandbox', 'production'
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(org_id)
);

ALTER TABLE public.fbr_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants manage own FBR config" ON public.fbr_config
    FOR ALL TO authenticated
    USING (org_id = public.auth_org_id());

-- 3. FBR LOGS (Audit Trail)

CREATE TABLE public.fbr_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id uuid, -- Can be null if failed before creation, or link to sales invoice if exists
    request_payload jsonb, -- The exact JSON sent to FBR
    response_payload jsonb, -- The exact JSON received
    fbr_invoice_number text, -- The Fiscal Number
    status text, -- 'success', 'error'
    error_message text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fbr_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own FBR logs" ON public.fbr_logs
    FOR SELECT TO authenticated
    USING (org_id = public.auth_org_id());


-- 4. HELPER: Enable Feature for Tenant (RPC)

CREATE OR REPLACE FUNCTION public.enable_adhoc_feature(
    target_org_id uuid,
    feature text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only Super Admin or System should call this ideally, but we'll stick to RLS/policies usually. 
    -- For RPC, we check role manually if exposed.
    IF public.auth_role() <> 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can enable ad-hoc features';
    END IF;

    INSERT INTO public.organization_adhoc_features (org_id, feature_key)
    VALUES (target_org_id, feature)
    ON CONFLICT (org_id, feature_key) DO NOTHING;
END;
$$;
