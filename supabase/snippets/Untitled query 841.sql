-- Check for the function existence
SELECT routinename, routine_schema, security_type 
FROM pg_proc 
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
WHERE routinename = 'custom_access_token_hook';

-- Check permissions (should be executable by supabase_auth_admin)
SELECT grantee, privilege_type 
FROM information_schema.role_routine_grants 
WHERE routine_name = 'custom_access_token_hook';