-- ============================================
-- DIRECT MESSAGES SYSTEM
-- Instagram Direct-style private messaging
-- ============================================

-- 1. Add nickname field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Create unique index for nickname (allows NULL but unique when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_nickname_unique
  ON profiles(nickname)
  WHERE nickname IS NOT NULL;

-- Create search index for nickname
CREATE INDEX IF NOT EXISTS idx_profiles_nickname_search
  ON profiles(LOWER(nickname) text_pattern_ops);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_preview TEXT
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Index for sorting by recent activity
CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON conversations(last_message_at DESC);

-- ============================================
-- CONVERSATION PARTICIPANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, profile_id)
);

-- Enable RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cp_profile
  ON conversation_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_cp_conversation
  ON conversation_participants(conversation_id);

-- ============================================
-- DIRECT MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_conversation
  ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_sender
  ON direct_messages(sender_id);

-- ============================================
-- RLS POLICIES - CONVERSATIONS
-- ============================================

-- Users can view conversations they participate in
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND profile_id = auth.uid()
    )
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

-- Users can update conversations they participate in
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND profile_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - PARTICIPANTS
-- ============================================

-- Users can view participants of their conversations
CREATE POLICY "Users can view conversation participants" ON conversation_participants
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.profile_id = auth.uid()
    )
  );

-- Users can add participants (to create conversations)
CREATE POLICY "Users can add participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

-- Users can update their own participant record (e.g., last_read_at)
CREATE POLICY "Users can update own participant record" ON conversation_participants
  FOR UPDATE USING (profile_id = auth.uid());

-- ============================================
-- RLS POLICIES - MESSAGES
-- ============================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = direct_messages.conversation_id
      AND profile_id = auth.uid()
    )
  );

-- Users can send messages to their conversations
CREATE POLICY "Users can send messages to their conversations" ON direct_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = direct_messages.conversation_id
      AND profile_id = auth.uid()
    )
  );

-- Users can soft-delete their own messages
CREATE POLICY "Users can delete own messages" ON direct_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for new messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get or create a 1-on-1 conversation
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  existing_conversation_id UUID;
  new_conversation_id UUID;
BEGIN
  -- Check if conversation already exists between these two users
  SELECT cp1.conversation_id INTO existing_conversation_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.profile_id = current_user_id
    AND cp2.profile_id = other_user_id
  -- Ensure it's a 1-on-1 conversation (only 2 participants)
  AND (
    SELECT COUNT(*) FROM conversation_participants
    WHERE conversation_id = cp1.conversation_id
  ) = 2
  LIMIT 1;

  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, profile_id)
  VALUES
    (new_conversation_id, current_user_id),
    (new_conversation_id, other_user_id);

  RETURN new_conversation_id;
END;
$$;

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON direct_messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_messages_count(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_unread INTEGER;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0)::INTEGER INTO total_unread
  FROM (
    SELECT cp.conversation_id,
           COUNT(dm.id) as unread_count
    FROM conversation_participants cp
    LEFT JOIN direct_messages dm ON dm.conversation_id = cp.conversation_id
      AND dm.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
      AND dm.sender_id != user_id
      AND dm.is_deleted = false
    WHERE cp.profile_id = user_id
    GROUP BY cp.conversation_id
  ) counts;

  RETURN total_unread;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE conversations IS 'Direct message conversations (1-on-1 or group chats)';
COMMENT ON TABLE conversation_participants IS 'Users participating in a conversation';
COMMENT ON TABLE direct_messages IS 'Individual messages in a conversation';
COMMENT ON COLUMN profiles.nickname IS 'Unique nickname for direct messaging (@username style)';
COMMENT ON COLUMN conversations.last_message_preview IS 'Preview text of the last message (max 100 chars)';
COMMENT ON COLUMN conversation_participants.last_read_at IS 'Timestamp of when user last read this conversation';
COMMENT ON COLUMN conversation_participants.is_muted IS 'Whether user has muted notifications for this conversation';
