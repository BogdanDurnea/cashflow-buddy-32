
-- Revoke execute on rate limit functions from public/anon to fix security warnings
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_all_expired_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_user_rate_limits(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_rate_limits_stats() FROM PUBLIC, anon, authenticated;

-- Grant execute only to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_all_expired_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_user_rate_limits(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rate_limits_stats() TO service_role;

-- check_rate_limit is called by edge functions via service_role
-- But it is also used in the existing flow, so keep it as-is but ensure proper permissions
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO service_role;

-- Verify: show function permissions
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE WHEN has_function_privilege('anon', p.oid, 'EXECUTE') THEN 'yes' ELSE 'no' END as anon_can_execute,
  CASE WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN 'yes' ELSE 'no' END as auth_can_execute,
  CASE WHEN has_function_privilege('service_role', p.oid, 'EXECUTE') THEN 'yes' ELSE 'no' END as service_can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('cleanup_expired_rate_limits', 'purge_all_expired_rate_limits', 'reset_user_rate_limits', 'get_rate_limits_stats', 'check_rate_limit');
