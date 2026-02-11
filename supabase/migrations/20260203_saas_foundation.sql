-- 20260203_saas_foundation.sql

-- 1. SUBSCRIPTION PLANS & FEATURES

CREATE TABLE public.subscription_plans (
    id text PRIMARY KEY, -- 'starter', 'premium', 'enterprise'
    name text NOT NULL,
    max_users int NOT NULL DEFAULT 5,
    monthly_price numeric(10, 2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.features (
    key text PRIMARY KEY, -- 'textile_manufacturing', 'payroll', 'multi_location'
    name text NOT NULL,
    description text
);

CREATE TABLE public.plan_features (
    plan_id text REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_key text REFERENCES public.features(key) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, feature_key)
);

-- Seed Features
INSERT INTO public.features (key, name, description) VALUES
    ('textile_manufacturing', 'Textile Manufacturing', 'Advanced production planning / T&A'),
    ('payroll', 'Payroll & HRM', 'Employee management and payslips'),
    ('multi_location', 'Multi-Location Inventory', 'Manage stock across multiple warehouses'),
    ('fbr_integration', 'FBR Integration', 'Direct automated tax filing'),
    ('advanced_reporting', 'Advanced Reporting', 'Balance Sheet Drilldowns and Custom Reports');

-- Seed Plans
INSERT INTO public.subscription_plans (id, name, max_users, monthly_price) VALUES
    ('starter', 'Starter Package', 2, 0),
    ('premium', 'Premium Package', 10, 50),
    ('enterprise', 'Enterprise Suite', 999999, 200);

-- Seed Plan Features
-- Starter: Basic only (implicit, so no extra features mapped here yet)
-- Premium: Payroll, Multi-location
INSERT INTO public.plan_features (plan_id, feature_key) VALUES
    ('premium', 'payroll'),
    ('premium', 'multi_location');

-- Enterprise: Everything
INSERT INTO public.plan_features (plan_id, feature_key) VALUES
    ('enterprise', 'textile_manufacturing'),
    ('enterprise', 'payroll'),
    ('enterprise', 'multi_location'),
    ('enterprise', 'fbr_integration'),
    ('enterprise', 'advanced_reporting');


-- 2. TENANT SUBSCRIPTIONS

CREATE TABLE public.organization_subscriptions (
    org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id text NOT NULL REFERENCES public.subscription_plans(id),
    status text DEFAULT 'active', -- 'active', 'suspended', 'past_due'
    valid_until timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for Subs
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view their own sub" ON public.organization_subscriptions 
    FOR SELECT TO authenticated 
    USING ( org_id = public.auth_org_id() OR public.auth_role() = 'super_admin' );


-- 3. USER QUOTA ENFORCEMENT

CREATE OR REPLACE FUNCTION public.check_user_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count int;
    max_allowed int;
    org_plan_id text;
BEGIN
    -- Get Plan Limit
    SELECT p.max_users INTO max_allowed
    FROM public.organization_subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.org_id = NEW.org_id;

    -- If no subscription found, assume default restrictive limit or error out
    -- For now, let's default to Starter limit (2) if missing, for safety
    IF max_allowed IS NULL THEN
        max_allowed := 2;
    END IF;

    -- Count existing users (excluding the one being inserted if it was able to see itself, but it's BEFORE or AFTER? 
    -- Trigger should be BEFORE to block.
    SELECT count(*) INTO current_count FROM public.profiles WHERE org_id = NEW.org_id;

    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'User quota exceeded for current plan. Limit: %, Current: %', max_allowed, current_count;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_user_quota
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_user_quota();


-- 4. FEATURE GATING HELPER

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

    RETURN EXISTS (
        SELECT 1
        FROM public.organization_subscriptions os
        JOIN public.plan_features pf ON os.plan_id = pf.plan_id
        WHERE os.org_id = my_org
        AND pf.feature_key = feature_check
        AND os.status = 'active'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.org_has_feature TO authenticated;


-- 5. UPDATE TENANT ONBOARDING (To include plan)

DROP FUNCTION IF EXISTS public.signup_new_tenant;

CREATE OR REPLACE FUNCTION public.signup_new_tenant(
    org_name text,
    user_id uuid,
    user_email text,
    plan_id text DEFAULT 'starter'
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

    -- 2. Create Subscription
    INSERT INTO public.organization_subscriptions (org_id, plan_id)
    VALUES (new_org_id, plan_id);

    -- 3. Create Admin Profile
    -- This insert will trigger check_user_quota, but since count is 0, it will pass (0 < limit)
    INSERT INTO public.profiles (id, org_id, role)
    VALUES (user_id, new_org_id, 'admin');

    -- 4. Welcome Inventory
    INSERT INTO public.inventory (org_id, item_name, quantity)
    VALUES (new_org_id, 'Welcome Package', 1);

    RETURN new_org_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.signup_new_tenant TO authenticated;
