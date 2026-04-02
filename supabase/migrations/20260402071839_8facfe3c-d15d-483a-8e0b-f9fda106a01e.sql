CREATE POLICY "Public can view non-revoked non-expired report shares by token"
ON public.report_shares
FOR SELECT TO anon
USING (
  revoked = false
  AND (expires_at IS NULL OR expires_at > now())
);