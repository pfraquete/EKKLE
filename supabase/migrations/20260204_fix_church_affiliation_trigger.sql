-- =====================================================
-- FIX: Allow Ekkle Hub users to change church affiliation
-- =====================================================
-- The security trigger was preventing users from joining churches
-- because it blocked ALL church_id changes. This update allows
-- users who are currently in the Ekkle Hub to join other churches.

-- Ekkle Hub ID constant
DO $$
DECLARE
    EKKLE_HUB_ID CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    RAISE NOTICE 'Updating profile security trigger to allow Ekkle Hub users to join churches';
END $$;

-- Drop existing trigger
DROP TRIGGER IF EXISTS trg_check_profile_update_security ON profiles;

-- Recreate function with Ekkle Hub exception
CREATE OR REPLACE FUNCTION check_profile_update_security()
RETURNS TRIGGER AS $$
DECLARE
    EKKLE_HUB_ID CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- If the user is updating their OWN profile
    IF auth.uid() = NEW.id THEN
        -- Prevent changing ROLE
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'You cannot change your own role.';
        END IF;

        -- Prevent changing CHURCH_ID - EXCEPT when user is in Ekkle Hub
        IF NEW.church_id IS DISTINCT FROM OLD.church_id THEN
            -- Allow if user is currently in Ekkle Hub (joining a church)
            IF OLD.church_id = EKKLE_HUB_ID THEN
                -- This is allowed - user is joining a church from Ekkle Hub
                NULL;
            ELSE
                RAISE EXCEPTION 'You cannot change your church affiliation.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER trg_check_profile_update_security
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_profile_update_security();

-- Add comment explaining the logic
COMMENT ON FUNCTION check_profile_update_security() IS
'Security trigger to prevent users from changing their own role or church.
Exception: Users in Ekkle Hub (church_id = 00000000-0000-0000-0000-000000000001)
can change their church_id to join a real church.';
