
CREATE OR REPLACE FUNCTION public.get_shared_report(p_token TEXT)
RETURNS TABLE (title text, report_data jsonb, created_at timestamptz, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT title, report_data, created_at, expires_at
  FROM public.report_shares
  WHERE share_token = p_token
    AND revoked = false
    AND (expires_at IS NULL OR expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_report(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_report(TEXT) TO authenticated;

DROP POLICY "Public can view shared reports by valid token" ON public.report_shares;
