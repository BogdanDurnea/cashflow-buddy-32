CREATE OR REPLACE FUNCTION public.unlock_achievement(_achievement_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (auth.uid(), _achievement_id)
  ON CONFLICT DO NOTHING;
  SELECT true;
$$;