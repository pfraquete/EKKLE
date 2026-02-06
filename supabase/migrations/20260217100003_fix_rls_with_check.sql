-- =====================================================
-- Fix RLS: Add WITH CHECK to all FOR ALL policies
-- Prevents cross-church UPDATE on church_id fields
-- =====================================================

-- =====================================================
-- 1. CHURCH_MODULES
-- =====================================================

DROP POLICY IF EXISTS "pastors_manage_church_modules" ON church_modules;
CREATE POLICY "pastors_manage_church_modules" ON church_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = church_modules.church_id
            AND profiles.role = 'PASTOR'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = church_modules.church_id
            AND profiles.role = 'PASTOR'
        )
    );

DROP POLICY IF EXISTS "super_admins_manage_church_modules" ON church_modules;
CREATE POLICY "super_admins_manage_church_modules" ON church_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 2. DEPARTMENTS
-- =====================================================

DROP POLICY IF EXISTS "pastors_manage_departments" ON departments;
CREATE POLICY "pastors_manage_departments" ON departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = departments.church_id
            AND role = 'PASTOR'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = departments.church_id
            AND role = 'PASTOR'
        )
    );

DROP POLICY IF EXISTS "super_admins_manage_departments" ON departments;
CREATE POLICY "super_admins_manage_departments" ON departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 3. DEPARTMENT_MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "pastors_manage_department_members" ON department_members;
CREATE POLICY "pastors_manage_department_members" ON department_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM departments d
            JOIN profiles p ON p.id = auth.uid()
            WHERE d.id = department_members.department_id
            AND p.church_id = d.church_id
            AND p.role = 'PASTOR'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM departments d
            JOIN profiles p ON p.id = auth.uid()
            WHERE d.id = department_members.department_id
            AND p.church_id = d.church_id
            AND p.role = 'PASTOR'
        )
    );

DROP POLICY IF EXISTS "super_admins_manage_department_members" ON department_members;
CREATE POLICY "super_admins_manage_department_members" ON department_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 4. EBD_LESSONS
-- =====================================================

DROP POLICY IF EXISTS "pastors_teachers_manage_ebd_lessons" ON ebd_lessons;
CREATE POLICY "pastors_teachers_manage_ebd_lessons" ON ebd_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = ebd_lessons.church_id
            AND (role = 'PASTOR' OR is_teacher = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = ebd_lessons.church_id
            AND (role = 'PASTOR' OR is_teacher = true)
        )
    );

DROP POLICY IF EXISTS "super_admins_manage_ebd_lessons" ON ebd_lessons;
CREATE POLICY "super_admins_manage_ebd_lessons" ON ebd_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 5. EBD_ATTENDANCE
-- =====================================================

DROP POLICY IF EXISTS "pastors_teachers_manage_ebd_attendance" ON ebd_attendance;
CREATE POLICY "pastors_teachers_manage_ebd_attendance" ON ebd_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ebd_lessons l
            JOIN profiles p ON p.id = auth.uid()
            WHERE l.id = ebd_attendance.lesson_id
            AND p.church_id = l.church_id
            AND (p.role = 'PASTOR' OR p.is_teacher = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ebd_lessons l
            JOIN profiles p ON p.id = auth.uid()
            WHERE l.id = ebd_attendance.lesson_id
            AND p.church_id = l.church_id
            AND (p.role = 'PASTOR' OR p.is_teacher = true)
        )
    );

DROP POLICY IF EXISTS "super_admins_manage_ebd_attendance" ON ebd_attendance;
CREATE POLICY "super_admins_manage_ebd_attendance" ON ebd_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );
