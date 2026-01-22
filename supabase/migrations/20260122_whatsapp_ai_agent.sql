-- ============================================================================
-- WhatsApp AI Agent - Database Migration
-- ============================================================================
--
-- This migration creates the database schema for the WhatsApp AI Agent
-- that allows pastors to manage their church via natural language conversations
--
-- Tables created:
--   1. whatsapp_agent_conversations - Full conversation history
--   2. whatsapp_agent_onboarding - Onboarding progress tracking
--   3. whatsapp_agent_confirmations - Pending confirmations for critical actions
--   4. whatsapp_agent_audit_log - Comprehensive audit trail
-- ============================================================================

-- ============================================================================
-- Table: whatsapp_agent_conversations
-- ============================================================================
-- Stores complete conversation history between pastor and AI agent
CREATE TABLE whatsapp_agent_conversations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  pastor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,

  -- Conversation metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),

  -- Message history (stored as JSONB array for efficient retrieval)
  -- Format: [{role: 'user'|'assistant'|'system'|'function', content: string, timestamp: ISO, metadata?: {}}]
  messages JSONB DEFAULT '[]'::jsonb,

  -- Context tracking
  current_intent TEXT, -- e.g., 'create_cell', 'view_members', 'send_message', 'onboarding'
  context_data JSONB DEFAULT '{}'::jsonb, -- Store temporary data during multi-turn conversations

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_pastor_conversation UNIQUE (pastor_id)
);

-- Indexes for performance
CREATE INDEX idx_conversations_pastor ON whatsapp_agent_conversations(pastor_id);
CREATE INDEX idx_conversations_church ON whatsapp_agent_conversations(church_id, last_message_at DESC);
CREATE INDEX idx_conversations_phone ON whatsapp_agent_conversations(phone_number);

COMMENT ON TABLE whatsapp_agent_conversations IS 'Stores WhatsApp conversation history between pastors and the AI agent';
COMMENT ON COLUMN whatsapp_agent_conversations.messages IS 'Array of chat messages with roles (user, assistant, system, function)';
COMMENT ON COLUMN whatsapp_agent_conversations.current_intent IS 'Current action being processed (e.g., create_cell, send_message)';
COMMENT ON COLUMN whatsapp_agent_conversations.context_data IS 'Temporary data for multi-turn conversations';

-- ============================================================================
-- Table: whatsapp_agent_onboarding
-- ============================================================================
-- Tracks onboarding progress for new pastors
CREATE TABLE whatsapp_agent_onboarding (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE UNIQUE,
  pastor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Onboarding steps (4 essential steps)
  step_church_name_completed BOOLEAN DEFAULT false,
  step_first_cell_completed BOOLEAN DEFAULT false,
  step_initial_members_completed BOOLEAN DEFAULT false,
  step_website_config_completed BOOLEAN DEFAULT false,

  -- Tracking
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN GENERATED ALWAYS AS (
    step_church_name_completed AND
    step_first_cell_completed AND
    step_initial_members_completed AND
    step_website_config_completed
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_onboarding_pastor ON whatsapp_agent_onboarding(pastor_id);

COMMENT ON TABLE whatsapp_agent_onboarding IS 'Tracks onboarding progress for new pastors using the WhatsApp AI agent';
COMMENT ON COLUMN whatsapp_agent_onboarding.is_completed IS 'Auto-computed: true when all 4 steps are completed';

-- ============================================================================
-- Table: whatsapp_agent_confirmations
-- ============================================================================
-- Stores pending confirmations for critical actions (delete, payments, etc.)
CREATE TABLE whatsapp_agent_confirmations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_agent_conversations(id) ON DELETE CASCADE,
  pastor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Confirmation details
  action_type TEXT NOT NULL, -- 'delete_cell', 'delete_member', 'process_payment', etc.
  action_payload JSONB NOT NULL, -- Full data needed to execute the action
  confirmation_message TEXT NOT NULL, -- Message shown to user

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  confirmed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_confirmations_pastor_pending ON whatsapp_agent_confirmations(pastor_id, status) WHERE status = 'pending';
CREATE INDEX idx_confirmations_expires ON whatsapp_agent_confirmations(expires_at) WHERE status = 'pending';

COMMENT ON TABLE whatsapp_agent_confirmations IS 'Stores pending confirmations for critical actions requiring explicit user approval';
COMMENT ON COLUMN whatsapp_agent_confirmations.expires_at IS 'Confirmations expire after 5 minutes for security';
COMMENT ON COLUMN whatsapp_agent_confirmations.action_payload IS 'Full data needed to execute the action when confirmed';

-- ============================================================================
-- Table: whatsapp_agent_audit_log
-- ============================================================================
-- Comprehensive audit trail of all agent actions
CREATE TABLE whatsapp_agent_audit_log (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  pastor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES whatsapp_agent_conversations(id) ON DELETE SET NULL,

  -- Action details
  action_type TEXT NOT NULL, -- 'create_cell', 'send_message', 'delete_member', etc.
  action_description TEXT NOT NULL,

  -- Request/Response
  input_data JSONB, -- User's natural language request
  output_data JSONB, -- Agent's response and action result

  -- Result
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_church_date ON whatsapp_agent_audit_log(church_id, created_at DESC);
CREATE INDEX idx_audit_pastor ON whatsapp_agent_audit_log(pastor_id, created_at DESC);
CREATE INDEX idx_audit_action_type ON whatsapp_agent_audit_log(action_type);

COMMENT ON TABLE whatsapp_agent_audit_log IS 'Comprehensive audit trail of all WhatsApp AI agent actions';
COMMENT ON COLUMN whatsapp_agent_audit_log.input_data IS 'Original user request (natural language)';
COMMENT ON COLUMN whatsapp_agent_audit_log.output_data IS 'Agent response and action execution result';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- whatsapp_agent_conversations
ALTER TABLE whatsapp_agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors can manage their own conversations" ON whatsapp_agent_conversations
  FOR ALL USING (
    pastor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'PASTOR'
    )
  );

-- whatsapp_agent_onboarding
ALTER TABLE whatsapp_agent_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors can view their onboarding" ON whatsapp_agent_onboarding
  FOR SELECT USING (
    pastor_id = auth.uid()
  );

-- whatsapp_agent_confirmations
ALTER TABLE whatsapp_agent_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors can manage their confirmations" ON whatsapp_agent_confirmations
  FOR ALL USING (
    pastor_id = auth.uid()
  );

-- whatsapp_agent_audit_log
ALTER TABLE whatsapp_agent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors can view their audit log" ON whatsapp_agent_audit_log
  FOR SELECT USING (
    pastor_id = auth.uid()
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp on conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON whatsapp_agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp on onboarding
CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON whatsapp_agent_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Function: Expire old confirmations
-- ============================================================================
-- This function can be called by a cron job to clean up expired confirmations

CREATE OR REPLACE FUNCTION expire_old_confirmations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE whatsapp_agent_confirmations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

COMMENT ON FUNCTION expire_old_confirmations IS 'Marks expired confirmations as expired. Can be called by a cron job.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
