-- =====================================================
-- Mux Spaces Integration for Browser Broadcasting
-- =====================================================
-- Adds support for Mux Spaces real-time video
-- enabling browser-based live streaming without OBS
-- =====================================================

-- Add Mux Spaces columns to live_streams table
DO $$
BEGIN
    -- Add mux_space_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'live_streams' AND column_name = 'mux_space_id'
    ) THEN
        ALTER TABLE live_streams ADD COLUMN mux_space_id TEXT;
    END IF;

    -- Add mux_broadcast_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'live_streams' AND column_name = 'mux_broadcast_id'
    ) THEN
        ALTER TABLE live_streams ADD COLUMN mux_broadcast_id TEXT;
    END IF;

    -- Add is_public column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'live_streams' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE live_streams ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for space_id lookups
CREATE INDEX IF NOT EXISTS idx_live_streams_mux_space_id ON live_streams(mux_space_id) WHERE mux_space_id IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN live_streams.mux_space_id IS 'Mux Space ID for browser-based real-time streaming';
COMMENT ON COLUMN live_streams.mux_broadcast_id IS 'Mux Broadcast ID that connects Space to Live Stream';
COMMENT ON COLUMN live_streams.is_public IS 'Whether the stream is publicly accessible without login';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
