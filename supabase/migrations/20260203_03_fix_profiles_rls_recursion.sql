-- ============================================
-- Migration: Fix Profiles RLS Recursion
-- ============================================
-- This migration fixes the infinite recursion error in the profiles RLS policy.
-- The issue was that the policy queried profiles to check for SUPER_ADMIN,
-- which triggered the same policy check, causing infinite recursion.
--
-- Solution: Use is_super_admin() function with SECURITY DEFINER
-- which bypasses RLS checks.
-- ============================================

-- 1. First, ensure the is_super_admin function exists with SECURITY DEFINER
-- SECURITY DEFINER makes the function run as the owner, bypassing RLS
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'SUPER_ADMIN'
    );
END;
$$;

COMMENT ON FUNCTION is_super_admin() IS 'Check if current user is a super admin - uses SECURITY DEFINER to bypass RLS';

-- 2. Drop the problematic policy
DROP POLICY IF EXISTS "super_admins_view_all_profiles" ON profiles;

-- 3. Recreate the policy using the function (no recursion)
CREATE POLICY "super_admins_view_all_profiles" ON profiles
    FOR SELECT USING (is_super_admin());
