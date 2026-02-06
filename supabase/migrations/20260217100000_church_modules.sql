-- =====================================================
-- Church Modules - Per-Church Module Configuration
-- =====================================================
-- Controls which modules are active for each church.
-- Separate from feature_flags (super-admin platform-level).
-- =====================================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS church_modules (
    church_id UUID PRIMARY KEY REFERENCES churches(id) ON DELETE CASCADE,
    cells_enabled BOOLEAN NOT NULL DEFAULT true,
    departments_enabled BOOLEAN NOT NULL DEFAULT false,
    ebd_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TRIGGER for updated_at
CREATE TRIGGER update_church_modules_updated_at
    BEFORE UPDATE ON church_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS
ALTER TABLE church_modules ENABLE ROW LEVEL SECURITY;

-- Pastors can manage their church's modules
CREATE POLICY "pastors_manage_church_modules" ON church_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = church_modules.church_id
            AND profiles.role = 'PASTOR'
        )
    );

-- Members can read their church's modules (needed for sidebar visibility)
CREATE POLICY "members_read_church_modules" ON church_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = church_modules.church_id
        )
    );

-- Super admins can manage all
CREATE POLICY "super_admins_manage_church_modules" ON church_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- 4. BACKFILL: Insert a row for every existing church with defaults
INSERT INTO church_modules (church_id)
SELECT id FROM churches
ON CONFLICT (church_id) DO NOTHING;

-- 5. TRIGGER on churches INSERT to auto-create church_modules row
CREATE OR REPLACE FUNCTION auto_create_church_modules()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO church_modules (church_id)
    VALUES (NEW.id)
    ON CONFLICT (church_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_church_modules ON churches;
CREATE TRIGGER trigger_auto_create_church_modules
    AFTER INSERT ON churches
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_church_modules();
