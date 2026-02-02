-- ============================================
-- FIX COMPLETO: RLS para Direct Messages
-- Resolve recursão infinita nas policies
-- ============================================

-- 1. CRIAR FUNÇÃO SECURITY DEFINER (contorna RLS)
CREATE OR REPLACE FUNCTION user_is_in_conversation(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = conv_id
    AND profile_id = auth.uid()
  );
$$;

-- 2. LIMPAR TODAS AS POLICIES

-- conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- conversation_participants
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON conversation_participants;

-- direct_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON direct_messages;

-- 3. GARANTIR RLS ATIVO
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES - CONVERSATIONS
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (user_is_in_conversation(id));

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (user_is_in_conversation(id));

-- 5. POLICIES - PARTICIPANTS
CREATE POLICY "Users can view conversation participants" ON conversation_participants
  FOR SELECT USING (user_is_in_conversation(conversation_id));

CREATE POLICY "Users can add participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own participant record" ON conversation_participants
  FOR UPDATE USING (profile_id = auth.uid());

-- 6. POLICIES - MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON direct_messages
  FOR SELECT USING (user_is_in_conversation(conversation_id));

CREATE POLICY "Users can send messages to their conversations" ON direct_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    user_is_in_conversation(conversation_id)
  );

CREATE POLICY "Users can delete own messages" ON direct_messages
  FOR UPDATE USING (sender_id = auth.uid());
