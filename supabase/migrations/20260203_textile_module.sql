-- 20260203_textile_module.sql

-- FEATURE GATING: All tables below enforce "textile_manufacturing" feature check in RLS.

-- 1. MACHINES & CAPACITY

CREATE TABLE public.machines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL, -- 'Loom #4', 'Dyeing Vat A'
    type text NOT NULL, -- 'WEAVING', 'DYEING', 'STITCHING'
    daily_capacity numeric DEFAULT 0, -- Output per day (e.g. 500 meters)
    uom text DEFAULT 'meters', -- Unit of Measure
    status text DEFAULT 'active', -- 'active', 'maintenance', 'retired'
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise tenants view machines" ON public.machines 
    FOR ALL TO authenticated 
    USING (
        org_id = public.auth_org_id() 
        AND public.org_has_feature('textile_manufacturing')
    );


-- 2. PRODUCTION ORDERS

CREATE TABLE public.production_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    order_number text NOT NULL, -- 'PO-2026-001'
    customer_name text, 
    start_date date NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'hold'
    total_quantity numeric NOT NULL,
    item_name text NOT NULL, -- 'Cotton 60x60'
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(org_id, order_number)
);

ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise tenants view orders" ON public.production_orders
    FOR ALL TO authenticated 
    USING (
        org_id = public.auth_org_id() 
        AND public.org_has_feature('textile_manufacturing')
    );


-- 3. BILL OF MATERIALS (BOM)

CREATE TABLE public.bill_of_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    production_order_id uuid REFERENCES public.production_orders(id) ON DELETE CASCADE,
    material_name text NOT NULL, -- 'Yarn 40s Single'
    required_qty numeric NOT NULL,
    uom text DEFAULT 'kg',
    allocated_qty numeric DEFAULT 0 -- Actual reserved from Inventory
);

ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise tenants view BOM" ON public.bill_of_materials
    FOR ALL TO authenticated 
    USING (
        org_id = public.auth_org_id() 
        AND public.org_has_feature('textile_manufacturing')
    );


-- 4. PROCESS STEPS (Routing)

CREATE TABLE public.production_processes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    production_order_id uuid REFERENCES public.production_orders(id) ON DELETE CASCADE,
    sequence_order int NOT NULL, -- 1, 2, 3
    process_name text NOT NULL, -- 'Weaving', 'Dyeing'
    assigned_machine_id uuid REFERENCES public.machines(id),
    planned_start date,
    planned_end date,
    actual_start date,
    actual_end date,
    status text DEFAULT 'pending'
);

ALTER TABLE public.production_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise tenants view processes" ON public.production_processes
    FOR ALL TO authenticated 
    USING (
        org_id = public.auth_org_id() 
        AND public.org_has_feature('textile_manufacturing')
    );


-- 5. TIME & ACTION (T&A) CALENDAR

CREATE TABLE public.tna_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL, -- 'Standard Export Order T&A'
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.tna_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES public.tna_templates(id) ON DELETE CASCADE,
    task_name text NOT NULL, -- 'Lab Dips', 'Fabric In-house', 'Accessories'
    days_offset int NOT NULL -- Days from Start Date
);

CREATE TABLE public.order_tna_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    production_order_id uuid REFERENCES public.production_orders(id) ON DELETE CASCADE,
    task_name text NOT NULL,
    planned_date date NOT NULL,
    actual_date date,
    status text DEFAULT 'pending', -- 'pending', 'completed', 'delayed'
    remarks text
);

ALTER TABLE public.tna_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tna_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tna_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise T&A Access" ON public.order_tna_status
    FOR ALL TO authenticated 
    USING (
        org_id = public.auth_org_id() 
        AND public.org_has_feature('textile_manufacturing')
    );


-- 6. CAPACITY PLANNING HELPER

CREATE OR REPLACE FUNCTION public.check_machine_availability(
    target_machine_id uuid,
    req_start date,
    req_end date
)
RETURNS TABLE (
    is_available boolean,
    conflict_order text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        NOT EXISTS (
            SELECT 1 FROM public.production_processes 
            WHERE assigned_machine_id = target_machine_id
            AND status NOT IN ('completed', 'cancelled')
            AND (planned_start, planned_end) OVERLAPS (req_start, req_end)
        ),
        (
            SELECT po.order_number 
            FROM public.production_processes pp
            JOIN public.production_orders po ON pp.production_order_id = po.id
            WHERE pp.assigned_machine_id = target_machine_id
            AND pp.status NOT IN ('completed', 'cancelled')
            AND (pp.planned_start, pp.planned_end) OVERLAPS (req_start, req_end)
            LIMIT 1
        );
END;
$$;
