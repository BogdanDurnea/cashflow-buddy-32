-- =====================================================
-- FIX 1: Profiles table - ensure proper anonymous access denial
-- =====================================================
-- The current RESTRICTIVE policy "Deny anonymous access to profiles" uses USING(false)
-- but RESTRICTIVE policies alone don't work - they only restrict PERMISSIVE policies.
-- We need to ensure the table has proper role-based access control.

-- First, drop the existing problematic policies and recreate with proper logic
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a proper PERMISSIVE policy that only allows authenticated users to access their own profile
-- This inherently denies anonymous access since auth.uid() will be null for anon users
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- =====================================================
-- FIX 2: Report shares - add revocation capability
-- =====================================================

-- Add a 'revoked' column to allow owners to revoke shared reports
ALTER TABLE public.report_shares 
ADD COLUMN IF NOT EXISTS revoked BOOLEAN DEFAULT false NOT NULL;

-- Drop and recreate the public access policies to include revoked check
DROP POLICY IF EXISTS "Public can view shared reports by valid token" ON public.report_shares;
DROP POLICY IF EXISTS "Public can update view count for shared reports" ON public.report_shares;

-- Public can only view non-revoked, non-expired reports
CREATE POLICY "Public can view shared reports by valid token"
ON public.report_shares
FOR SELECT
USING (
  share_token IS NOT NULL 
  AND revoked = false
  AND (expires_at IS NULL OR expires_at > now())
);

-- Public can only update view_count for non-revoked, non-expired reports
CREATE POLICY "Public can update view count for shared reports"
ON public.report_shares
FOR UPDATE
USING (
  share_token IS NOT NULL 
  AND revoked = false
  AND (expires_at IS NULL OR expires_at > now())
)
WITH CHECK (
  share_token IS NOT NULL 
  AND revoked = false
  AND (expires_at IS NULL OR expires_at > now())
);