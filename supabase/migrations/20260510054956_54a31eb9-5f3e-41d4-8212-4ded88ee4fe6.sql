
-- Create a function to clean up expired rate_limits rows
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE LOG 'cleanup_expired_rate_limits: deleted % expired rows at %', deleted_count, now();
  END IF;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_rate_limits() IS 'Deletes rate_limits rows older than 1 hour. Returns number of deleted rows.';

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Add RLS policies to protect rate limit data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rate_limits' AND policyname = 'Service role can manage rate limits'
  ) THEN
    CREATE POLICY "Service role can manage rate limits"
    ON public.rate_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rate_limits' AND policyname = 'Users cannot access rate limits'
  ) THEN
    CREATE POLICY "Users cannot access rate limits"
    ON public.rate_limits
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rate_limits' AND policyname = 'Anonymous cannot access rate limits'
  ) THEN
    CREATE POLICY "Anonymous cannot access rate limits"
    ON public.rate_limits
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- Add indexes for efficient cleanup and lookups (no partial indexes with now())
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits (window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_function ON public.rate_limits (user_id, function_name);

-- Update check_rate_limit to occasionally trigger cleanup (1% chance per call)
CREATE OR REPLACE FUNCTION public.check_rate_limit(_user_id uuid, _function_name text, _max_requests integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _current_count integer;
  _window_start timestamp with time zone;
BEGIN
  -- Probabilistic cleanup: ~1% chance to clean old rows on each call
  IF random() < 0.01 THEN
    PERFORM public.cleanup_expired_rate_limits();
  END IF;

  SELECT request_count, window_start INTO _current_count, _window_start
  FROM public.rate_limits
  WHERE user_id = _user_id AND function_name = _function_name;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (user_id, function_name, request_count, window_start)
    VALUES (_user_id, _function_name, 1, now());
    RETURN true;
  END IF;

  IF _window_start + (_window_seconds || ' seconds')::interval < now() THEN
    UPDATE public.rate_limits
    SET request_count = 1, window_start = now()
    WHERE user_id = _user_id AND function_name = _function_name;
    RETURN true;
  END IF;

  IF _current_count >= _max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits
    SET request_count = request_count + 1
    WHERE user_id = _user_id AND function_name = _function_name;
  RETURN true;
END;
$function$;

COMMENT ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) IS 'Checks and increments rate limit for a user/function. Includes probabilistic cleanup of old rows.';

-- Add monitoring function
CREATE OR REPLACE FUNCTION public.get_rate_limits_stats()
RETURNS TABLE(total_rows bigint, unique_users bigint, unique_functions bigint, oldest_window timestamp with time zone, newest_window timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(*)::bigint as total_rows,
    COUNT(DISTINCT user_id)::bigint as unique_users,
    COUNT(DISTINCT function_name)::bigint as unique_functions,
    MIN(window_start) as oldest_window,
    MAX(window_start) as newest_window
  FROM public.rate_limits;
$$;

COMMENT ON FUNCTION public.get_rate_limits_stats() IS 'Returns statistics about the rate_limits table for monitoring.';

-- Add a manual purge function for immediate cleanup
CREATE OR REPLACE FUNCTION public.purge_all_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '5 minutes';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE LOG 'purge_all_expired_rate_limits: deleted % expired rows', deleted_count;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.purge_all_expired_rate_limits() IS 'Immediately deletes rate_limits rows older than 5 minutes. Returns number of deleted rows.';

-- Add a reset function for admin use
CREATE OR REPLACE FUNCTION public.reset_user_rate_limits(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits WHERE user_id = _user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE LOG 'Reset rate limits for user %: deleted % rows', _user_id, deleted_count;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.reset_user_rate_limits(uuid) IS 'Resets all rate limits for a specific user. Use for admin/support purposes.';

-- Analyze the table for optimal query planning
ANALYZE public.rate_limits;

-- Add table comment
COMMENT ON TABLE public.rate_limits IS 'Rate limiting storage for edge functions. Old rows are automatically cleaned up probabilistically during rate limit checks.';
