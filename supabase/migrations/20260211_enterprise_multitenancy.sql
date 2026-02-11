-- =====================================================
-- ENTERPRISE MULTI-TENANCY UPGRADE
-- Phase 1: Organization Settings
-- Phase 2: Master Data Templates
-- Phase 3: Analytical Views
-- Phase 4: State Machine Pattern
-- =====================================================

-- =====================================================
-- PHASE 1: ORGANIZATION SETTINGS & INHERITANCE
-- =====================================================

-- Organization-level settings with inherited defaults
CREATE TABLE IF NOT EXISTS public.organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Currency Settings
    base_currency TEXT NOT NULL DEFAULT 'PKR',
    exchange_rates JSONB DEFAULT '{}'::jsonb,
    
    -- Tax & FBR Settings
    default_tax_rate NUMERIC(5,2) DEFAULT 0.00,
    fbr_enabled BOOLEAN DEFAULT false,
    fbr_pos_id TEXT,
    fbr_branch_code TEXT,
    tax_rules JSONB DEFAULT '[]'::jsonb, -- [{item_category: 'textile', rate: 15}]
    
    -- Units of Measure
    default_uom TEXT DEFAULT 'pcs',
    uom_conversions JSONB DEFAULT '{}'::jsonb, -- {kg_to_g: 1000, m_to_cm: 100}
    
    -- Business Rules
    allow_negative_inventory BOOLEAN DEFAULT false,
    auto_confirm_orders BOOLEAN DEFAULT false,
    require_approval_threshold NUMERIC(15,2),
    
    -- Localization
    timezone TEXT DEFAULT 'Asia/Karachi',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    number_format TEXT DEFAULT 'en-PK',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id)
);

CREATE INDEX idx_org_settings_org ON public.organization_settings(org_id);

-- RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_settings_access" ON public.organization_settings
FOR ALL USING (org_id = (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

-- Helper function to get org setting
CREATE OR REPLACE FUNCTION public.get_org_setting(
    p_org_id UUID,
    p_setting_key TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_setting_value TEXT;
BEGIN
    EXECUTE format('SELECT %I::TEXT FROM organization_settings WHERE org_id = $1', p_setting_key)
    INTO v_setting_value
    USING p_org_id;
    
    RETURN v_setting_value;
EXCEPTION
    WHEN undefined_column THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 2: MASTER DATA TEMPLATES
-- =====================================================

-- Template registry
CREATE TABLE IF NOT EXISTS public.master_data_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    description TEXT,
    industry TEXT, -- 'textile', 'manufacturing', 'general'
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_template_type CHECK (template_type IN (
        'chart_of_accounts', 
        'inventory', 
        'production_process',
        'quality_templates'
    ))
);

CREATE INDEX idx_templates_type ON public.master_data_templates(template_type, is_default);

-- Chart of Accounts Templates
CREATE TABLE IF NOT EXISTS public.template_chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.master_data_templates(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    parent_code TEXT,
    currency TEXT DEFAULT 'PKR',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT valid_account_type CHECK (account_type IN (
        'asset', 'liability', 'equity', 'income', 'expense'
    ))
);

CREATE INDEX idx_template_coa_template ON public.template_chart_of_accounts(template_id);

-- Inventory Item Templates
CREATE TABLE IF NOT EXISTS public.template_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.master_data_templates(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'pcs',
    description TEXT,
    standard_cost NUMERIC(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_template_inventory_template ON public.template_inventory_items(template_id);

-- Apply template to organization
CREATE OR REPLACE FUNCTION public.apply_template_to_org(
    p_org_id UUID,
    p_template_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_template RECORD;
    v_accounts_created INTEGER := 0;
    v_items_created INTEGER := 0;
BEGIN
    -- Get template details
    SELECT * INTO v_template
    FROM public.master_data_templates
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Apply based on template type
    IF v_template.template_type = 'chart_of_accounts' THEN
        -- Copy chart of accounts
        INSERT INTO public.chart_of_accounts (
            org_id, account_code, name, account_type, 
            parent_code, currency, description
        )
        SELECT 
            p_org_id,
            account_code,
            name,
            account_type,
            parent_code,
            currency,
            description
        FROM public.template_chart_of_accounts
        WHERE template_id = p_template_id
          AND is_active = true;
        
        GET DIAGNOSTICS v_accounts_created = ROW_COUNT;
    END IF;
    
    IF v_template.template_type = 'inventory' THEN
        -- Copy inventory items
        INSERT INTO public.inventory (
            org_id, item_code, name, category, 
            unit, description, quantity
        )
        SELECT 
            p_org_id,
            item_code,
            name,
            category,
            unit,
            description,
            0 -- Start with zero quantity
        FROM public.template_inventory_items
        WHERE template_id = p_template_id
          AND is_active = true;
        
        GET DIAGNOSTICS v_items_created = ROW_COUNT;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'template_name', v_template.template_name,
        'template_type', v_template.template_type,
        'accounts_created', v_accounts_created,
        'items_created', v_items_created
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.apply_template_to_org TO authenticated;

-- =====================================================
-- PHASE 3: ANALYTICAL VIEWS
-- =====================================================

-- Production Order Cost Analysis View
CREATE OR REPLACE VIEW public.v_production_order_costs AS
SELECT 
    po.id as order_id,
    po.org_id,
    po.order_number,
    po.product_id,
    po.quantity,
    po.status,
    po.created_at,
    
    -- Material Costs (from BOM + Inventory prices)
    COALESCE(
        (SELECT SUM(bom.quantity_required * po.quantity * COALESCE(inv.unit_cost, 0))
         FROM public.bill_of_materials bom
         LEFT JOIN public.inventory inv ON inv.id = bom.material_id AND inv.org_id = bom.org_id
         WHERE bom.product_id = po.product_id
           AND bom.org_id = po.org_id),
        0
    ) as material_cost,
    
    -- Labor Costs (placeholder - set to 0 for now)
    0::numeric as labor_cost,
    
    -- Overhead (10% of material cost - configurable)
    COALESCE(
        (SELECT SUM(bom.quantity_required * po.quantity * COALESCE(inv.unit_cost, 0)) * 0.10
         FROM public.bill_of_materials bom
         LEFT JOIN public.inventory inv ON inv.id = bom.material_id AND inv.org_id = bom.org_id
         WHERE bom.product_id = po.product_id
           AND bom.org_id = po.org_id),
        0
    ) as overhead_cost,
    
    -- Total Cost (Material + Labor + Overhead)
    COALESCE(
        (SELECT SUM(bom.quantity_required * po.quantity * COALESCE(inv.unit_cost, 0)) * 1.10
         FROM public.bill_of_materials bom
         LEFT JOIN public.inventory inv ON inv.id = bom.material_id AND inv.org_id = bom.org_id
         WHERE bom.product_id = po.product_id
           AND bom.org_id = po.org_id),
        0
    ) as total_cost,
    
    -- Revenue (from journal entries)
    COALESCE(
        (SELECT SUM(gl.credit)
         FROM public.journal_entries je
         JOIN public.gl_lines gl ON gl.journal_entry_id = je.id
         JOIN public.chart_of_accounts coa ON coa.id = gl.account_id
         WHERE je.reference LIKE 'AUTO-' || po.order_number
           AND coa.account_type = 'income'
           AND je.org_id = po.org_id),
        0
    ) as revenue,
    
    -- Profit (Revenue - Total Cost)
    COALESCE(
        (SELECT SUM(gl.credit)
         FROM public.journal_entries je
         JOIN public.gl_lines gl ON gl.journal_entry_id = je.id
         JOIN public.chart_of_accounts coa ON coa.id = gl.account_id
         WHERE je.reference LIKE 'AUTO-' || po.order_number
           AND coa.account_type = 'income'
           AND je.org_id = po.org_id),
        0
    ) - COALESCE(
        (SELECT SUM(bom.quantity_required * po.quantity * COALESCE(inv.unit_cost, 0)) * 1.10
         FROM public.bill_of_materials bom
         LEFT JOIN public.inventory inv ON inv.id = bom.material_id AND inv.org_id = bom.org_id
         WHERE bom.product_id = po.product_id
           AND bom.org_id = po.org_id),
        0
    ) as profit,
    
    -- Profit Margin Percentage
    CASE 
        WHEN COALESCE(
            (SELECT SUM(gl.credit)
             FROM public.journal_entries je
             JOIN public.gl_lines gl ON gl.journal_entry_id = je.id
             JOIN public.chart_of_accounts coa ON coa.id = gl.account_id
             WHERE je.reference LIKE 'AUTO-' || po.order_number
               AND coa.account_type = 'income'
               AND je.org_id = po.org_id),
            0
        ) > 0 THEN
            ((COALESCE(
                (SELECT SUM(gl.credit)
                 FROM public.journal_entries je
                 JOIN public.gl_lines gl ON gl.journal_entry_id = je.id
                 JOIN public.chart_of_accounts coa ON coa.id = gl.account_id
                 WHERE je.reference LIKE 'AUTO-' || po.order_number
                   AND coa.account_type = 'income'
                   AND je.org_id = po.org_id),
                0
            ) - COALESCE(
                (SELECT SUM(bom.quantity_required * po.quantity * COALESCE(inv.unit_cost, 0)) * 1.10
                 FROM public.bill_of_materials bom
                 LEFT JOIN public.inventory inv ON inv.id = bom.material_id AND inv.org_id = bom.org_id
                 WHERE bom.product_id = po.product_id
                   AND bom.org_id = po.org_id),
                0
            )) / COALESCE(
                (SELECT SUM(gl.credit)
                 FROM public.journal_entries je
                 JOIN public.gl_lines gl ON gl.journal_entry_id = je.id
                 JOIN public.chart_of_accounts coa ON coa.id = gl.account_id
                 WHERE je.reference LIKE 'AUTO-' || po.order_number
                   AND coa.account_type = 'income'
                   AND je.org_id = po.org_id),
                1
            )) * 100
        ELSE 0
    END as profit_margin_percent
    
FROM public.production_orders po
WHERE po.status IN ('confirmed', 'materials_reserved', 'started', 'in_progress', 'completed', 'closed');

GRANT SELECT ON public.v_production_order_costs TO authenticated;

-- Inventory Valuation View
CREATE OR REPLACE VIEW public.v_inventory_valuation AS
SELECT 
    inv.org_id,
    inv.category,
    COUNT(inv.id) as item_count,
    SUM(inv.quantity) as total_quantity,
    SUM(inv.quantity * COALESCE(inv.unit_cost, 0)) as total_value,
    AVG(COALESCE(inv.unit_cost, 0)) as avg_unit_cost,
    MIN(inv.quantity) as min_stock,
    MAX(inv.quantity) as max_stock
FROM public.inventory inv
WHERE inv.quantity > 0
GROUP BY inv.org_id, inv.category;

GRANT SELECT ON public.v_inventory_valuation TO authenticated;

-- =====================================================
-- PHASE 4: STATE MACHINE PATTERN
-- =====================================================

-- Add status history and timestamps to production_orders
ALTER TABLE public.production_orders 
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.production_orders
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Update production_orders status constraint
ALTER TABLE public.production_orders 
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.production_orders
ADD CONSTRAINT valid_status CHECK (status IN (
    'draft',
    'confirmed',
    'materials_reserved',
    'started',
    'in_progress',
    'completed',
    'closed',
    'cancelled'
));

-- Add status history and timestamps to journal_entries
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;

-- Update journal_entries status constraint
ALTER TABLE public.journal_entries
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.journal_entries
ADD CONSTRAINT valid_status CHECK (status IN (
    'draft',
    'validated',
    'posted',
    'paid',
    'reconciled',
    'cancelled'
));

-- State Transition Configuration Table
CREATE TABLE IF NOT EXISTS public.state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'production_order', 'invoice'
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    requires_validation BOOLEAN DEFAULT true,
    validation_function TEXT, -- RPC function name
    allowed_roles TEXT[] DEFAULT ARRAY['admin', 'staff'],
    description TEXT,
    
    UNIQUE(entity_type, from_status, to_status)
);

-- Seed production order transitions
INSERT INTO public.state_transitions (entity_type, from_status, to_status, validation_function, description) VALUES
('production_order', 'draft', 'confirmed', 'validate_order_confirmation', 'Confirm order details'),
('production_order', 'confirmed', 'materials_reserved', 'validate_material_reservation', 'Reserve raw materials'),
('production_order', 'materials_reserved', 'started', 'validate_order_start', 'Begin production'),
('production_order', 'started', 'in_progress', NULL, 'Mark as in progress'),
('production_order', 'in_progress', 'completed', 'validate_order_completion', 'Complete production'),
('production_order', 'completed', 'closed', NULL, 'Close order'),
('production_order', 'draft', 'cancelled', NULL, 'Cancel order'),
('production_order', 'confirmed', 'cancelled', NULL, 'Cancel confirmed order')
ON CONFLICT (entity_type, from_status, to_status) DO NOTHING;

-- Seed invoice transitions
INSERT INTO public.state_transitions (entity_type, from_status, to_status, validation_function, description) VALUES
('invoice', 'draft', 'validated', 'validate_invoice', 'Validate invoice data'),
('invoice', 'validated', 'posted', 'validate_invoice_posting', 'Post to general ledger'),
('invoice', 'posted', 'paid', 'validate_payment', 'Mark as paid'),
('invoice', 'paid', 'reconciled', NULL, 'Reconcile payment'),
('invoice', 'draft', 'cancelled', NULL, 'Cancel draft invoice')
ON CONFLICT (entity_type, from_status, to_status) DO NOTHING;

-- Validation: Order Confirmation
CREATE OR REPLACE FUNCTION public.validate_order_confirmation(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM public.production_orders 
    WHERE id = p_order_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Order not found');
    END IF;
    
    -- Check required fields
    IF v_order.product_id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Product is required');
    END IF;
    
    IF v_order.quantity IS NULL OR v_order.quantity <= 0 THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Quantity must be greater than 0');
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Order confirmed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation: Material Reservation
CREATE OR REPLACE FUNCTION public.validate_material_reservation(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_inventory_check JSONB;
BEGIN
    SELECT * INTO v_order FROM public.production_orders 
    WHERE id = p_order_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Order not found');
    END IF;
    
    -- Check inventory availability
    v_inventory_check := public.check_inventory_for_order(p_order_id, p_org_id);
    
    IF NOT (v_inventory_check->>'has_sufficient_inventory')::boolean THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Insufficient inventory',
            'missing_items', v_inventory_check->'missing_items'
        );
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Materials reserved successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation: Order Start
CREATE OR REPLACE FUNCTION public.validate_order_start(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM public.production_orders 
    WHERE id = p_order_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Order not found');
    END IF;
    
    -- Materials must be reserved first
    IF v_order.status != 'materials_reserved' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Materials must be reserved before starting');
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Order started successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation: Order Completion
CREATE OR REPLACE FUNCTION public.validate_order_completion(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM public.production_orders 
    WHERE id = p_order_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Order not found');
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Order completed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation: Invoice
CREATE OR REPLACE FUNCTION public.validate_invoice(
    p_invoice_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_invoice RECORD;
    v_line_count INTEGER;
    v_balanced BOOLEAN;
    v_total_debit NUMERIC;
    v_total_credit NUMERIC;
BEGIN
    SELECT * INTO v_invoice FROM public.journal_entries 
    WHERE id = p_invoice_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invoice not found');
    END IF;
    
    -- Check has lines
    SELECT COUNT(*) INTO v_line_count FROM public.gl_lines 
    WHERE journal_entry_id = p_invoice_id;
    
    IF v_line_count = 0 THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invoice has no line items');
    END IF;
    
    -- Check balanced (debits = credits)
    SELECT 
        SUM(debit), SUM(credit) INTO v_total_debit, v_total_credit
    FROM public.gl_lines 
    WHERE journal_entry_id = p_invoice_id;
    
    IF v_total_debit != v_total_credit THEN
        RETURN jsonb_build_object(
            'valid', false, 
            'error', format('Invoice is not balanced (Debit: %s, Credit: %s)', v_total_debit, v_total_credit)
        );
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Invoice validated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation: Invoice Posting
CREATE OR REPLACE FUNCTION public.validate_invoice_posting(
    p_invoice_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_invoice RECORD;
BEGIN
    SELECT * INTO v_invoice FROM public.journal_entries 
    WHERE id = p_invoice_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invoice not found');
    END IF;
    
    IF v_invoice.status != 'validated' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invoice must be validated before posting');
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Invoice posted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation: Payment
CREATE OR REPLACE FUNCTION public.validate_payment(
    p_invoice_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_invoice RECORD;
BEGIN
    SELECT * INTO v_invoice FROM public.journal_entries 
    WHERE id = p_invoice_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invoice not found');
    END IF;
    
    IF v_invoice.status != 'posted' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invoice must be posted before marking as paid');
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Payment recorded successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Centralized State Transition Function
CREATE OR REPLACE FUNCTION public.transition_state(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_org_id UUID,
    p_to_status TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_current_status TEXT;
    v_transition RECORD;
    v_validation_result JSONB;
    v_table_name TEXT;
    v_timestamp_column TEXT;
BEGIN
    -- Get table name
    v_table_name := CASE p_entity_type
        WHEN 'production_order' THEN 'production_orders'
        WHEN 'invoice' THEN 'journal_entries'
        ELSE NULL
    END;
    
    IF v_table_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid entity type');
    END IF;
    
    -- Get current status
    EXECUTE format('SELECT status FROM %I WHERE id = $1 AND org_id = $2', v_table_name)
    INTO v_current_status
    USING p_entity_id, p_org_id;
    
    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Entity not found');
    END IF;
    
    -- Check if transition is allowed
    SELECT * INTO v_transition
    FROM public.state_transitions
    WHERE entity_type = p_entity_type
      AND from_status = v_current_status
      AND to_status = p_to_status;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Transition from %s to %s is not allowed', v_current_status, p_to_status)
        );
    END IF;
    
    -- Run validation if required
    IF v_transition.requires_validation AND v_transition.validation_function IS NOT NULL THEN
        EXECUTE format('SELECT %I($1, $2)', v_transition.validation_function)
        INTO v_validation_result
        USING p_entity_id, p_org_id;
        
        IF NOT (v_validation_result->>'valid')::boolean THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', v_validation_result->>'error',
                'details', v_validation_result
            );
        END IF;
    END IF;
    
    -- Update status
    EXECUTE format('UPDATE %I SET status = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3', v_table_name)
    USING p_to_status, p_entity_id, p_org_id;
    
    -- Update timestamp column
    v_timestamp_column := p_to_status || '_at';
    BEGIN
        EXECUTE format('UPDATE %I SET %I = NOW() WHERE id = $1', v_table_name, v_timestamp_column)
        USING p_entity_id;
    EXCEPTION
        WHEN undefined_column THEN
            NULL; -- Column doesn't exist, skip
    END;
    
    -- Add to status history
    EXECUTE format(
        'UPDATE %I SET status_history = status_history || $1::jsonb WHERE id = $2',
        v_table_name
    )
    USING jsonb_build_object(
        'from', v_current_status,
        'to', p_to_status,
        'timestamp', NOW(),
        'user_id', auth.uid()
    ), p_entity_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'from_status', v_current_status,
        'to_status', p_to_status,
        'message', format('Transitioned from %s to %s', v_current_status, p_to_status)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.transition_state TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_order_confirmation TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_material_reservation TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_order_start TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_order_completion TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invoice TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invoice_posting TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_payment TO authenticated;

-- =====================================================
-- SEED DEFAULT DATA
-- =====================================================

-- Create default textile industry COA template
INSERT INTO public.master_data_templates (template_name, template_type, description, industry, is_default)
VALUES ('Textile Industry - Chart of Accounts', 'chart_of_accounts', 'Standard chart of accounts for textile manufacturing', 'textile', true)
ON CONFLICT DO NOTHING
RETURNING id;

-- Get the template ID for seeding accounts
DO $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.master_data_templates 
    WHERE template_name = 'Textile Industry - Chart of Accounts' LIMIT 1;
    
    IF v_template_id IS NOT NULL THEN
        -- Seed COA template data
        INSERT INTO public.template_chart_of_accounts (template_id, account_code, name, account_type, description) VALUES
        (v_template_id, '1000', 'Assets', 'asset', 'All company assets'),
        (v_template_id, '1100', 'Current Assets', 'asset', 'Assets convertible to cash within a year'),
        (v_template_id, '1110', 'Cash', 'asset', 'Cash in hand and bank'),
        (v_template_id, '1120', 'Accounts Receivable', 'asset', 'Money owed by customers'),
        (v_template_id, '1130', 'Inventory - Raw Materials', 'asset', 'Raw materials stock'),
        (v_template_id, '1140', 'Inventory - Work in Progress', 'asset', 'Partially completed goods'),
        (v_template_id, '1150', 'Inventory - Finished Goods', 'asset', 'Completed products ready for sale'),
        (v_template_id, '2000', 'Liabilities', 'liability', 'All company liabilities'),
        (v_template_id, '2100', 'Current Liabilities', 'liability', 'Obligations due within a year'),
        (v_template_id, '2110', 'Accounts Payable', 'liability', 'Money owed to suppliers'),
        (v_template_id, '2120', 'Salaries Payable', 'liability', 'Wages owed to employees'),
        (v_template_id, '3000', 'Equity', 'equity', 'Owner equity'),
        (v_template_id, '3100', 'Capital', 'equity', 'Owner investment'),
        (v_template_id, '4000', 'Revenue', 'income', 'All income'),
        (v_template_id, '4100', 'Sales Revenue', 'income', 'Revenue from product sales'),
        (v_template_id, '5000', 'Expenses', 'expense', 'All expenses'),
        (v_template_id, '5100', 'Cost of Goods Sold', 'expense', 'Direct costs of production'),
        (v_template_id, '5200', 'Operating Expenses', 'expense', 'General operating costs'),
        (v_template_id, '5210', 'Salaries Expense', 'expense', 'Employee wages'),
        (v_template_id, '5220', 'Utilities', 'expense', 'Electricity, water, etc.')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.organization_settings IS 'Organization-level configuration and inherited defaults';
COMMENT ON TABLE public.master_data_templates IS 'Reusable templates for master data';
COMMENT ON TABLE public.template_chart_of_accounts IS 'Chart of accounts template data';
COMMENT ON TABLE public.template_inventory_items IS 'Inventory item template data';
COMMENT ON TABLE public.state_transitions IS 'Allowed state transitions for business documents';
COMMENT ON VIEW public.v_production_order_costs IS 'Real-time cost analysis per production order';
COMMENT ON VIEW public.v_inventory_valuation IS 'Current inventory value by category';
COMMENT ON FUNCTION public.apply_template_to_org IS 'Apply master data template to organization';
COMMENT ON FUNCTION public.transition_state IS 'Centralized state transition handler with validation';
