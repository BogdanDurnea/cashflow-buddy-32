-- Create a function to get leaderboard data safely
CREATE OR REPLACE FUNCTION public.get_achievements_leaderboard(limit_count integer DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  achievement_count bigint,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ua.user_id,
    CONCAT(SPLIT_PART(p.email, '@', 1), '***') as display_name,
    COUNT(ua.id) as achievement_count,
    RANK() OVER (ORDER BY COUNT(ua.id) DESC) as rank
  FROM public.user_achievements ua
  JOIN public.profiles p ON p.id = ua.user_id
  GROUP BY ua.user_id, p.email
  ORDER BY achievement_count DESC
  LIMIT limit_count
$$;

-- Create a function to get current user's rank
CREATE OR REPLACE FUNCTION public.get_user_achievement_rank(target_user_id uuid)
RETURNS TABLE (
  achievement_count bigint,
  rank bigint,
  total_users bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_counts AS (
    SELECT 
      user_id,
      COUNT(id) as achievement_count,
      RANK() OVER (ORDER BY COUNT(id) DESC) as rank
    FROM public.user_achievements
    GROUP BY user_id
  ),
  total AS (
    SELECT COUNT(DISTINCT user_id) as total_users FROM public.user_achievements
  )
  SELECT 
    COALESCE(uc.achievement_count, 0) as achievement_count,
    COALESCE(uc.rank, (SELECT total_users + 1 FROM total)) as rank,
    (SELECT total_users FROM total) as total_users
  FROM (SELECT target_user_id as user_id) t
  LEFT JOIN user_counts uc ON uc.user_id = t.user_id
$$;