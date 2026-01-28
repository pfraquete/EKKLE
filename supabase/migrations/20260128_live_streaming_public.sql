-- =====================================================
-- Live Streaming - Public Access Update
-- =====================================================
-- Adiciona suporte para lives públicas (visitantes)
-- =====================================================

-- Add is_public column to live_streams
ALTER TABLE live_streams
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for public streams
CREATE INDEX IF NOT EXISTS idx_live_streams_is_public ON live_streams(is_public);

-- Update RLS policy to allow public access to public streams
DROP POLICY IF EXISTS "Anyone can view public live streams" ON live_streams;
CREATE POLICY "Anyone can view public live streams" ON live_streams
    FOR SELECT USING (is_public = true);

-- Update RLS policy for chat - allow viewing public stream chats
DROP POLICY IF EXISTS "Anyone can view public stream chat" ON live_chat_messages;
CREATE POLICY "Anyone can view public stream chat" ON live_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM live_streams
            WHERE live_streams.id = live_chat_messages.live_stream_id
            AND live_streams.is_public = true
        )
    );
