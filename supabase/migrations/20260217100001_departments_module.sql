-- =====================================================
-- Departments Module
-- =====================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_church_id ON departments(church_id);
CREATE INDEX IF NOT EXISTS idx_departments_leader_id ON departments(leader_id);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Members can view departments in their church
CREATE POLICY "members_view_departments" ON departments
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors can manage departments
CREATE POLICY "pastors_manage_departments" ON departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = departments.church_id
            AND role = 'PASTOR'
        )
    );

-- Super admins can manage all
CREATE POLICY "super_admins_manage_departments" ON departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- 2. DEPARTMENT_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS department_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'MEMBER')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_department_members_department_id ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_department_members_profile_id ON department_members(profile_id);

ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

-- Members can view department members in their church
CREATE POLICY "members_view_department_members" ON department_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM departments d
            JOIN profiles p ON p.church_id = d.church_id
            WHERE d.id = department_members.department_id
            AND p.id = auth.uid()
        )
    );

-- Pastors can manage department members
CREATE POLICY "pastors_manage_department_members" ON department_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM departments d
            JOIN profiles p ON p.id = auth.uid()
            WHERE d.id = department_members.department_id
            AND p.church_id = d.church_id
            AND p.role = 'PASTOR'
        )
    );

-- Super admins can manage all
CREATE POLICY "super_admins_manage_department_members" ON department_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );
