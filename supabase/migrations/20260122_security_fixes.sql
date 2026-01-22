-- =====================================================
-- SECURITY FIXES - 2026-01-22
-- =====================================================

-- 1. PREVENT PRIVILEGE ESCALATION (Self-Promotion)
-- Users should not be able to upgrade their own role to PASTOR or change their church_id.

CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS trigger AS $$
BEGIN
  -- If the user is updating their OWN profile
  IF auth.uid() = NEW.id THEN
    -- Prevent changing ROLE
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'You cannot change your own role.';
    END IF;
    
    -- Prevent changing CHURCH_ID
    IF NEW.church_id IS DISTINCT FROM OLD.church_id THEN
        RAISE EXCEPTION 'You cannot change your church affiliation.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to ensure idempotency
DROP TRIGGER IF EXISTS trg_check_profile_update_security ON profiles;

-- Create trigger
CREATE TRIGGER trg_check_profile_update_security
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_update_security();


-- 2. PREVENT SPAM / DOS ON REGISTRATIONS
-- Remove the policy that allows ANYONE (anon) to insert into pending_registrations.
-- The API uses Service Role key, so it doesn't need this policy.

DROP POLICY IF EXISTS "Anyone can submit registration" ON pending_registrations;

-- Ensure RLS is still enabled
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- (Optional) Create a policy that allows ONLY authenticated users to insert?
-- No, because registration is for new users. 
-- We rely on the API Route (Server-side) which uses Service Role to bypass RLS.
-- So NO public policy is needed for INSERT.

-- =====================================================
-- FIX COMPLETE
-- =====================================================
