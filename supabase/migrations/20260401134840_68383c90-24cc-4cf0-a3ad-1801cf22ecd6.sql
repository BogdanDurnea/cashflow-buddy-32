
-- Fix 1: Remove INSERT and DELETE policies from user_achievements
-- Achievements should ONLY be granted via the unlock_achievement SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON public.user_achievements;

-- Fix 2: Add scoped SELECT policy on profiles for shared budget co-members
CREATE POLICY "Shared budget members can view co-member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT sbm.user_id
    FROM public.shared_budget_members sbm
    WHERE sbm.shared_budget_id IN (
      SELECT sbm2.shared_budget_id
      FROM public.shared_budget_members sbm2
      WHERE sbm2.user_id = auth.uid()
    )
  )
);
