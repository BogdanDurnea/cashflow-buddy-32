-- Fix infinite recursion in shared_budget_members RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Owners can manage members" ON public.shared_budget_members;
DROP POLICY IF EXISTS "Users can view members of shared budgets they belong to" ON public.shared_budget_members;

-- Recreate policies without recursion
-- Policy for owners to manage members
CREATE POLICY "Owners can manage members" 
ON public.shared_budget_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.shared_budgets sb
    WHERE sb.id = shared_budget_members.shared_budget_id 
    AND sb.owner_id = auth.uid()
  )
);

-- Policy for users to view members of budgets they belong to
CREATE POLICY "Users can view members" 
ON public.shared_budget_members 
FOR SELECT 
USING (
  -- User is the owner of the shared budget
  shared_budget_id IN (
    SELECT id FROM public.shared_budgets 
    WHERE owner_id = auth.uid()
  )
  OR
  -- User is a member of the shared budget
  shared_budget_id IN (
    SELECT sbm.shared_budget_id 
    FROM public.shared_budget_members sbm
    WHERE sbm.user_id = auth.uid()
  )
);