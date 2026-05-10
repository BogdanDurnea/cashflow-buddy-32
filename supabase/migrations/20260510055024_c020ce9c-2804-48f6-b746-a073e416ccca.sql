
-- Revoke authenticated from check_rate_limit too (only service_role should call it)
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM authenticated;

-- Verify final permissions
SELECT 
  p.proname as function_name,
  CASE WHEN has_function_privilege('anon', p.oid, 'EXECUTE') THEN 'yes' ELSE 'no' END as anon,
  CASE WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN 'yes' ELSE 'no' END as authenticated,
  CASE WHEN has_function_privilege('service_role', p.oid, 'EXECUTE') THEN 'yes' ELSE 'no' END as service_role
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('cleanup_expired_rate_limits', 'purge_all_expired_rate_limits', 'reset_user_rate_limits', 'get_rate_limits_stats', 'check_rate_limit');
