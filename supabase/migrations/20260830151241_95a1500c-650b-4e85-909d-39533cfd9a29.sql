-- 1) Revoke default EXECUTE from PUBLIC/anon/authenticated on ALL functions in public schema
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', r.proname, r.args);
  END LOOP;
END $$;

-- 2) Re-grant only what features actually need

-- Public shared reports: token-gated, callable by anyone (including anonymous visitors)
GRANT EXECUTE ON FUNCTION public.get_shared_report(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_report_view_count(text) TO anon, authenticated;

-- Gamification & shared budgets: signed-in users only
GRANT EXECUTE ON FUNCTION public.get_achievements_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_achievement_rank(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_achievement(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shared_budget_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shared_budget_owner(uuid, uuid) TO authenticated;

-- Rate limiting & maintenance: service role only (edge functions)
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_all_expired_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_user_rate_limits(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rate_limits_stats() TO service_role;

-- Trigger functions: not callable via API at all (triggers fire regardless of grants)
-- handle_new_user, handle_updated_at intentionally left with no grants.