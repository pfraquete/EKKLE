-- =====================================================
-- EBD Module - Escola Biblica Dominical
-- =====================================================

-- 1. Add course_type to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT
    NOT NULL DEFAULT 'CURSO'
    CHECK (course_type IN ('CURSO', 'EBD_CLASSE'));

CREATE INDEX IF NOT EXISTS idx_courses_course_type ON courses(course_type);

-- 2. EBD_LESSONS TABLE
CREATE TABLE IF NOT EXISTS ebd_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lesson_date DATE NOT NULL,
    lesson_order INTEGER DEFAULT 0,
    material_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebd_lessons_course_id ON ebd_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_ebd_lessons_church_id ON ebd_lessons(church_id);
CREATE INDEX IF NOT EXISTS idx_ebd_lessons_date ON ebd_lessons(lesson_date);

CREATE TRIGGER update_ebd_lessons_updated_at
    BEFORE UPDATE ON ebd_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ebd_lessons ENABLE ROW LEVEL SECURITY;

-- Members can view lessons in their church
CREATE POLICY "members_view_ebd_lessons" ON ebd_lessons
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors and teachers can manage lessons
CREATE POLICY "pastors_teachers_manage_ebd_lessons" ON ebd_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = ebd_lessons.church_id
            AND (role = 'PASTOR' OR is_teacher = true)
        )
    );

-- Super admins can manage all
CREATE POLICY "super_admins_manage_ebd_lessons" ON ebd_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- 3. EBD_ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS ebd_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES ebd_lessons(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_ebd_attendance_lesson_id ON ebd_attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_ebd_attendance_profile_id ON ebd_attendance(profile_id);

ALTER TABLE ebd_attendance ENABLE ROW LEVEL SECURITY;

-- Members can view attendance in their church
CREATE POLICY "members_view_ebd_attendance" ON ebd_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ebd_lessons l
            JOIN profiles p ON p.church_id = l.church_id
            WHERE l.id = ebd_attendance.lesson_id
            AND p.id = auth.uid()
        )
    );

-- Pastors and teachers can manage attendance
CREATE POLICY "pastors_teachers_manage_ebd_attendance" ON ebd_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ebd_lessons l
            JOIN profiles p ON p.id = auth.uid()
            WHERE l.id = ebd_attendance.lesson_id
            AND p.church_id = l.church_id
            AND (p.role = 'PASTOR' OR p.is_teacher = true)
        )
    );

-- Super admins can manage all
CREATE POLICY "super_admins_manage_ebd_attendance" ON ebd_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );
