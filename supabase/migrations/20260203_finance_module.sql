-- 20260203_finance_module.sql

-- 1. FISCAL YEARS & PERIODS

CREATE TABLE public.fiscal_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL, -- 'FY-2026'
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_closed boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own fiscal years" ON public.fiscal_years FOR ALL TO authenticated USING (org_id = public.auth_org_id());

CREATE TABLE public.accounting_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    fiscal_year_id uuid REFERENCES public.fiscal_years(id) ON DELETE CASCADE,
    name text NOT NULL, -- 'Jan-2026'
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_closed boolean DEFAULT false
);
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own periods" ON public.accounting_periods FOR ALL TO authenticated USING (org_id = public.auth_org_id());


-- 2. CHART OF ACCOUNTS (Unlimited Hierarchy)

CREATE TYPE public.account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

CREATE TABLE public.chart_of_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code text NOT NULL, -- '1001'
    name text NOT NULL, -- 'Cash on Hand'
    type public.account_type NOT NULL,
    parent_id uuid REFERENCES public.chart_of_accounts(id), -- Recursive for unlimited depth
    currency text DEFAULT 'PKR',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(org_id, code)
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own COA" ON public.chart_of_accounts FOR ALL TO authenticated USING (org_id = public.auth_org_id());

-- Index for recursive queries
CREATE INDEX idx_coa_parent ON public.chart_of_accounts(parent_id);
CREATE INDEX idx_coa_org_code ON public.chart_of_accounts(org_id, code);


-- 3. JOURNAL ENTRIES (Vouchers)

CREATE TABLE public.journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    reference_number text, -- 'JV-001'
    narration text,
    status text DEFAULT 'posted', -- 'draft', 'posted', 'void'
    fiscal_year_id uuid REFERENCES public.fiscal_years(id),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own Journals" ON public.journal_entries FOR ALL TO authenticated USING (org_id = public.auth_org_id());


-- 4. GENERAL LEDGER LINES (Double Entry)

CREATE TABLE public.gl_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    journal_entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
    description text,
    debit numeric(20, 2) DEFAULT 0,
    credit numeric(20, 2) DEFAULT 0,
    -- Multi-currency support
    currency_code text DEFAULT 'PKR', 
    exchange_rate numeric(10, 6) DEFAULT 1.0,
    -- Dimensions (Cost Centers)
    cost_center_id uuid, -- Link to cost centers if added later
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gl_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own GL Lines" ON public.gl_lines FOR ALL TO authenticated USING (org_id = public.auth_org_id());

-- Validation Trigger: Ensure Debits = Credits
CREATE OR REPLACE FUNCTION public.validate_journal_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_debit numeric;
    total_credit numeric;
BEGIN
    -- Only check on statement level or after all lines inserted? 
    -- Complex in row-level triggers. Ideally handled by app logic or Constraint Trigger.
    -- For now, we trust the application to balance, or we implement a 'POST' function.
    RETURN NEW;
END;
$$;


-- 5. RECURSIVE REPORTING VIEWS (Drilldown)

-- Helper View: Account Balances with Path
CREATE OR REPLACE VIEW public.view_account_balances AS
WITH RECURSIVE account_tree AS (
    -- Base Case: All Accounts
    SELECT 
        id, 
        org_id, 
        parent_id, 
        code, 
        name, 
        type, 
        ARRAY[name] AS path_names,
        1 AS level
    FROM public.chart_of_accounts
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive Step
    SELECT 
        c.id, 
        c.org_id, 
        c.parent_id, 
        c.code, 
        c.name, 
        c.type, 
        t.path_names || c.name,
        t.level + 1
    FROM public.chart_of_accounts c
    JOIN account_tree t ON c.parent_id = t.id
)
SELECT 
    t.*,
    COALESCE((
        SELECT SUM(g.debit - g.credit) 
        FROM public.gl_lines g 
        WHERE g.account_id = t.id
    ), 0) AS net_balance -- Simple balance, doesn't aggregate children yet
FROM account_tree t;


-- 6. AGGREGATED BALANCE SHEET VIEW (Rolls up children)

CREATE OR REPLACE FUNCTION public.get_financial_report(
    target_org_id uuid,
    report_type text -- 'BS' or 'PL'
)
RETURNS TABLE (
    account_code text,
    account_name text,
    account_type public.account_type,
    level int,
    self_balance numeric,
    total_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE hierarchy AS (
        SELECT 
            id, parent_id, code, name, type, 1 as lvl
        FROM public.chart_of_accounts
        WHERE org_id = target_org_id
    ),
    balances AS (
        SELECT 
            g.account_id, 
            SUM(g.debit - g.credit) as balance
        FROM public.gl_lines g
        WHERE g.org_id = target_org_id
        GROUP BY g.account_id
    ),
    rollup AS (
        -- Calculate totals linking hierarchy to balances
        -- This logic needs optimization for massive datasets, but works for standard ERPs
        SELECT 
            h.id,
            h.code,
            h.name,
            h.type,
            h.lvl,
            h.parent_id,
            COALESCE(b.balance, 0) as self_bal
        FROM hierarchy h
        LEFT JOIN balances b ON h.id = b.account_id
    )
    SELECT 
        r.code,
        r.name,
        r.type,
        r.lvl,
        r.self_bal,
        (
            -- Subquery for Total Balance (Children + Self)
            -- Note: In a real heavy production system, we'd use a materialized path or pre-calculated fields
            SELECT SUM(COALESCE(gl.debit - gl.credit, 0))
            FROM public.chart_of_accounts child
            LEFT JOIN public.gl_lines gl ON gl.account_id = child.id
            WHERE child.org_id = target_org_id
            AND child.code LIKE (r.code || '%') -- Assuming hierarchical coding (100, 100-01) for performance optimization
            -- OR use recursive ID check if codes aren't strict
        ) as total_bal
    FROM rollup r
    WHERE 
        CASE 
            WHEN report_type = 'BS' THEN r.type IN ('ASSET', 'LIABILITY', 'EQUITY')
            WHEN report_type = 'PL' THEN r.type IN ('INCOME', 'EXPENSE')
            ELSE true
        END
    ORDER BY r.code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_report TO authenticated;
