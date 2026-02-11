-- =====================================================
-- Cross-Module Event System
-- Enables automatic workflow triggers across modules
-- =====================================================

-- =====================================================
-- 1. EVENT QUEUE TABLE
-- =====================================================

CREATE TABLE public.business_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'order_confirmed', 'invoice_paid', etc.
    entity_type TEXT NOT NULL, -- 'production_order', 'invoice', etc.
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes for performance
CREATE INDEX idx_events_pending ON public.business_events(org_id, status, created_at)
WHERE status = 'pending';

CREATE INDEX idx_events_org_type ON public.business_events(org_id, event_type, created_at);

-- RLS Policies
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.business_events
FOR ALL
USING (org_id = (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

-- =====================================================
-- 2. EVENT HANDLERS CONFIGURATION
-- =====================================================

CREATE TABLE public.event_handlers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL UNIQUE,
    handler_function TEXT NOT NULL, -- RPC function name
    description TEXT,
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default handlers
INSERT INTO public.event_handlers (event_type, handler_function, description, priority) VALUES
('order_confirmed', 'handle_order_confirmation', 'Creates journal entry, production order, and checks inventory', 1),
('invoice_paid', 'handle_invoice_payment', 'Records payment and updates accounts', 2),
('stock_low', 'handle_low_stock_alert', 'Sends notification for low stock items', 3);

-- =====================================================
-- 3. HANDLER FUNCTIONS
-- =====================================================

-- Main orchestrator for order confirmation
CREATE OR REPLACE FUNCTION public.handle_order_confirmation(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_journal_id UUID;
    v_production_id UUID;
    v_inventory_check JSONB;
    v_result JSONB;
BEGIN
    -- Validate org_id matches
    SELECT * INTO v_order
    FROM public.production_orders
    WHERE id = p_order_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or access denied';
    END IF;
    
    -- Start transaction (implicit in function)
    BEGIN
        -- 1. Create Draft Journal Entry
        v_journal_id := public.create_journal_from_order(p_order_id, p_org_id);
        
        -- 2. Check Inventory Levels
        v_inventory_check := public.check_inventory_for_order(p_order_id, p_org_id);
        
        -- Build success result
        v_result := jsonb_build_object(
            'success', true,
            'journal_entry_id', v_journal_id,
            'production_order_id', p_order_id,
            'inventory_status', v_inventory_check,
            'timestamp', NOW()
        );
        
        RETURN v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Return error details
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'error_detail', SQLSTATE
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create journal entry from production order
CREATE OR REPLACE FUNCTION public.create_journal_from_order(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_order RECORD;
    v_journal_id UUID;
    v_revenue_account UUID;
    v_receivable_account UUID;
    v_order_amount NUMERIC;
BEGIN
    -- Get order details with org_id validation
    SELECT po.*, po.order_number, 
           COALESCE(po.total_value, 1000.00) as amount -- Default if no total_value column
    INTO v_order
    FROM public.production_orders po
    WHERE po.id = p_order_id AND po.org_id = p_org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found for journal creation';
    END IF;
    
    v_order_amount := v_order.amount;
    
    -- Get revenue account (Income type)
    SELECT id INTO v_revenue_account
    FROM public.chart_of_accounts
    WHERE org_id = p_org_id 
      AND account_type = 'income'
    ORDER BY created_at
    LIMIT 1;
    
    -- Get accounts receivable (Asset type)
    SELECT id INTO v_receivable_account
    FROM public.chart_of_accounts
    WHERE org_id = p_org_id 
      AND account_type = 'asset'
      AND (name ILIKE '%receivable%' OR name ILIKE '%debtor%')
    ORDER BY created_at
    LIMIT 1;
    
    -- If accounts don't exist, create default ones
    IF v_revenue_account IS NULL THEN
        INSERT INTO public.chart_of_accounts (org_id, account_code, name, account_type, currency)
        VALUES (p_org_id, '4000', 'Sales Revenue', 'income', 'PKR')
        RETURNING id INTO v_revenue_account;
    END IF;
    
    IF v_receivable_account IS NULL THEN
        INSERT INTO public.chart_of_accounts (org_id, account_code, name, account_type, currency)
        VALUES (p_org_id, '1200', 'Accounts Receivable', 'asset', 'PKR')
        RETURNING id INTO v_receivable_account;
    END IF;
    
    -- Create journal entry
    INSERT INTO public.journal_entries (org_id, entry_date, reference, narration, status)
    VALUES (
        p_org_id,
        CURRENT_DATE,
        'AUTO-' || v_order.order_number,
        'Auto-generated from Production Order #' || v_order.order_number,
        'draft'
    )
    RETURNING id INTO v_journal_id;
    
    -- Create GL lines (Double entry: Debit AR, Credit Revenue)
    INSERT INTO public.gl_lines (org_id, journal_entry_id, account_id, debit, credit, description)
    VALUES
        (p_org_id, v_journal_id, v_receivable_account, v_order_amount, 0, 'Order receivable'),
        (p_org_id, v_journal_id, v_revenue_account, 0, v_order_amount, 'Order revenue');
    
    RETURN v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check inventory levels for order
CREATE OR REPLACE FUNCTION public.check_inventory_for_order(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_bom RECORD;
    v_missing_items JSONB := '[]'::JSONB;
    v_has_bom BOOLEAN := false;
BEGIN
    -- Get order details
    SELECT * INTO v_order
    FROM public.production_orders
    WHERE id = p_order_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found for inventory check';
    END IF;
    
    -- Check if BOM exists for this product
    FOR v_bom IN
        SELECT 
            bom.id,
            bom.material_id,
            bom.quantity_required,
            i.name as material_name,
            i.quantity as available_qty,
            i.unit
        FROM public.bill_of_materials bom
        LEFT JOIN public.inventory i ON i.id = bom.material_id AND i.org_id = bom.org_id
        WHERE bom.product_id = v_order.product_id
          AND bom.org_id = p_org_id
    LOOP
        v_has_bom := true;
        
        -- Calculate required quantity based on order quantity
        DECLARE
            v_required NUMERIC := v_bom.quantity_required * COALESCE(v_order.quantity, 1);
            v_available NUMERIC := COALESCE(v_bom.available_qty, 0);
        BEGIN
            -- Check if sufficient quantity
            IF v_available < v_required THEN
                v_missing_items := v_missing_items || jsonb_build_object(
                    'material_id', v_bom.material_id,
                    'material_name', COALESCE(v_bom.material_name, 'Unknown Material'),
                    'required', v_required,
                    'available', v_available,
                    'shortage', v_required - v_available,
                    'unit', v_bom.unit
                );
            END IF;
        END;
    END LOOP;
    
    -- Return result
    RETURN jsonb_build_object(
        'has_bom', v_has_bom,
        'has_sufficient_inventory', jsonb_array_length(v_missing_items) = 0,
        'missing_items', v_missing_items,
        'total_shortages', jsonb_array_length(v_missing_items)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_order_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if status changed to 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        -- Insert event into queue
        INSERT INTO public.business_events (org_id, event_type, entity_type, entity_id, payload)
        VALUES (
            NEW.org_id,
            'order_confirmed',
            'production_order',
            NEW.id,
            jsonb_build_object(
                'order_id', NEW.id,
                'order_number', NEW.order_number,
                'product_id', NEW.product_id,
                'quantity', NEW.quantity,
                'confirmed_at', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to production_orders table
DROP TRIGGER IF EXISTS on_production_order_confirmed ON public.production_orders;

CREATE TRIGGER on_production_order_confirmed
AFTER INSERT OR UPDATE ON public.production_orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_order_confirmation();

-- =====================================================
-- 5. EVENT PROCESSING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_pending_events(
    p_org_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
    v_event RECORD;
    v_handler RECORD;
    v_result JSONB;
    v_processed INTEGER := 0;
    v_failed INTEGER := 0;
BEGIN
    -- Get pending events
    FOR v_event IN
        SELECT * FROM public.business_events
        WHERE status = 'pending'
          AND (p_org_id IS NULL OR org_id = p_org_id)
        ORDER BY created_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Mark as processing
        UPDATE public.business_events
        SET status = 'processing'
        WHERE id = v_event.id;
        
        -- Get handler
        SELECT * INTO v_handler
        FROM public.event_handlers
        WHERE event_type = v_event.event_type
          AND enabled = true;
        
        IF FOUND THEN
            BEGIN
                -- Execute handler function
                IF v_handler.handler_function = 'handle_order_confirmation' THEN
                    v_result := public.handle_order_confirmation(
                        v_event.entity_id,
                        v_event.org_id
                    );
                    
                    IF (v_result->>'success')::boolean THEN
                        -- Mark as completed
                        UPDATE public.business_events
                        SET status = 'completed',
                            processed_at = NOW()
                        WHERE id = v_event.id;
                        
                        v_processed := v_processed + 1;
                    ELSE
                        -- Mark as failed
                        UPDATE public.business_events
                        SET status = 'failed',
                            error_message = v_result->>'error',
                            processed_at = NOW()
                        WHERE id = v_event.id;
                        
                        v_failed := v_failed + 1;
                    END IF;
                END IF;
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Mark as failed
                    UPDATE public.business_events
                    SET status = 'failed',
                        error_message = SQLERRM,
                        processed_at = NOW()
                    WHERE id = v_event.id;
                    
                    v_failed := v_failed + 1;
            END;
        ELSE
            -- No handler found
            UPDATE public.business_events
            SET status = 'failed',
                error_message = 'No handler found for event type: ' || v_event.event_type,
                processed_at = NOW()
            WHERE id = v_event.id;
            
            v_failed := v_failed + 1;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed,
        'failed', v_failed,
        'total', v_processed + v_failed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.business_events TO authenticated;
GRANT SELECT ON public.event_handlers TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_order_confirmation TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_pending_events TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.business_events IS 'Event queue for cross-module workflow automation';
COMMENT ON TABLE public.event_handlers IS 'Configuration for event handler functions';
COMMENT ON FUNCTION public.handle_order_confirmation IS 'Orchestrates all automations when order is confirmed';
COMMENT ON FUNCTION public.create_journal_from_order IS 'Creates draft journal entry for confirmed order';
COMMENT ON FUNCTION public.check_inventory_for_order IS 'Validates inventory availability for order';
COMMENT ON FUNCTION public.process_pending_events IS 'Processes pending events from the queue';
