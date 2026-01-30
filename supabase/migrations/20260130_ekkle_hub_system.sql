-- =====================================================
-- Ekkle Hub System Migration
-- =====================================================
-- Creates the special "Ekkle" entity for users without church
-- affiliation and the public church directory system.
-- =====================================================

-- =====================================================
-- 1. CREATE EKKLE HUB CHURCH
-- =====================================================
-- Well-known UUID that will be used throughout the system
-- to identify users belonging to the Ekkle Hub (no church)

INSERT INTO churches (id, name, slug, description, website_settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Ekkle',
    'ekkle',
    'Bem-vindo ao Ekkle! Encontre sua comunidade de fé.',
    '{"is_ekkle_hub": true, "allow_public_registration": true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    website_settings = jsonb_set(
        COALESCE(churches.website_settings, '{}'::jsonb),
        '{is_ekkle_hub}',
        'true'::jsonb
    );

-- =====================================================
-- 2. EXTEND CHURCHES TABLE FOR PUBLIC DIRECTORY
-- =====================================================
-- Add columns for church discovery and public listing

ALTER TABLE churches ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS is_public_listed BOOLEAN DEFAULT false;

-- Index for public church directory queries
CREATE INDEX IF NOT EXISTS idx_churches_public_listed
    ON churches(is_public_listed)
    WHERE is_public_listed = true;

-- Index for location-based searches
CREATE INDEX IF NOT EXISTS idx_churches_city ON churches(city);
CREATE INDEX IF NOT EXISTS idx_churches_state ON churches(state);

-- =====================================================
-- 3. PUBLIC CHURCH DIRECTORY VIEW
-- =====================================================
-- View for listing churches in the public directory
-- Excludes Ekkle Hub and only shows opted-in churches

CREATE OR REPLACE VIEW public_church_directory AS
SELECT
    id,
    name,
    slug,
    logo_url,
    description,
    city,
    state,
    (SELECT COUNT(*) FROM profiles WHERE profiles.church_id = churches.id AND profiles.is_active = true) as member_count
FROM churches
WHERE is_public_listed = true
  AND id != '00000000-0000-0000-0000-000000000001';

-- Grant access to the view
GRANT SELECT ON public_church_directory TO anon, authenticated;

-- =====================================================
-- 4. RLS POLICY FOR EKKLE HUB USERS
-- =====================================================
-- Allow Ekkle Hub users to view public churches

CREATE POLICY "Ekkle users can view public church directory"
    ON churches
    FOR SELECT
    USING (
        is_public_listed = true
        OR id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- 5. UPDATE PROFILES RLS FOR EKKLE HUB
-- =====================================================
-- Ensure Ekkle Hub users can manage their own profile

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- =====================================================
-- 6. FUNCTION TO JOIN CHURCH (AUTOMATIC AFFILIATION)
-- =====================================================
-- Function that handles automatic church affiliation

CREATE OR REPLACE FUNCTION join_church(target_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    current_church_id UUID;
    target_church RECORD;
    result JSONB;
BEGIN
    -- Get current user
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Get current church
    SELECT church_id INTO current_church_id
    FROM profiles
    WHERE id = current_user_id;

    -- Check if user is in Ekkle Hub
    IF current_church_id != '00000000-0000-0000-0000-000000000001' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already affiliated with a church');
    END IF;

    -- Check if target church exists and is public
    SELECT id, name, slug, is_public_listed
    INTO target_church
    FROM churches
    WHERE id = target_church_id;

    IF target_church.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Church not found');
    END IF;

    IF target_church.is_public_listed = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Church is not accepting new members');
    END IF;

    -- Cannot join Ekkle Hub
    IF target_church_id = '00000000-0000-0000-0000-000000000001' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot join Ekkle Hub directly');
    END IF;

    -- Update user profile with new church
    UPDATE profiles
    SET
        church_id = target_church_id,
        member_stage = 'VISITOR',
        cell_id = NULL,
        updated_at = NOW()
    WHERE id = current_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'church_id', target_church_id,
        'church_name', target_church.name,
        'church_slug', target_church.slug
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION join_church(UUID) TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
