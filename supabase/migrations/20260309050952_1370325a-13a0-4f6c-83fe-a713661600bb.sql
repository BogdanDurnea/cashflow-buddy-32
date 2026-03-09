
-- Fix 1: Add RLS policy to deny direct SELECT access to report_shares
-- Access must go through the get_shared_report() function
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny direct SELECT access - use get_shared_report function" 
ON public.report_shares 
FOR SELECT 
USING (false);

-- Fix 2: Remove INSERT policy that allows users to self-grant achievements
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

-- Add function to handle achievement unlocking server-side
CREATE OR REPLACE FUNCTION public.unlock_achievement(
  _user_id uuid,
  _achievement_id text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (_user_id, _achievement_id)
  ON CONFLICT DO NOTHING;
  SELECT true;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_achievement(uuid, text) TO authenticated;
