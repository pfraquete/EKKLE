-- =====================================================
-- LiveKit Integration for Browser Broadcasting
-- =====================================================
-- Adds support for browser-based live streaming using LiveKit
-- enabling direct streaming without OBS or external software
-- =====================================================

-- Add LiveKit columns to live_streams table
DO $$
BEGIN
    -- Add livekit_room_name column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'live_streams' AND column_name = 'livekit_room_name'
    ) THEN
        ALTER TABLE live_streams ADD COLUMN livekit_room_name TEXT;
    END IF;

    -- Add livekit_egress_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'live_streams' AND column_name = 'livekit_egress_id'
    ) THEN
        ALTER TABLE live_streams ADD COLUMN livekit_egress_id TEXT;
    END IF;

    -- Add broadcast_type column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'live_streams' AND column_name = 'broadcast_type'
    ) THEN
        ALTER TABLE live_streams ADD COLUMN broadcast_type TEXT DEFAULT 'rtmp'
            CHECK (broadcast_type IN ('rtmp', 'browser'));
    END IF;
END $$;

-- Create index for room name lookups
CREATE INDEX IF NOT EXISTS idx_live_streams_livekit_room ON live_streams(livekit_room_name)
    WHERE livekit_room_name IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN live_streams.livekit_room_name IS 'LiveKit room name for browser-based streaming';
COMMENT ON COLUMN live_streams.livekit_egress_id IS 'LiveKit Egress ID for RTMP output to Mux';
COMMENT ON COLUMN live_streams.broadcast_type IS 'Type of broadcast: rtmp (OBS) or browser (LiveKit)';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
