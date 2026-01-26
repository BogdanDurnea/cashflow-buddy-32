-- Add RLS policy to allow users to remove themselves from shared budgets
-- This respects user autonomy while preventing owners from abandoning their budgets

CREATE POLICY "Users can remove themselves from shared budgets"
ON public.shared_budget_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND role != 'owner');