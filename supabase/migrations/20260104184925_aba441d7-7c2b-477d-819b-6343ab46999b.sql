-- Add RLS policy for anonymous users to view shared reports by valid token
CREATE POLICY "Public can view shared reports by valid token"
  ON public.report_shares 
  FOR SELECT
  TO anon
  USING (
    share_token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Allow anonymous users to update view_count for valid shared reports
CREATE POLICY "Public can update view count for shared reports"
  ON public.report_shares 
  FOR UPDATE
  TO anon
  USING (
    share_token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  )
  WITH CHECK (
    share_token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  );