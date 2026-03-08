
-- Create a SECURITY DEFINER function to check shared budget membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_shared_budget_member(_user_id uuid, _budget_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_budget_members
    WHERE user_id = _user_id AND shared_budget_id = _budget_id
  )
$$;

-- Create a SECURITY DEFINER function to check shared budget ownership
CREATE OR REPLACE FUNCTION public.is_shared_budget_owner(_user_id uuid, _budget_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_budgets
    WHERE id = _budget_id AND owner_id = _user_id
  )
$$;

-- Fix shared_budgets SELECT policy to use security definer function
DROP POLICY IF EXISTS "Users can view shared budgets they are members of" ON public.shared_budgets;
CREATE POLICY "Users can view shared budgets they are members of"
ON public.shared_budgets
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() 
  OR public.is_shared_budget_member(auth.uid(), id)
);

-- Fix shared_budget_members policies
DROP POLICY IF EXISTS "Users can view members" ON public.shared_budget_members;
CREATE POLICY "Users can view members"
ON public.shared_budget_members
FOR SELECT
TO authenticated
USING (
  public.is_shared_budget_owner(auth.uid(), shared_budget_id)
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Owners can manage members" ON public.shared_budget_members;
CREATE POLICY "Owners can manage members"
ON public.shared_budget_members
FOR ALL
TO authenticated
USING (
  public.is_shared_budget_owner(auth.uid(), shared_budget_id)
);
