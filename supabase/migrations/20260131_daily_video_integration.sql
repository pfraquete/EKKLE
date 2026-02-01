-- =====================================================
-- Daily.co Video Integration
-- =====================================================
-- Adds Daily.co as an alternative to Zoom for embedded video calls
-- Daily allows video calls directly inside the app (no external redirect)
-- =====================================================

-- Add Daily.co fields to prayer_rooms table
ALTER TABLE prayer_rooms
ADD COLUMN IF NOT EXISTS daily_room_name TEXT,
ADD COLUMN IF NOT EXISTS daily_room_url TEXT,
ADD COLUMN IF NOT EXISTS video_provider TEXT DEFAULT 'daily' CHECK (video_provider IN ('zoom', 'daily', 'none'));

-- Add Daily.co fields to services table for online cultos
ALTER TABLE services
ADD COLUMN IF NOT EXISTS daily_room_name TEXT,
ADD COLUMN IF NOT EXISTS daily_room_url TEXT,
ADD COLUMN IF NOT EXISTS video_provider TEXT DEFAULT 'zoom' CHECK (video_provider IN ('zoom', 'daily', 'youtube', 'none'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prayer_rooms_daily_room_name ON prayer_rooms(daily_room_name);
CREATE INDEX IF NOT EXISTS idx_services_daily_room_name ON services(daily_room_name);

-- Add comment explaining the fields
COMMENT ON COLUMN prayer_rooms.daily_room_name IS 'Daily.co room identifier for embedded video calls';
COMMENT ON COLUMN prayer_rooms.daily_room_url IS 'Full Daily.co room URL';
COMMENT ON COLUMN prayer_rooms.video_provider IS 'Video provider: daily (embedded), zoom (external), or none';

COMMENT ON COLUMN services.daily_room_name IS 'Daily.co room identifier for online services';
COMMENT ON COLUMN services.daily_room_url IS 'Full Daily.co room URL';
COMMENT ON COLUMN services.video_provider IS 'Video provider: daily, zoom, youtube, or none';

-- =====================================================
-- Meeting tokens table for Daily.co
-- Similar to service_zoom_tokens but for Daily
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_meeting_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    token TEXT NOT NULL,
    is_owner BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_tokens_room_name ON daily_meeting_tokens(room_name);
CREATE INDEX IF NOT EXISTS idx_daily_tokens_user_id ON daily_meeting_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tokens_expires_at ON daily_meeting_tokens(expires_at);

-- RLS
ALTER TABLE daily_meeting_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view their own daily tokens"
ON daily_meeting_tokens FOR SELECT
USING (user_id = auth.uid());

-- Leaders/Pastors can create tokens for their church
CREATE POLICY "Leaders can create daily tokens"
ON daily_meeting_tokens FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND church_id = daily_meeting_tokens.church_id
        AND role IN ('PASTOR', 'LEADER')
    )
);

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_daily_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM daily_meeting_tokens
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- =====================================================
-- Video call analytics table
-- Track usage across both Zoom and Daily
-- =====================================================

CREATE TABLE IF NOT EXISTS video_call_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    room_type TEXT NOT NULL CHECK (room_type IN ('prayer_room', 'service', 'course')),
    room_id UUID NOT NULL,
    video_provider TEXT NOT NULL CHECK (video_provider IN ('zoom', 'daily', 'youtube')),
    participant_count INTEGER DEFAULT 0,
    peak_participants INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_analytics_church ON video_call_analytics(church_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_room ON video_call_analytics(room_type, room_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_started ON video_call_analytics(started_at);

-- RLS
ALTER TABLE video_call_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view analytics from their church
CREATE POLICY "Users can view their church video analytics"
ON video_call_analytics FOR SELECT
USING (
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
);

-- Only system can insert analytics (via service role)
CREATE POLICY "System can insert video analytics"
ON video_call_analytics FOR INSERT
WITH CHECK (true);

-- Pastors can view all analytics
CREATE POLICY "Pastors can manage video analytics"
ON video_call_analytics FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND church_id = video_call_analytics.church_id
        AND role = 'PASTOR'
    )
);

-- =====================================================
-- Function to track video call start
-- =====================================================

CREATE OR REPLACE FUNCTION start_video_call_tracking(
    p_church_id UUID,
    p_room_type TEXT,
    p_room_id UUID,
    p_video_provider TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_analytics_id UUID;
BEGIN
    INSERT INTO video_call_analytics (
        church_id,
        room_type,
        room_id,
        video_provider,
        participant_count,
        peak_participants,
        started_at
    ) VALUES (
        p_church_id,
        p_room_type,
        p_room_id,
        p_video_provider,
        1,
        1,
        NOW()
    )
    RETURNING id INTO v_analytics_id;

    RETURN v_analytics_id;
END;
$$;

-- =====================================================
-- Function to update participant count
-- =====================================================

CREATE OR REPLACE FUNCTION update_video_call_participants(
    p_analytics_id UUID,
    p_participant_count INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE video_call_analytics
    SET
        participant_count = p_participant_count,
        peak_participants = GREATEST(peak_participants, p_participant_count)
    WHERE id = p_analytics_id;
END;
$$;

-- =====================================================
-- Function to end video call tracking
-- =====================================================

CREATE OR REPLACE FUNCTION end_video_call_tracking(
    p_analytics_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE video_call_analytics
    SET
        ended_at = NOW(),
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
    WHERE id = p_analytics_id;
END;
$$;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION cleanup_expired_daily_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION start_video_call_tracking(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_video_call_participants(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION end_video_call_tracking(UUID) TO authenticated;
