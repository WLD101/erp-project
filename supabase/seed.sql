-- Clean up existing data to avoid conflicts on repeated runs
TRUNCATE TABLE public.organizations CASCADE;
TRUNCATE TABLE auth.users CASCADE;

-- 1. Create Super Admin User (and other demo users)
-- Note: inserting into auth.users directly is for local dev/seeding only
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'super@demo.com', '{"name": "Super Admin"}'::jsonb, now()),
('00000000-0000-0000-0000-000000000002', 'admin@techcorp.com', '{"name": "Tech Corp Admin"}'::jsonb, now()),
('00000000-0000-0000-0000-000000000003', 'staff@techcorp.com', '{"name": "Tech Corp Staff"}'::jsonb, now()),
('00000000-0000-0000-0000-000000000004', 'admin@clothco.com', '{"name": "Cloth Co Admin"}'::jsonb, now()),
('00000000-0000-0000-0000-000000000005', 'viewer@clothco.com', '{"name": "Cloth Co Viewer"}'::jsonb, now());

-- 2. Create Demo Organizations
INSERT INTO public.organizations (id, name, is_active, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'System Admin Org', true, now()), -- For super admin
('22222222-2222-2222-2222-222222222222', 'TechCorp Industries', true, now()),
('33333333-3333-3333-3333-333333333333', 'ClothCo Textiles', true, now()),
('44444444-4444-4444-4444-444444444444', 'Inactive Fabrics Ltd', false, now() - interval '50 days'), -- Deactivated > 45 days for alert test
('55555555-5555-5555-5555-555555555555', 'Startup Weavers', true, now());

-- 3. Create Profiles (Linking Users to Orgs)
INSERT INTO public.profiles (id, org_id, role) VALUES
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'super_admin'),
('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'admin'),
('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'staff'),
('00000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'admin'),
('00000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'viewer');

-- 4. Seed Inventory for TechCorp
INSERT INTO public.inventory (org_id, item_name, quantity) VALUES
('22222222-2222-2222-2222-222222222222', 'Cotton Bale Type A', 500),
('22222222-2222-2222-2222-222222222222', 'Polyester Thread Spool', 1200),
('22222222-2222-2222-2222-222222222222', 'Industrial Loom Spare Parts', 50);

-- 5. Seed Inventory for ClothCo
INSERT INTO public.inventory (org_id, item_name, quantity) VALUES
('33333333-3333-3333-3333-333333333333', 'Silk Fabric Roll', 150),
('33333333-3333-3333-3333-333333333333', 'Dye Drum (Red)', 20);

-- 6. Seed Transactions (Trigger Partition Creation)
INSERT INTO public.inventory_transactions (org_id, transaction_type, quantity, created_by) VALUES
('22222222-2222-2222-2222-222222222222', 'INBOUND', 100, '00000000-0000-0000-0000-000000000002'),
('33333333-3333-3333-3333-333333333333', 'OUTBOUND', 10, '00000000-0000-0000-0000-000000000004');
