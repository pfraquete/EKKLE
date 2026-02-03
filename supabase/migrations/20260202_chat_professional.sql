-- ============================================
-- Migration: Chat Professional Features
-- ============================================
-- This migration adds professional chat features:
-- - Message reactions
-- - Attachments (images, documents)
-- - Reply to messages
-- - Pinned messages
-- - Online presence
-- - Typing indicators
-- - Read receipts
-- ============================================

-- ============================================
-- 1. Message Reactions
-- ============================================

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('like', 'love', 'laugh', 'sad', 'wow', 'pray')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(message_id, user_id, reaction)
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);

-- RLS for reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM direct_messages dm
            JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
            WHERE dm.id = message_reactions.message_id
            AND cp.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions" ON message_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM direct_messages dm
            JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
            WHERE dm.id = message_reactions.message_id
            AND cp.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove own reactions" ON message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 2. Attachments & Reply columns on direct_messages
-- ============================================

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS attachment_url TEXT,
    ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'document')),
    ADD COLUMN IF NOT EXISTS attachment_name TEXT,
    ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
    ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL;

-- Index for replies
CREATE INDEX IF NOT EXISTS idx_dm_reply_to ON direct_messages(reply_to_id);

-- ============================================
-- 3. Pinned Messages
-- ============================================

CREATE TABLE IF NOT EXISTS pinned_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pinned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(conversation_id, message_id)
);

-- Index for pinned messages
CREATE INDEX IF NOT EXISTS idx_pinned_conversation ON pinned_messages(conversation_id);

-- RLS for pinned messages
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pinned in their conversations" ON pinned_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = pinned_messages.conversation_id
            AND profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can pin messages" ON pinned_messages
    FOR INSERT WITH CHECK (
        pinned_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = pinned_messages.conversation_id
            AND profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can unpin messages" ON pinned_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = pinned_messages.conversation_id
            AND profile_id = auth.uid()
        )
    );

-- ============================================
-- 4. Online Presence (columns on profiles)
-- ============================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Index for online users
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online) WHERE is_online = TRUE;

-- Function to update presence
CREATE OR REPLACE FUNCTION update_user_presence(online BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET
        is_online = online,
        last_seen_at = CASE WHEN online = FALSE THEN NOW() ELSE last_seen_at END
    WHERE id = auth.uid();
END;
$$;

-- ============================================
-- 5. Typing Indicators
-- ============================================

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- Index for typing
CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id);

-- RLS for typing indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing in their conversations" ON typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = typing_indicators.conversation_id
            AND profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own typing" ON typing_indicators
    FOR ALL USING (user_id = auth.uid());

-- Function to cleanup old typing indicators (older than 5 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM typing_indicators
    WHERE started_at < NOW() - INTERVAL '5 seconds';
END;
$$;

-- Function to set typing status
CREATE OR REPLACE FUNCTION set_typing_status(p_conversation_id UUID, p_is_typing BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_is_typing THEN
        INSERT INTO typing_indicators (conversation_id, user_id, started_at)
        VALUES (p_conversation_id, auth.uid(), NOW())
        ON CONFLICT (conversation_id, user_id)
        DO UPDATE SET started_at = NOW();
    ELSE
        DELETE FROM typing_indicators
        WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
    END IF;
END;
$$;

-- ============================================
-- 6. Read Receipts
-- ============================================

CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Indexes for read receipts
CREATE INDEX IF NOT EXISTS idx_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON message_read_receipts(user_id);

-- RLS for read receipts
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view read receipts in their conversations" ON message_read_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM direct_messages dm
            JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
            WHERE dm.id = message_read_receipts.message_id
            AND cp.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can create read receipts" ON message_read_receipts
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM direct_messages dm
            JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
            WHERE dm.id = message_read_receipts.message_id
            AND cp.profile_id = auth.uid()
        )
    );

-- ============================================
-- 7. Enable Realtime for new tables
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE pinned_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;

-- ============================================
-- 8. Comments for documentation
-- ============================================

COMMENT ON TABLE message_reactions IS 'Stores emoji reactions on chat messages';
COMMENT ON TABLE pinned_messages IS 'Stores pinned messages per conversation';
COMMENT ON TABLE typing_indicators IS 'Real-time typing status per conversation';
COMMENT ON TABLE message_read_receipts IS 'Per-message read receipts for delivery confirmation';

COMMENT ON COLUMN direct_messages.attachment_url IS 'URL of attached file in storage';
COMMENT ON COLUMN direct_messages.attachment_type IS 'Type of attachment: image or document';
COMMENT ON COLUMN direct_messages.attachment_name IS 'Original filename of attachment';
COMMENT ON COLUMN direct_messages.attachment_size IS 'Size of attachment in bytes';
COMMENT ON COLUMN direct_messages.reply_to_id IS 'ID of message being replied to';

COMMENT ON COLUMN profiles.last_seen_at IS 'Last time user was seen online';
COMMENT ON COLUMN profiles.is_online IS 'Whether user is currently online';
