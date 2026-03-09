
-- Fix 1: Drop the INSERT policy on user_achievements
-- Achievement unlocking must go through unlock_achievement() SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can unlock their own achievements" ON public.user_achievements;

-- Fix 2: Replace the ALL policy on shared_budget_members with specific command policies
-- The ALL restrictive policy blocks non-owner SELECT and DELETE
DROP POLICY IF EXISTS "Owners can manage members" ON public.shared_budget_members;

-- Owners can INSERT new members
CREATE POLICY "Owners can insert members"
ON public.shared_budget_members
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (is_shared_budget_owner(auth.uid(), shared_budget_id));

-- Owners can UPDATE members
CREATE POLICY "Owners can update members"
ON public.shared_budget_members
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (is_shared_budget_owner(auth.uid(), shared_budget_id));

-- Owners can DELETE members
CREATE POLICY "Owners can delete members"
ON public.shared_budget_members
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (is_shared_budget_owner(auth.uid(), shared_budget_id));
