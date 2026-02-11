-- 20260203_whatsapp_integration.sql

-- 1. ADD WHATSAPP FEATURE
INSERT INTO public.features (key, name, description) VALUES
    ('whatsapp_integration', 'WhatsApp Notifications', 'Automated alerts and PDF reports via WhatsApp API');

-- 2. NOTIFICATION OUTBOX (Queue)

CREATE TABLE public.notification_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel text NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
    recipient text NOT NULL, -- Phone number or Email
    template_name text NOT NULL, -- e.g. 'invoice_created'
    template_params jsonb DEFAULT '{}'::jsonb, -- Variables for the template
    status text DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'processing'
    external_id text, -- Message ID from Provider (Twilio/Meta)
    error_message text,
    created_at timestamptz DEFAULT now(),
    processed_at timestamptz
);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants view own notifications" ON public.notification_outbox
    FOR SELECT TO authenticated
    USING (org_id = public.auth_org_id());

-- 3. FUNCTION TO ENQUEUE NOTIFICATION

CREATE OR REPLACE FUNCTION public.enqueue_notification(
    org_id uuid,
    channel text,
    recipient text,
    template_name text,
    params jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id uuid;
BEGIN
    -- Check if feature is enabled for this org (Plan or Ad-hoc)
    -- We can reuse the existing `org_has_feature` logic via SQL or check tables directly
    -- For performance in triggers, direct check is better, but function is cleaner.
    -- However, calling a STABLE function in a VOLATILE wrapper is fine.
    
    -- (Optional: Strict check)
    -- IF NOT public.org_has_feature_for_org(org_id, 'whatsapp_integration') THEN ... 
    
    INSERT INTO public.notification_outbox (org_id, channel, recipient, template_name, template_params)
    VALUES (org_id, channel, recipient, template_name, params)
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;
