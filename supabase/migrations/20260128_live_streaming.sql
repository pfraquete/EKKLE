-- =====================================================
-- Live Streaming Module
-- =====================================================
-- Sistema de transmissões ao vivo para igrejas
-- Permite que pastores façam lives e membros assistam
-- =====================================================

-- Live Streams Table
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,

    -- Stream Status
    status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED')) DEFAULT 'SCHEDULED',
    scheduled_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,

    -- Stream Provider (supports multiple providers)
    provider TEXT NOT NULL CHECK (provider IN ('MUX', 'YOUTUBE', 'CUSTOM')) DEFAULT 'CUSTOM',

    -- Mux fields
    mux_stream_key TEXT,
    mux_playback_id TEXT,
    mux_live_stream_id TEXT,

    -- YouTube/External fields
    youtube_url TEXT,
    custom_embed_url TEXT,

    -- Settings
    chat_enabled BOOLEAN DEFAULT true,
    is_recording BOOLEAN DEFAULT false,
    recording_url TEXT,

    -- Stats
    peak_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,

    -- Who created it
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Chat Messages Table
CREATE TABLE IF NOT EXISTS live_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    live_stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,

    -- Message content
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,

    -- Moderation
    is_deleted BOOLEAN DEFAULT false,
    deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Stream Viewers Table (tracking who's watching)
CREATE TABLE IF NOT EXISTS live_stream_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    live_stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Viewer activity
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    -- Unique constraint to prevent duplicate active viewers
    UNIQUE(live_stream_id, profile_id)
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_live_streams_church_id ON live_streams(church_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_start ON live_streams(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_by ON live_streams(created_by);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_stream_id ON live_chat_messages(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_church_id ON live_chat_messages(church_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created_at ON live_chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_stream_id ON live_stream_viewers(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_profile_id ON live_stream_viewers(profile_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_is_active ON live_stream_viewers(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_viewers ENABLE ROW LEVEL SECURITY;

-- Live Streams: Users can view streams from their church
CREATE POLICY "Users can view live streams from their church" ON live_streams
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Only pastors can create/update/delete streams
CREATE POLICY "Pastors can manage live streams" ON live_streams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = live_streams.church_id
            AND role = 'PASTOR'
        )
    );

-- Chat Messages: Users can view messages from their church streams
CREATE POLICY "Users can view chat messages from their church" ON live_chat_messages
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Users can send messages to streams in their church
CREATE POLICY "Users can send chat messages" ON live_chat_messages
    FOR INSERT WITH CHECK (
        profile_id = auth.uid()
        AND church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Users can delete their own messages, pastors can delete any
CREATE POLICY "Users can delete own messages or pastors can delete any" ON live_chat_messages
    FOR DELETE USING (
        profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = live_chat_messages.church_id
            AND role = 'PASTOR'
        )
    );

-- Pastors can update messages (for pinning/moderation)
CREATE POLICY "Pastors can update chat messages" ON live_chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = live_chat_messages.church_id
            AND role = 'PASTOR'
        )
    );

-- Viewers: Users can view viewer list from their church
CREATE POLICY "Users can view viewers from their church" ON live_stream_viewers
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Users can add/update their own viewer record
CREATE POLICY "Users can manage their own viewer status" ON live_stream_viewers
    FOR ALL USING (
        profile_id = auth.uid()
        AND church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for live_streams
CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON live_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get active viewer count for a stream
CREATE OR REPLACE FUNCTION get_live_stream_viewer_count(stream_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM live_stream_viewers
        WHERE live_stream_id = stream_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update viewer status (join/leave)
CREATE OR REPLACE FUNCTION update_viewer_presence(
    p_stream_id UUID,
    p_profile_id UUID,
    p_church_id UUID,
    p_is_active BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO live_stream_viewers (live_stream_id, profile_id, church_id, is_active, joined_at)
    VALUES (p_stream_id, p_profile_id, p_church_id, p_is_active, NOW())
    ON CONFLICT (live_stream_id, profile_id)
    DO UPDATE SET
        is_active = p_is_active,
        left_at = CASE WHEN p_is_active THEN NULL ELSE NOW() END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Enable Realtime for chat messages
-- =====================================================

-- Enable realtime for the chat table
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
