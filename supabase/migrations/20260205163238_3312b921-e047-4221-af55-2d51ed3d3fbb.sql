-- 1. Drop the problematic public UPDATE policy for report_shares
DROP POLICY IF EXISTS "Public can update view count for shared reports" ON public.report_shares;

-- 2. Update the leaderboard function to anonymize emails better
CREATE OR REPLACE FUNCTION public.get_achievements_leaderboard(limit_count integer DEFAULT 50)
RETURNS TABLE(user_id uuid, display_name text, achievement_count bigint, rank bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    ua.user_id,
    CONCAT('User #', SUBSTRING(ua.user_id::text, 1, 4)) as display_name,
    COUNT(ua.id) as achievement_count,
    RANK() OVER (ORDER BY COUNT(ua.id) DESC) as rank
  FROM public.user_achievements ua
  GROUP BY ua.user_id
  ORDER BY achievement_count DESC
  LIMIT limit_count
$function$;