-- =====================================================
-- SISTEMA DE ORACAO - Ekkle Church Management
-- Migration: 20260131_prayer_system.sql
-- =====================================================

-- 1. PRAYERS - Main prayer sessions with audio transcription
CREATE TABLE IF NOT EXISTS prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Audio & Transcription
    audio_url TEXT,
    audio_duration_seconds INTEGER,
    transcription TEXT,
    transcription_status TEXT NOT NULL CHECK (transcription_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) DEFAULT 'PENDING',

    -- AI Analysis
    ai_summary TEXT,
    ai_insights JSONB DEFAULT '{}',
    suggested_verses JSONB DEFAULT '[]',

    -- Blessing tracking
    blessing_received BOOLEAN DEFAULT false,
    blessing_received_at TIMESTAMPTZ,
    blessing_notes TEXT,

    -- Session metadata
    session_type TEXT NOT NULL CHECK (session_type IN ('INDIVIDUAL', 'GROUP')) DEFAULT 'INDIVIDUAL',
    prayer_room_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRAYER_ITEMS - Extracted items from prayers (4 categories)
CREATE TABLE IF NOT EXISTS prayer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    prayer_id UUID NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Item classification: MOTIVO | PROMESSA | TRANSFORMACAO | PESSOA
    item_type TEXT NOT NULL CHECK (item_type IN ('MOTIVO', 'PROMESSA', 'TRANSFORMACAO', 'PESSOA')),

    -- Content
    content TEXT NOT NULL,
    person_name TEXT,  -- Only for PESSOA type
    verse_reference TEXT,  -- Only for PROMESSA type

    -- Tracking
    is_answered BOOLEAN DEFAULT false,
    answered_at TIMESTAMPTZ,
    answered_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRAYER_STREAKS - Track consecutive days praying and stats
CREATE TABLE IF NOT EXISTS prayer_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_prayer_date DATE,

    -- Weekly/Monthly stats
    weekly_minutes INTEGER DEFAULT 0,
    monthly_minutes INTEGER DEFAULT 0,
    weekly_prayers INTEGER DEFAULT 0,
    monthly_prayers INTEGER DEFAULT 0,
    weekly_people_prayed INTEGER DEFAULT 0,
    monthly_people_prayed INTEGER DEFAULT 0,

    -- Period tracking
    week_start DATE,
    month_start DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(profile_id)
);

-- 4. PRAYER_ROOMS - Shared Zoom prayer rooms
CREATE TABLE IF NOT EXISTS prayer_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Room info
    name TEXT NOT NULL,
    description TEXT,

    -- Zoom integration
    zoom_meeting_id TEXT,
    zoom_password TEXT,
    zoom_join_url TEXT,
    zoom_host_url TEXT,

    -- Schedule
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,

    -- Status
    status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED')) DEFAULT 'SCHEDULED',

    -- Settings
    max_participants INTEGER DEFAULT 100,
    is_public BOOLEAN DEFAULT true,

    -- Host
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for prayer_room_id in prayers table
ALTER TABLE prayers ADD CONSTRAINT fk_prayers_prayer_room
    FOREIGN KEY (prayer_room_id) REFERENCES prayer_rooms(id) ON DELETE SET NULL;

-- 5. PRAYER_ROOM_PARTICIPANTS - Track who joined rooms
CREATE TABLE IF NOT EXISTS prayer_room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    prayer_room_id UUID NOT NULL REFERENCES prayer_rooms(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    UNIQUE(prayer_room_id, profile_id)
);

