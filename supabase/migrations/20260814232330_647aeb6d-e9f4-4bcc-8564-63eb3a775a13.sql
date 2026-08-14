-- 1) Lock down internal SECURITY DEFINER helpers (used only inside RLS policies)
REVOKE ALL ON FUNCTION public.is_shared_budget_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_shared_budget_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_shared_budget_member(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_shared_budget_owner(uuid, uuid) TO service_role;

-- 2) Public share-token RPCs: minimal exposure + revoked check
CREATE OR REPLACE FUNCTION public.increment_report_view_count(token_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.report_shares
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE share_token = token_param
    AND revoked = false
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;
REVOKE ALL ON FUNCTION public.increment_report_view_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_report_view_count(text) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_shared_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_report(text) TO anon, authenticated, service_role;

-- 3) Ensure report_shares itself is never readable without a validated token
REVOKE ALL ON TABLE public.report_shares FROM anon;

-- 4) Shared budget membership: constrain roles and prevent privilege escalation
ALTER TABLE public.shared_budget_members
  DROP CONSTRAINT IF EXISTS shared_budget_members_role_check;
ALTER TABLE public.shared_budget_members
  ADD CONSTRAINT shared_budget_members_role_check
  CHECK (role IN ('owner', 'editor', 'viewer'));

DROP POLICY IF EXISTS "Owners can insert members" ON public.shared_budget_members;
CREATE POLICY "Owners can insert members"
ON public.shared_budget_members
FOR INSERT TO authenticated
WITH CHECK (
  public.is_shared_budget_owner(auth.uid(), shared_budget_id)
  AND (
    role IN ('editor', 'viewer')
    OR (role = 'owner' AND user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Owners can update members" ON public.shared_budget_members;
CREATE POLICY "Owners can update members"
ON public.shared_budget_members
FOR UPDATE TO authenticated
USING (public.is_shared_budget_owner(auth.uid(), shared_budget_id))
WITH CHECK (
  public.is_shared_budget_owner(auth.uid(), shared_budget_id)
  AND role IN ('editor', 'viewer')
);

-- 5) Members can see co-members of budgets they belong to (read-only, no wider access)
DROP POLICY IF EXISTS "Users can view members" ON public.shared_budget_members;
CREATE POLICY "Users can view members"
ON public.shared_budget_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_shared_budget_owner(auth.uid(), shared_budget_id)
  OR public.is_shared_budget_member(auth.uid(), shared_budget_id)
);

-- 6) Shared budgets are never anon-readable
REVOKE ALL ON TABLE public.shared_budgets FROM anon;
REVOKE ALL ON TABLE public.shared_budget_members FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;