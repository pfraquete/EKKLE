-- ============================================
-- Migration: Admin Impersonation System
-- ============================================
-- This migration creates the impersonation infrastructure for
-- super admins to access user accounts for support purposes.
--
-- Tables created:
-- - impersonation_sessions: Active and historical impersonation sessions
-- - impersonation_action_logs: Detailed log of actions during impersonation
-- - admin_notes: Internal notes on churches/users
-- ============================================

-- ============================================
-- 1. Impersonation Sessions Table
-- ============================================

CREATE TABLE IF NOT EXISTS impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Admin who is impersonating
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Target user being impersonated
    target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

    -- Session token (JWT stored for validation)
    session_token TEXT NOT NULL,

    -- Session timing
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    end_reason TEXT CHECK (end_reason IS NULL OR end_reason IN ('manual', 'expired', 'admin_logout', 'forced')),

    -- Audit information
    reason TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,

    -- Stats
    actions_count INTEGER DEFAULT 0,

    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at > started_at),
    CONSTRAINT no_self_impersonation CHECK (admin_id != target_user_id),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for impersonation_sessions
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin ON impersonation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_target ON impersonation_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active ON impersonation_sessions(admin_id, ended_at)
    WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_created ON impersonation_sessions(created_at DESC);

-- ============================================
-- 2. Impersonation Action Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS impersonation_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to the session
    session_id UUID NOT NULL REFERENCES impersonation_sessions(id) ON DELETE CASCADE,

    -- Action details
    action_type TEXT NOT NULL,
    action_path TEXT NOT NULL,
    action_method TEXT,
    action_payload JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for action logs
CREATE INDEX IF NOT EXISTS idx_impersonation_action_logs_session ON impersonation_action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_action_logs_created ON impersonation_action_logs(created_at DESC);

-- ============================================
-- 3. Admin Notes Table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target entity (polymorphic)
    entity_type TEXT NOT NULL CHECK (entity_type IN ('church', 'user', 'ticket', 'subscription')),
    entity_id UUID NOT NULL,

    -- Note content
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,

    -- Author
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for admin_notes
CREATE INDEX IF NOT EXISTS idx_admin_notes_entity ON admin_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_pinned ON admin_notes(entity_type, entity_id, is_pinned)
    WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_admin_notes_created ON admin_notes(created_at DESC);

-- Trigger for updated_at on admin_notes
CREATE OR REPLACE FUNCTION update_admin_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_notes_updated_at ON admin_notes;
CREATE TRIGGER trigger_admin_notes_updated_at
    BEFORE UPDATE ON admin_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_notes_updated_at();

-- ============================================
-- 4. Enable RLS
-- ============================================

ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Impersonation Sessions: Only SUPER_ADMIN can access
DROP POLICY IF EXISTS "super_admins_impersonation_sessions" ON impersonation_sessions;
CREATE POLICY "super_admins_impersonation_sessions" ON impersonation_sessions
    FOR ALL USING (is_super_admin());

-- Impersonation Action Logs: Only SUPER_ADMIN can access
DROP POLICY IF EXISTS "super_admins_impersonation_logs" ON impersonation_action_logs;
CREATE POLICY "super_admins_impersonation_logs" ON impersonation_action_logs
    FOR ALL USING (is_super_admin());

-- Admin Notes: Only SUPER_ADMIN can access
DROP POLICY IF EXISTS "super_admins_admin_notes" ON admin_notes;
CREATE POLICY "super_admins_admin_notes" ON admin_notes
    FOR ALL USING (is_super_admin());

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to increment action count
CREATE OR REPLACE FUNCTION increment_impersonation_actions(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE impersonation_sessions
    SET actions_count = actions_count + 1
    WHERE id = p_session_id;
END;
$$;

-- Function to end impersonation session
CREATE OR REPLACE FUNCTION end_impersonation_session(
    p_session_id UUID,
    p_reason TEXT DEFAULT 'manual'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE impersonation_sessions
    SET
        ended_at = NOW(),
        end_reason = p_reason
    WHERE id = p_session_id
    AND ended_at IS NULL;

    RETURN FOUND;
END;
$$;

-- Function to get active impersonation session for admin
CREATE OR REPLACE FUNCTION get_active_impersonation_session(p_admin_id UUID)
RETURNS TABLE (
    id UUID,
    target_user_id UUID,
    target_church_id UUID,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.target_user_id,
        s.target_church_id,
        s.started_at,
        s.expires_at,
        s.reason
    FROM impersonation_sessions s
    WHERE s.admin_id = p_admin_id
    AND s.ended_at IS NULL
    AND s.expires_at > NOW()
    ORDER BY s.started_at DESC
    LIMIT 1;
END;
$$;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_impersonation_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE impersonation_sessions
    SET
        ended_at = NOW(),
        end_reason = 'expired'
    WHERE ended_at IS NULL
    AND expires_at < NOW();

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

-- ============================================
-- 7. Comments for Documentation
-- ============================================

COMMENT ON TABLE impersonation_sessions IS 'Tracks admin impersonation sessions for support purposes';
COMMENT ON TABLE impersonation_action_logs IS 'Detailed log of all actions performed during impersonation';
COMMENT ON TABLE admin_notes IS 'Internal notes from admins on churches, users, and tickets';

COMMENT ON COLUMN impersonation_sessions.session_token IS 'JWT token for validating the session';
COMMENT ON COLUMN impersonation_sessions.reason IS 'Required reason for why impersonation is needed';
COMMENT ON COLUMN impersonation_sessions.end_reason IS 'How the session ended: manual, expired, admin_logout, or forced';

COMMENT ON FUNCTION increment_impersonation_actions(UUID) IS 'Increments the action counter for an impersonation session';
COMMENT ON FUNCTION end_impersonation_session(UUID, TEXT) IS 'Ends an active impersonation session';
COMMENT ON FUNCTION get_active_impersonation_session(UUID) IS 'Gets the active impersonation session for an admin';
COMMENT ON FUNCTION cleanup_expired_impersonation_sessions() IS 'Marks expired sessions as ended';
