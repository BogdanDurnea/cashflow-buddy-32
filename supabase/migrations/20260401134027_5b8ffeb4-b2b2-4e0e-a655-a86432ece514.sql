
-- Fix 1: Add RLS INSERT policy for user_achievements (managed via RPC, but add safety net)
CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Add RLS DELETE policy for user_achievements
CREATE POLICY "Users can delete their own achievements"
ON public.user_achievements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix 3: Validate achievement IDs in unlock_achievement function
CREATE OR REPLACE FUNCTION public.unlock_achievement(_achievement_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF _achievement_id NOT IN (
    'first_transaction', 'ten_transactions', 'fifty_transactions', 'hundred_transactions',
    'first_income', 'first_expense',
    'first_budget', 'budget_keeper', 'category_budget',
    'first_goal', 'goal_achieved', 'big_saver',
    'week_streak', 'month_streak',
    'first_receipt', 'recurring_master', 'shared_budget', 'report_shared',
    'night_owl', 'early_bird'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (auth.uid(), _achievement_id)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- Drop the old overload that accepts _user_id parameter (security risk)
DROP FUNCTION IF EXISTS public.unlock_achievement(uuid, text);
