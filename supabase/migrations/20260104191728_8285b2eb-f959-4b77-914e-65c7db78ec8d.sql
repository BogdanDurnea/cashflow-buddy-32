-- Create atomic view count increment function
CREATE OR REPLACE FUNCTION public.increment_report_view_count(token_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.report_shares 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE share_token = token_param 
    AND (expires_at IS NULL OR expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.increment_report_view_count(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_report_view_count(TEXT) TO authenticated;