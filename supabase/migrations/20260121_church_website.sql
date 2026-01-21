-- =====================================================
-- Church Website Features Migration
-- =====================================================
-- Adds support for church public websites with:
-- - Church customization (slug, logo, social links)
-- - Events management
-- - Courses with video uploads
-- - Services (worship) with YouTube/Zoom integration
-- =====================================================

-- =====================================================
-- 1. EXTEND CHURCHES TABLE
-- =====================================================

-- Add website configuration fields to churches
ALTER TABLE churches ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS whatsapp_url TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS website_settings JSONB DEFAULT '{}'::jsonb;

-- Add constraint to ensure slug is URL-friendly
ALTER TABLE churches ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_churches_slug ON churches(slug);

-- =====================================================
-- 2. EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_church_id ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can view published events
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (is_published = true);

-- Church members can view all events from their church
CREATE POLICY "Members can view church events" ON events
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors and leaders can manage events
CREATE POLICY "Pastors and leaders can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = events.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- =====================================================
-- 3. COURSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_church_id ON courses(church_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_order ON courses(church_id, order_index);

-- Trigger
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public can view published courses
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (is_published = true);

-- Church members can view all courses
CREATE POLICY "Members can view church courses" ON courses
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors and leaders can manage courses
CREATE POLICY "Pastors and leaders can manage courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = courses.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- =====================================================
-- 4. COURSE VIDEOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL, -- Supabase Storage path
    duration_seconds INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_videos_course_id ON course_videos(course_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_church_id ON course_videos(church_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_order ON course_videos(course_id, order_index);

-- Trigger
CREATE TRIGGER update_course_videos_updated_at BEFORE UPDATE ON course_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;

-- Public can view published videos from published courses
CREATE POLICY "Anyone can view published course videos" ON course_videos
    FOR SELECT USING (
        is_published = true
        AND EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = course_videos.course_id
            AND courses.is_published = true
        )
    );

-- Church members can view all videos
CREATE POLICY "Members can view church course videos" ON course_videos
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors and leaders can manage videos
CREATE POLICY "Pastors and leaders can manage course videos" ON course_videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = course_videos.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- =====================================================
-- 5. COURSE ENROLLMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, profile_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_profile_id ON course_enrollments(profile_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_church_id ON course_enrollments(church_id);

-- Trigger
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
    FOR SELECT USING (profile_id = auth.uid());

-- Users can enroll themselves
CREATE POLICY "Users can enroll in courses" ON course_enrollments
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Users can update their own enrollments
CREATE POLICY "Users can update their own enrollments" ON course_enrollments
    FOR UPDATE USING (profile_id = auth.uid());

-- Pastors and leaders can view all enrollments
CREATE POLICY "Pastors and leaders can view enrollments" ON course_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = course_enrollments.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- =====================================================
-- 6. COURSE VIDEO PROGRESS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_video_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enrollment_id, video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_progress_enrollment_id ON course_video_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON course_video_progress(video_id);

-- Trigger
CREATE TRIGGER update_course_video_progress_updated_at BEFORE UPDATE ON course_video_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE course_video_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own video progress" ON course_video_progress
    FOR SELECT USING (
        enrollment_id IN (
            SELECT id FROM course_enrollments WHERE profile_id = auth.uid()
        )
    );

-- Users can update their own progress
CREATE POLICY "Users can update their own video progress" ON course_video_progress
    FOR ALL USING (
        enrollment_id IN (
            SELECT id FROM course_enrollments WHERE profile_id = auth.uid()
        )
    );

-- =====================================================
-- 7. SERVICES TABLE (Worship/Cultos)
-- =====================================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    service_date DATE NOT NULL,
    service_time TIME NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PRESENCIAL', 'ONLINE', 'HIBRIDO')) DEFAULT 'PRESENCIAL',
    location TEXT,
    youtube_url TEXT,
    zoom_meeting_id TEXT,
    zoom_password TEXT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_church_id ON services(church_id);
CREATE INDEX IF NOT EXISTS idx_services_date ON services(service_date);
CREATE INDEX IF NOT EXISTS idx_services_is_published ON services(is_published);

-- Trigger
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public can view published services
CREATE POLICY "Anyone can view published services" ON services
    FOR SELECT USING (is_published = true);

-- Church members can view all services
CREATE POLICY "Members can view church services" ON services
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors and leaders can manage services
CREATE POLICY "Pastors and leaders can manage services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = services.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- =====================================================
-- 8. PENDING REGISTRATIONS TABLE
-- =====================================================
-- For users who register but need approval

CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_registrations_church_id ON pending_registrations(church_id);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON pending_registrations(status);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON pending_registrations(email);

-- Trigger
CREATE TRIGGER update_pending_registrations_updated_at BEFORE UPDATE ON pending_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a registration request
CREATE POLICY "Anyone can submit registration" ON pending_registrations
    FOR INSERT WITH CHECK (true);

-- Pastors and leaders can view and manage registrations
CREATE POLICY "Pastors and leaders can manage registrations" ON pending_registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = pending_registrations.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
