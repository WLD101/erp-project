-- =====================================================
-- ADVANCED ERP INTEGRATION - PHASE 1
-- Location-Based Inventory System (Double-Entry)
-- =====================================================

-- =====================================================
-- 1. LOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    location_code TEXT NOT NULL,
    name TEXT NOT NULL,
    location_type TEXT NOT NULL CHECK (location_type IN (
        'warehouse',
        'production_floor',
        'quality_control',
        'supplier',
        'customer',
        'scrap',
        'virtual'
    )),
    parent_location_id UUID REFERENCES public.locations(id),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, location_code)
);

CREATE INDEX idx_locations_org ON public.locations(org_id);
CREATE INDEX idx_locations_type ON public.locations(org_id, location_type);
CREATE INDEX idx_locations_active ON public.locations(org_id, is_active);
CREATE INDEX idx_locations_parent ON public.locations(parent_location_id);

-- RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_access" ON public.locations
FOR ALL USING (org_id = (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

-- =====================================================
-- 2. MODIFY INVENTORY_TRANSACTIONS TABLE
-- =====================================================

-- Add location tracking columns
ALTER TABLE public.inventory_transactions
ADD COLUMN IF NOT EXISTS source_location_id UUID REFERENCES public.locations(id),
ADD COLUMN IF NOT EXISTS destination_location_id UUID REFERENCES public.locations(id),
ADD COLUMN IF NOT EXISTS move_type TEXT CHECK (move_type IN (
    'receipt',        -- Supplier → Warehouse
    'issue',          -- Warehouse → Production
    'transfer',       -- Location A → Location B
    'adjustment',     -- Inventory count adjustment
    'return',         -- Production → Warehouse
    'shipment',       -- Warehouse → Customer
    'scrap'           -- Any → Scrap
)),
ADD COLUMN IF NOT EXISTS reference_type TEXT, -- 'production_order', 'purchase_order', 'sales_order'
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_inv_trans_source_loc ON public.inventory_transactions(source_location_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_dest_loc ON public.inventory_transactions(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_move_type ON public.inventory_transactions(org_id, move_type);
CREATE INDEX IF NOT EXISTS idx_inv_trans_reference ON public.inventory_transactions(reference_type, reference_id);

-- Add constraint: most moves need both source and destination
ALTER TABLE public.inventory_transactions
DROP CONSTRAINT IF EXISTS check_locations;

ALTER TABLE public.inventory_transactions
ADD CONSTRAINT check_locations CHECK (
    (move_type = 'adjustment' AND destination_location_id IS NOT NULL) OR
    (move_type = 'receipt' AND destination_location_id IS NOT NULL) OR
    (move_type = 'shipment' AND source_location_id IS NOT NULL) OR
    (move_type IN ('issue', 'transfer', 'return', 'scrap') AND source_location_id IS NOT NULL AND destination_location_id IS NOT NULL)
);

-- =====================================================
-- 3. LOCATION INVENTORY BALANCES VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.v_location_inventory AS
SELECT 
    inv.org_id,
    inv.id as item_id,
    inv.name as item_name,
    inv.item_code,
    inv.category,
    loc.id as location_id,
    loc.name as location_name,
    loc.location_type,
    
    -- Calculate balance from transactions
    COALESCE(
        (SELECT SUM(quantity) 
         FROM public.inventory_transactions t
         WHERE t.item_id = inv.id 
           AND t.destination_location_id = loc.id
           AND t.org_id = inv.org_id),
        0
    ) - COALESCE(
        (SELECT SUM(quantity)
         FROM public.inventory_transactions t
         WHERE t.item_id = inv.id
           AND t.source_location_id = loc.id
           AND t.org_id = inv.org_id),
        0
    ) as quantity_on_hand,
    
    inv.unit,
    COALESCE(inv.unit_cost, 0) as unit_cost,
    
    -- Value at location
    (COALESCE(
        (SELECT SUM(quantity) 
         FROM public.inventory_transactions t
         WHERE t.item_id = inv.id 
           AND t.destination_location_id = loc.id
           AND t.org_id = inv.org_id),
        0
    ) - COALESCE(
        (SELECT SUM(quantity)
         FROM public.inventory_transactions t
         WHERE t.item_id = inv.id
           AND t.source_location_id = loc.id
           AND t.org_id = inv.org_id),
        0
    )) * COALESCE(inv.unit_cost, 0) as value_on_hand

FROM public.inventory inv
CROSS JOIN public.locations loc
WHERE inv.org_id = loc.org_id
  AND loc.is_active = true;

GRANT SELECT ON public.v_location_inventory TO authenticated;

-- =====================================================
-- 4. INVENTORY MOVE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_inventory_move(
    p_org_id UUID,
    p_item_id UUID,
    p_quantity NUMERIC,
    p_source_location_id UUID DEFAULT NULL,
    p_destination_location_id UUID DEFAULT NULL,
    p_move_type TEXT DEFAULT 'transfer',
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_move_id UUID;
    v_source_qty NUMERIC;
    v_item RECORD;
    v_source_loc RECORD;
    v_dest_loc RECORD;
BEGIN
    -- Validate item exists
    SELECT * INTO v_item FROM public.inventory 
    WHERE id = p_item_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Item not found');
    END IF;
    
    -- Validate locations
    IF p_source_location_id IS NOT NULL THEN
        SELECT * INTO v_source_loc FROM public.locations
        WHERE id = p_source_location_id AND org_id = p_org_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Source location not found');
        END IF;
    END IF;
    
    IF p_destination_location_id IS NOT NULL THEN
        SELECT * INTO v_dest_loc FROM public.locations
        WHERE id = p_destination_location_id AND org_id = p_org_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Destination location not found');
        END IF;
    END IF;
    
    -- Validate quantity
    IF p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quantity must be greater than 0');
    END IF;
    
    -- Check source has sufficient quantity (except for receipts/adjustments)
    IF p_move_type NOT IN ('receipt', 'adjustment') AND p_source_location_id IS NOT NULL THEN
        SELECT COALESCE(quantity_on_hand, 0) INTO v_source_qty
        FROM public.v_location_inventory
        WHERE item_id = p_item_id 
          AND location_id = p_source_location_id
          AND org_id = p_org_id;
        
        IF v_source_qty < p_quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Insufficient quantity at %s. Available: %s, Required: %s', 
                    v_source_loc.name, v_source_qty, p_quantity)
            );
        END IF;
    END IF;
    
    -- Create the inventory transaction
    INSERT INTO public.inventory_transactions (
        org_id, 
        item_id, 
        quantity, 
        transaction_type,
        source_location_id, 
        destination_location_id, 
        move_type,
        reference_type, 
        reference_id,
        notes,
        created_at
    ) VALUES (
        p_org_id, 
        p_item_id, 
        p_quantity, 
        'move',
        p_source_location_id, 
        p_destination_location_id, 
        p_move_type,
        p_reference_type, 
        p_reference_id,
        p_notes,
        NOW()
    ) RETURNING id INTO v_move_id;
    
    -- Update main inventory quantity (total across all locations)
    -- For receipts/adjustments: increase total
    IF p_move_type IN ('receipt', 'adjustment') THEN
        UPDATE public.inventory
        SET quantity = quantity + p_quantity,
            updated_at = NOW()
        WHERE id = p_item_id AND org_id = p_org_id;
    END IF;
    
    -- For shipments/scrap: decrease total
    IF p_move_type IN ('shipment', 'scrap') THEN
        UPDATE public.inventory
        SET quantity = quantity - p_quantity,
            updated_at = NOW()
        WHERE id = p_item_id AND org_id = p_org_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'move_id', v_move_id,
        'message', format('Moved %s %s from %s to %s', 
            p_quantity, 
            v_item.unit,
            COALESCE(v_source_loc.name, 'External'),
            COALESCE(v_dest_loc.name, 'External')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_inventory_move TO authenticated;

-- =====================================================
-- 5. GET LOCATION INVENTORY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_location_inventory(
    p_org_id UUID,
    p_location_id UUID DEFAULT NULL,
    p_item_id UUID DEFAULT NULL
)
RETURNS TABLE (
    item_id UUID,
    item_name TEXT,
    item_code TEXT,
    category TEXT,
    location_id UUID,
    location_name TEXT,
    location_type TEXT,
    quantity_on_hand NUMERIC,
    unit TEXT,
    unit_cost NUMERIC,
    value_on_hand NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.item_id,
        v.item_name,
        v.item_code,
        v.category,
        v.location_id,
        v.location_name,
        v.location_type,
        v.quantity_on_hand,
        v.unit,
        v.unit_cost,
        v.value_on_hand
    FROM public.v_location_inventory v
    WHERE v.org_id = p_org_id
      AND (p_location_id IS NULL OR v.location_id = p_location_id)
      AND (p_item_id IS NULL OR v.item_id = p_item_id)
      AND v.quantity_on_hand > 0
    ORDER BY v.location_name, v.item_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_location_inventory TO authenticated;

-- =====================================================
-- 6. RESERVE MATERIALS FOR ORDER (Enhanced)
-- =====================================================

CREATE OR REPLACE FUNCTION public.reserve_materials_for_order(
    p_order_id UUID,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_bom RECORD;
    v_warehouse_id UUID;
    v_production_id UUID;
    v_shortage_items JSONB := '[]'::jsonb;
    v_reserved_count INTEGER := 0;
BEGIN
    -- Get order details
    SELECT * INTO v_order FROM public.production_orders
    WHERE id = p_order_id AND org_id = p_org_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Get default warehouse and production locations
    SELECT id INTO v_warehouse_id FROM public.locations
    WHERE org_id = p_org_id AND location_type = 'warehouse' AND is_active = true
    LIMIT 1;
    
    SELECT id INTO v_production_id FROM public.locations
    WHERE org_id = p_org_id AND location_type = 'production_floor' AND is_active = true
    LIMIT 1;
    
    IF v_warehouse_id IS NULL OR v_production_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Default locations not configured');
    END IF;
    
    -- Loop through BOM items
    FOR v_bom IN 
        SELECT bom.*, inv.name as material_name, inv.unit
        FROM public.bill_of_materials bom
        JOIN public.inventory inv ON inv.id = bom.material_id
        WHERE bom.product_id = v_order.product_id
          AND bom.org_id = p_org_id
    LOOP
        DECLARE
            v_required_qty NUMERIC;
            v_available_qty NUMERIC;
        BEGIN
            v_required_qty := v_bom.quantity_required * v_order.quantity;
            
            -- Check availability at warehouse
            SELECT COALESCE(quantity_on_hand, 0) INTO v_available_qty
            FROM public.v_location_inventory
            WHERE item_id = v_bom.material_id
              AND location_id = v_warehouse_id
              AND org_id = p_org_id;
            
            IF v_available_qty < v_required_qty THEN
                -- Add to shortage list
                v_shortage_items := v_shortage_items || jsonb_build_object(
                    'material_id', v_bom.material_id,
                    'material_name', v_bom.material_name,
                    'required', v_required_qty,
                    'available', v_available_qty,
                    'shortage', v_required_qty - v_available_qty,
                    'unit', v_bom.unit
                );
            ELSE
                -- Create inventory move: Warehouse → Production
                PERFORM public.create_inventory_move(
                    p_org_id,
                    v_bom.material_id,
                    v_required_qty,
                    v_warehouse_id,
                    v_production_id,
                    'issue',
                    'production_order',
                    p_order_id,
                    format('Reserved for Order %s', v_order.order_number)
                );
                
                v_reserved_count := v_reserved_count + 1;
            END IF;
        END;
    END LOOP;
    
    IF jsonb_array_length(v_shortage_items) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient materials',
            'reserved_count', v_reserved_count,
            'shortage_items', v_shortage_items
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'reserved_count', v_reserved_count,
        'message', format('Reserved %s materials for production', v_reserved_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. SEED DEFAULT LOCATIONS
-- =====================================================

-- Function to seed default locations for an organization
CREATE OR REPLACE FUNCTION public.seed_default_locations(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_created_count INTEGER := 0;
BEGIN
    -- Main Warehouse
    INSERT INTO public.locations (org_id, location_code, name, location_type)
    VALUES (p_org_id, 'WH-MAIN', 'Main Warehouse', 'warehouse')
    ON CONFLICT (org_id, location_code) DO NOTHING;
    GET DIAGNOSTICS v_created_count = ROW_COUNT;
    
    -- Production Floor
    INSERT INTO public.locations (org_id, location_code, name, location_type)
    VALUES (p_org_id, 'PROD-FLOOR', 'Production Floor', 'production_floor')
    ON CONFLICT (org_id, location_code) DO NOTHING;
    
    -- Quality Control
    INSERT INTO public.locations (org_id, location_code, name, location_type)
    VALUES (p_org_id, 'QC-AREA', 'Quality Control Area', 'quality_control')
    ON CONFLICT (org_id, location_code) DO NOTHING;
    
    -- Scrap/Waste
    INSERT INTO public.locations (org_id, location_code, name, location_type)
    VALUES (p_org_id, 'SCRAP', 'Scrap & Waste', 'scrap')
    ON CONFLICT (org_id, location_code) DO NOTHING;
    
    -- Virtual (for adjustments)
    INSERT INTO public.locations (org_id, location_code, name, location_type)
    VALUES (p_org_id, 'VIRTUAL', 'Virtual Location', 'virtual')
    ON CONFLICT (org_id, location_code) DO NOTHING;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Default locations created'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.seed_default_locations TO authenticated;

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE public.locations IS 'Physical and virtual locations for inventory tracking';
COMMENT ON TABLE public.inventory_transactions IS 'Enhanced with source/destination location tracking for double-entry inventory';
COMMENT ON VIEW public.v_location_inventory IS 'Real-time inventory balances per location';
COMMENT ON FUNCTION public.create_inventory_move IS 'Create inventory movement with source/destination validation';
COMMENT ON FUNCTION public.get_location_inventory IS 'Get current inventory levels at specific locations';
COMMENT ON FUNCTION public.reserve_materials_for_order IS 'Reserve materials from warehouse to production floor';
COMMENT ON FUNCTION public.seed_default_locations IS 'Create default locations for new organization';
