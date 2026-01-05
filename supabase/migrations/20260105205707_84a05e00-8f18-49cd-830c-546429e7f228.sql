-- Add explicit policy to deny anonymous access to profiles table
-- This ensures email addresses cannot be accessed by unauthenticated users

CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles 
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);