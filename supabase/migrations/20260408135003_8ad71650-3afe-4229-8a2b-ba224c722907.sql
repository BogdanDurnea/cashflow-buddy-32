CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, function_name)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_rate_limits_user_function ON public.rate_limits (user_id, function_name);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _function_name text,
  _max_requests integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count integer;
  _window_start timestamp with time zone;
BEGIN
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
$$;