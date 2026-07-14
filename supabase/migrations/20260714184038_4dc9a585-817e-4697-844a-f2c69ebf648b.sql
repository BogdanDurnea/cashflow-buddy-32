
-- Lock down SECURITY DEFINER functions: revoke public/anon/authenticated by default,
-- then grant EXECUTE only where the app actually needs it.

-- Admin/maintenance only (edge functions use service_role, which bypasses these revokes)
REVOKE ALL ON FUNCTION public.purge_all_expired_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_user_rate_limits(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_rate_limits_stats() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limits() FROM PUBLIC, anon, authenticated;

-- Trigger-only helpers, never called directly by clients
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Rate-limit check is invoked from edge functions with service_role
REVOKE ALL ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Achievements: authenticated users only
REVOKE ALL ON FUNCTION public.unlock_achievement(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_achievement(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_achievement_rank(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_achievement_rank(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_achievements_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_achievements_leaderboard(integer) TO authenticated;

-- Shared budget membership helpers: used inside RLS policies; authenticated only
REVOKE ALL ON FUNCTION public.is_shared_budget_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_shared_budget_member(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_shared_budget_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_shared_budget_owner(uuid, uuid) TO authenticated;

-- Shared reports: intentionally callable by anonymous visitors via token
REVOKE ALL ON FUNCTION public.get_shared_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_report(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.increment_report_view_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_report_view_count(text) TO anon, authenticated;
