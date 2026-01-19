-- =====================================================
-- Videira São José dos Campos - Database Schema
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql/new
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Churches table
CREATE TABLE IF NOT EXISTS churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    member_stage TEXT NOT NULL CHECK (member_stage IN ('VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'LEADER')),
    role TEXT NOT NULL CHECK (role IN ('PASTOR', 'LEADER', 'MEMBER')),
    cell_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cells table
CREATE TABLE IF NOT EXISTS cells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
    address TEXT,
    neighborhood TEXT,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    meeting_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles.cell_id after cells table is created
ALTER TABLE profiles
ADD CONSTRAINT profiles_cell_id_fkey
FOREIGN KEY (cell_id) REFERENCES cells(id) ON DELETE SET NULL;

-- Cell meetings table
CREATE TABLE IF NOT EXISTS cell_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED')) DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cell reports table
CREATE TABLE IF NOT EXISTS cell_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES cell_meetings(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    has_icebreaker BOOLEAN DEFAULT false,
    has_worship BOOLEAN DEFAULT false,
    has_word BOOLEAN DEFAULT false,
    has_prayer BOOLEAN DEFAULT false,
    has_snack BOOLEAN DEFAULT false,
    visitors_count INTEGER DEFAULT 0,
    decisions_count INTEGER DEFAULT 0,
    observations TEXT,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (context_type IN ('CELL_MEETING')),
    context_id UUID NOT NULL,
    context_date DATE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
    visitor_name TEXT,
    visitor_phone TEXT,
    checked_in_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_church_id ON profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_profiles_cell_id ON profiles(cell_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_cells_church_id ON cells(church_id);
CREATE INDEX IF NOT EXISTS idx_cells_leader_id ON cells(leader_id);
CREATE INDEX IF NOT EXISTS idx_cells_status ON cells(status);

CREATE INDEX IF NOT EXISTS idx_cell_meetings_cell_id ON cell_meetings(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_meetings_church_id ON cell_meetings(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_meetings_date ON cell_meetings(date);
CREATE INDEX IF NOT EXISTS idx_cell_meetings_status ON cell_meetings(status);

CREATE INDEX IF NOT EXISTS idx_cell_reports_meeting_id ON cell_reports(meeting_id);
CREATE INDEX IF NOT EXISTS idx_cell_reports_church_id ON cell_reports(church_id);

CREATE INDEX IF NOT EXISTS idx_attendance_church_id ON attendance(church_id);
CREATE INDEX IF NOT EXISTS idx_attendance_context_id ON attendance(context_id);
CREATE INDEX IF NOT EXISTS idx_attendance_profile_id ON attendance(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_context_date ON attendance(context_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Churches: Users can only see their own church
CREATE POLICY "Users can view their own church" ON churches
    FOR SELECT USING (
        id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Profiles: Users can view profiles from their church
CREATE POLICY "Users can view profiles from their church" ON profiles
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Pastors and leaders can insert/update/delete profiles
CREATE POLICY "Pastors and leaders can manage profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = profiles.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- Cells: Users can view cells from their church
CREATE POLICY "Users can view cells from their church" ON cells
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors and leaders can manage cells
CREATE POLICY "Pastors and leaders can manage cells" ON cells
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = cells.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- Cell meetings: Users can view meetings from their church
CREATE POLICY "Users can view meetings from their church" ON cell_meetings
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Leaders can manage meetings for their cells
CREATE POLICY "Leaders can manage their cell meetings" ON cell_meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cells
            WHERE cells.id = cell_meetings.cell_id
            AND cells.leader_id = auth.uid()
        )
    );

-- Cell reports: Users can view reports from their church
CREATE POLICY "Users can view reports from their church" ON cell_reports
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Leaders can manage reports for their cells
CREATE POLICY "Leaders can manage their cell reports" ON cell_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cell_meetings cm
            JOIN cells c ON c.id = cm.cell_id
            WHERE cm.id = cell_reports.meeting_id
            AND c.leader_id = auth.uid()
        )
    );

-- Attendance: Users can view attendance from their church
CREATE POLICY "Users can view attendance from their church" ON attendance
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Leaders can manage attendance for their cells
CREATE POLICY "Leaders can manage their cell attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cell_meetings cm
            JOIN cells c ON c.id = cm.cell_id
            WHERE cm.id = attendance.context_id
            AND attendance.context_type = 'CELL_MEETING'
            AND c.leader_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON cells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cell_meetings_updated_at BEFORE UPDATE ON cell_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cell_reports_updated_at BEFORE UPDATE ON cell_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA (Optional - create your church)
-- =====================================================

-- Insert a default church (CHANGE THIS!)
INSERT INTO churches (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Videira São José dos Campos')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Create your first user via Supabase Auth
-- 2. Manually insert a profile for that user with role='PASTOR'
-- 3. Login to the application
-- =====================================================
