
-- Update leaderboard function to not expose email prefixes
CREATE OR REPLACE FUNCTION public.get_achievements_leaderboard(limit_count integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, display_name text, achievement_count bigint, rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    ua.user_id,
    CONCAT('User #', SUBSTRING(ua.user_id::text, 1, 4)) as display_name,
    COUNT(ua.id) as achievement_count,
    RANK() OVER (ORDER BY COUNT(ua.id) DESC) as rank
  FROM public.user_achievements ua
  GROUP BY ua.user_id
  ORDER BY achievement_count DESC
  LIMIT limit_count
$$;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_achievements_leaderboard(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_achievement_rank(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_achievements_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_achievement_rank(uuid) TO authenticated;
