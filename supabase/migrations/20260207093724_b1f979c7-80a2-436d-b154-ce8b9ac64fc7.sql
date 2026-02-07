
CREATE OR REPLACE FUNCTION public.get_achievements_leaderboard(limit_count integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, display_name text, achievement_count bigint, rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    ua.user_id,
    COALESCE(
      SPLIT_PART(p.email, '@', 1),
      CONCAT('User #', SUBSTRING(ua.user_id::text, 1, 4))
    ) as display_name,
    COUNT(ua.id) as achievement_count,
    RANK() OVER (ORDER BY COUNT(ua.id) DESC) as rank
  FROM public.user_achievements ua
  LEFT JOIN public.profiles p ON p.id = ua.user_id
  GROUP BY ua.user_id, p.email
  ORDER BY achievement_count DESC
  LIMIT limit_count
$$;