-- 6. PRAYER_REPORTS - Generated weekly/monthly reports (Spotify Wrapped style)
CREATE TABLE IF NOT EXISTS prayer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    report_type TEXT NOT NULL CHECK (report_type IN ('WEEKLY', 'MONTHLY')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,

    -- Stats snapshot
    total_prayers INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    total_people_prayed INTEGER DEFAULT 0,
    total_answered_prayers INTEGER DEFAULT 0,
    longest_session_minutes INTEGER DEFAULT 0,

    -- Top items
    top_motivos JSONB DEFAULT '[]',
    top_pessoas JSONB DEFAULT '[]',

    -- AI generated content
    ai_summary TEXT,
    ai_encouragement TEXT,
    highlight_verses JSONB DEFAULT '[]',

    -- For sharing
    share_token TEXT UNIQUE,
    is_shared BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER_MUSIC_CONNECTIONS - OAuth tokens for Spotify/YouTube Music
CREATE TABLE IF NOT EXISTS user_music_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    provider TEXT NOT NULL CHECK (provider IN ('SPOTIFY', 'YOUTUBE_MUSIC')),

    -- OAuth tokens (should be encrypted at application level)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- User preferences
    favorite_playlists JSONB DEFAULT '[]',
    default_playlist_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(profile_id, provider)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_prayers_profile_id ON prayers(profile_id);
CREATE INDEX IF NOT EXISTS idx_prayers_church_id ON prayers(church_id);
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_blessing_received ON prayers(blessing_received) WHERE blessing_received = true;
CREATE INDEX IF NOT EXISTS idx_prayers_transcription_status ON prayers(transcription_status);

CREATE INDEX IF NOT EXISTS idx_prayer_items_prayer_id ON prayer_items(prayer_id);
CREATE INDEX IF NOT EXISTS idx_prayer_items_profile_id ON prayer_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_prayer_items_type ON prayer_items(item_type);
CREATE INDEX IF NOT EXISTS idx_prayer_items_is_answered ON prayer_items(is_answered) WHERE is_answered = true;

CREATE INDEX IF NOT EXISTS idx_prayer_sessions_profile_id ON prayer_streaks(profile_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_current_streak ON prayer_streaks(current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_prayer_rooms_church_id ON prayer_rooms(church_id);
CREATE INDEX IF NOT EXISTS idx_prayer_rooms_status ON prayer_rooms(status);
CREATE INDEX IF NOT EXISTS idx_prayer_rooms_scheduled ON prayer_rooms(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_prayer_reports_profile_id ON prayer_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_prayer_reports_type_period ON prayer_reports(report_type, report_period_start);
CREATE INDEX IF NOT EXISTS idx_prayer_reports_share_token ON prayer_reports(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_music_connections_profile ON user_music_connections(profile_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_music_connections ENABLE ROW LEVEL SECURITY;

-- Prayers: Users can manage their own prayers
CREATE POLICY "Users can view their own prayers" ON prayers
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own prayers" ON prayers
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own prayers" ON prayers
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own prayers" ON prayers
    FOR DELETE USING (profile_id = auth.uid());

-- Prayer Items: Users can manage their own items
CREATE POLICY "Users can view their own prayer items" ON prayer_items
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own prayer items" ON prayer_items
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own prayer items" ON prayer_items
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own prayer items" ON prayer_items
    FOR DELETE USING (profile_id = auth.uid());

-- Streaks: Users can manage their own streaks
CREATE POLICY "Users can view their own streaks" ON prayer_streaks
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own streaks" ON prayer_streaks
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own streaks" ON prayer_streaks
    FOR UPDATE USING (profile_id = auth.uid());

-- Prayer Rooms: Church members can view public rooms
CREATE POLICY "Church members can view prayer rooms" ON prayer_rooms
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
        AND (is_public = true OR created_by = auth.uid())
    );

-- Leaders/Pastors can create prayer rooms
CREATE POLICY "Leaders can create prayer rooms" ON prayer_rooms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = prayer_rooms.church_id
            AND role IN ('PASTOR', 'LEADER')
        )
    );

-- Room creators can update their rooms
CREATE POLICY "Creators can update prayer rooms" ON prayer_rooms
    FOR UPDATE USING (created_by = auth.uid());

-- Room creators or pastors can delete rooms
CREATE POLICY "Creators or pastors can delete prayer rooms" ON prayer_rooms
    FOR DELETE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = prayer_rooms.church_id
            AND role = 'PASTOR'
        )
    );

-- Participants: Users can manage their own participation
CREATE POLICY "Users can view room participants" ON prayer_room_participants
    FOR SELECT USING (
        prayer_room_id IN (
            SELECT id FROM prayer_rooms
            WHERE church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can join rooms" ON prayer_room_participants
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their participation" ON prayer_room_participants
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can leave rooms" ON prayer_room_participants
    FOR DELETE USING (profile_id = auth.uid());

-- Reports: Users can manage their own reports
CREATE POLICY "Users can view their own reports" ON prayer_reports
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own reports" ON prayer_reports
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own reports" ON prayer_reports
    FOR UPDATE USING (profile_id = auth.uid());

-- Shared reports can be viewed by anyone with the token
CREATE POLICY "Anyone can view shared reports" ON prayer_reports
    FOR SELECT USING (is_shared = true AND share_token IS NOT NULL);

-- Music connections: Users can manage their own
CREATE POLICY "Users can view their music connections" ON user_music_connections
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their music connections" ON user_music_connections
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their music connections" ON user_music_connections
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their music connections" ON user_music_connections
    FOR DELETE USING (profile_id = auth.uid());

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update prayer streak when a new prayer is created
CREATE OR REPLACE FUNCTION update_prayer_streak()
RETURNS TRIGGER AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_week_start DATE := date_trunc('week', v_today)::DATE;
    v_month_start DATE := date_trunc('month', v_today)::DATE;
    v_duration_minutes INTEGER;
BEGIN
    v_duration_minutes := COALESCE(NEW.audio_duration_seconds, 0) / 60;

    -- Get or create streak record
    INSERT INTO prayer_streaks (church_id, profile_id, current_streak, longest_streak, last_prayer_date, week_start, month_start)
    VALUES (NEW.church_id, NEW.profile_id, 0, 0, NULL, v_week_start, v_month_start)
    ON CONFLICT (profile_id) DO NOTHING;

    -- Get current streak data
    SELECT last_prayer_date, current_streak, longest_streak
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM prayer_streaks
    WHERE profile_id = NEW.profile_id;

    -- Calculate new streak
    IF v_last_date IS NULL THEN
        -- First prayer ever
        v_current_streak := 1;
    ELSIF v_last_date < v_today - INTERVAL '1 day' THEN
        -- Streak broken, start new one
        v_current_streak := 1;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
        -- Consecutive day, increment streak
        v_current_streak := v_current_streak + 1;
    -- Else: same day, no streak change (but still update stats)
    END IF;

    -- Update longest streak if needed
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;

    -- Update streak record with all stats
    UPDATE prayer_streaks
    SET
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_prayer_date = v_today,
        -- Reset weekly stats if new week
        weekly_minutes = CASE
            WHEN week_start = v_week_start THEN weekly_minutes + v_duration_minutes
            ELSE v_duration_minutes
        END,
        weekly_prayers = CASE
            WHEN week_start = v_week_start THEN weekly_prayers + 1
            ELSE 1
        END,
        -- Reset monthly stats if new month
        monthly_minutes = CASE
            WHEN month_start = v_month_start THEN monthly_minutes + v_duration_minutes
            ELSE v_duration_minutes
        END,
        monthly_prayers = CASE
            WHEN month_start = v_month_start THEN monthly_prayers + 1
            ELSE 1
        END,
        week_start = v_week_start,
        month_start = v_month_start,
        updated_at = NOW()
    WHERE profile_id = NEW.profile_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for prayer streak update
DROP TRIGGER IF EXISTS trigger_update_prayer_streak ON prayers;
CREATE TRIGGER trigger_update_prayer_streak
    AFTER INSERT ON prayers
    FOR EACH ROW
    EXECUTE FUNCTION update_prayer_streak();

-- Function to update people prayed count when PESSOA item is added
CREATE OR REPLACE FUNCTION update_people_prayed_count()
RETURNS TRIGGER AS $$
DECLARE
    v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
    v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
    IF NEW.item_type = 'PESSOA' THEN
        UPDATE prayer_streaks
        SET
            weekly_people_prayed = CASE
                WHEN week_start = v_week_start THEN weekly_people_prayed + 1
                ELSE 1
            END,
            monthly_people_prayed = CASE
                WHEN month_start = v_month_start THEN monthly_people_prayed + 1
                ELSE 1
            END
        WHERE profile_id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for people prayed count
DROP TRIGGER IF EXISTS trigger_update_people_prayed ON prayer_items;
CREATE TRIGGER trigger_update_people_prayed
    AFTER INSERT ON prayer_items
    FOR EACH ROW
    EXECUTE FUNCTION update_people_prayed_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prayer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for prayers updated_at
DROP TRIGGER IF EXISTS trigger_prayers_updated_at ON prayers;
CREATE TRIGGER trigger_prayers_updated_at
    BEFORE UPDATE ON prayers
    FOR EACH ROW
    EXECUTE FUNCTION update_prayer_updated_at();

-- Trigger for prayer_rooms updated_at
DROP TRIGGER IF EXISTS trigger_prayer_rooms_updated_at ON prayer_rooms;
CREATE TRIGGER trigger_prayer_rooms_updated_at
    BEFORE UPDATE ON prayer_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_prayer_updated_at();

-- Trigger for prayer_streaks updated_at
DROP TRIGGER IF EXISTS trigger_prayer_streaks_updated_at ON prayer_streaks;
CREATE TRIGGER trigger_prayer_streaks_updated_at
    BEFORE UPDATE ON prayer_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_prayer_updated_at();

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

-- Create storage bucket for prayer audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'prayer-audio',
    'prayer-audio',
    false,
    26214400, -- 25MB limit (Whisper API limit)
    ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']::text[];

-- Storage policies for prayer audio
DROP POLICY IF EXISTS "Users can upload their prayer audio" ON storage.objects;
CREATE POLICY "Users can upload their prayer audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'prayer-audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can read their own prayer audio" ON storage.objects;
CREATE POLICY "Users can read their own prayer audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'prayer-audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own prayer audio" ON storage.objects;
CREATE POLICY "Users can delete their own prayer audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'prayer-audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for prayer rooms (for live participant updates)
ALTER PUBLICATION supabase_realtime ADD TABLE prayer_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE prayer_room_participants;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE prayers IS 'Main prayer records with transcription and AI analysis';
COMMENT ON TABLE prayer_items IS 'Extracted items from prayers: motivos, promessas, transformacoes, pessoas';
COMMENT ON TABLE prayer_streaks IS 'Track consecutive days praying and weekly/monthly statistics';
COMMENT ON TABLE prayer_rooms IS 'Shared Zoom prayer rooms for group prayer sessions';
COMMENT ON TABLE prayer_room_participants IS 'Track who joined prayer rooms and duration';
COMMENT ON TABLE prayer_reports IS 'Generated weekly/monthly prayer summary reports (Spotify Wrapped style)';
COMMENT ON TABLE user_music_connections IS 'OAuth connections for Spotify and YouTube Music';

COMMENT ON COLUMN prayers.transcription_status IS 'PENDING: waiting, PROCESSING: being transcribed, COMPLETED: done, FAILED: error';
COMMENT ON COLUMN prayer_items.item_type IS 'MOTIVO: prayer request, PROMESSA: Bible promise, TRANSFORMACAO: desired change, PESSOA: person prayed for';
COMMENT ON COLUMN prayer_streaks.current_streak IS 'Number of consecutive days with at least one prayer';
COMMENT ON COLUMN prayer_reports.share_token IS 'Unique token for sharing report publicly';
