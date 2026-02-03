-- ============================================
-- Migration: Super Admin Panel (Part 2)
-- ============================================
-- PREREQUISITE: Run 20260203_01_add_enum_values.sql FIRST!
-- That migration adds SUPER_ADMIN and DISCIPULADOR to the enum.
-- ============================================
-- This migration creates the Super Admin infrastructure:
-- - Admin settings table
-- - Feature flags table
-- - Admin audit logs table
-- - Integration status table
-- - System alerts table
-- - Church status fields
-- - RLS policies for SUPER_ADMIN
-- ============================================

-- ============================================
-- 1. Admin Settings Table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER trigger_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_settings_updated_at();

-- ============================================
-- 2. Feature Flags Table
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'plan', 'church')),
    plan_ids UUID[] DEFAULT '{}',
    church_ids UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trigger_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

-- ============================================
-- 3. Admin Audit Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for admin audit logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_church ON admin_audit_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);

-- ============================================
-- 4. Integration Status Table
-- ============================================

CREATE TABLE IF NOT EXISTS integration_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
    last_check_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    error_message TEXT,
    metrics JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_integration_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_integration_status_updated_at ON integration_status;
CREATE TRIGGER trigger_integration_status_updated_at
    BEFORE UPDATE ON integration_status
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_status_updated_at();

-- Insert default integration records
INSERT INTO integration_status (provider, status) VALUES
    ('stripe', 'unknown'),
    ('evolution', 'unknown'),
    ('mux', 'unknown'),
    ('livekit', 'unknown'),
    ('resend', 'unknown'),
    ('openai', 'unknown'),
    ('pagarme', 'unknown')
ON CONFLICT (provider) DO NOTHING;

-- ============================================
-- 5. System Alerts Table
-- ============================================

CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning', 'info')),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for unresolved alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_unresolved ON system_alerts(is_resolved, created_at DESC) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_category ON system_alerts(category);

-- ============================================
-- 6. Add fields to churches table
-- ============================================

ALTER TABLE churches ADD COLUMN IF NOT EXISTS
    status TEXT DEFAULT 'active' CHECK (status IS NULL OR status IN ('active', 'suspended', 'deleted'));

ALTER TABLE churches ADD COLUMN IF NOT EXISTS
    suspended_at TIMESTAMPTZ;

ALTER TABLE churches ADD COLUMN IF NOT EXISTS
    suspended_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE churches ADD COLUMN IF NOT EXISTS
    suspension_reason TEXT;

ALTER TABLE churches ADD COLUMN IF NOT EXISTS
    admin_notes TEXT;

-- Index for church status
CREATE INDEX IF NOT EXISTS idx_churches_status ON churches(status);

-- ============================================
-- 7. Enable RLS on new tables
-- ============================================

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS Policies for SUPER_ADMIN
-- ============================================

-- Admin Settings: Only SUPER_ADMIN can access
DROP POLICY IF EXISTS "super_admins_admin_settings" ON admin_settings;
CREATE POLICY "super_admins_admin_settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- Feature Flags: Only SUPER_ADMIN can manage
DROP POLICY IF EXISTS "super_admins_feature_flags" ON feature_flags;
CREATE POLICY "super_admins_feature_flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- Admin Audit Logs: Only SUPER_ADMIN can view
DROP POLICY IF EXISTS "super_admins_view_audit" ON admin_audit_logs;
CREATE POLICY "super_admins_view_audit" ON admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- Admin Audit Logs: Service role can insert (for logging)
DROP POLICY IF EXISTS "service_insert_audit" ON admin_audit_logs;
CREATE POLICY "service_insert_audit" ON admin_audit_logs
    FOR INSERT WITH CHECK (true);

-- Integration Status: Only SUPER_ADMIN can access
DROP POLICY IF EXISTS "super_admins_integration_status" ON integration_status;
CREATE POLICY "super_admins_integration_status" ON integration_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- System Alerts: Only SUPER_ADMIN can access
DROP POLICY IF EXISTS "super_admins_system_alerts" ON system_alerts;
CREATE POLICY "super_admins_system_alerts" ON system_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- Churches: SUPER_ADMIN can view all churches
DROP POLICY IF EXISTS "super_admins_view_all_churches" ON churches;
CREATE POLICY "super_admins_view_all_churches" ON churches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- Churches: SUPER_ADMIN can update all churches
DROP POLICY IF EXISTS "super_admins_update_all_churches" ON churches;
CREATE POLICY "super_admins_update_all_churches" ON churches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- Subscriptions: SUPER_ADMIN can view all subscriptions
DROP POLICY IF EXISTS "super_admins_view_all_subscriptions" ON subscriptions;
CREATE POLICY "super_admins_view_all_subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- Profiles: SUPER_ADMIN can view all profiles
DROP POLICY IF EXISTS "super_admins_view_all_profiles" ON profiles;
CREATE POLICY "super_admins_view_all_profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SUPER_ADMIN'
        )
    );

-- ============================================
-- 9. Helper function to check if user is SUPER_ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'SUPER_ADMIN'
    );
END;
$$;

-- ============================================
-- 10. Function to log admin actions
-- ============================================

CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_target_type TEXT,
    p_target_id UUID DEFAULT NULL,
    p_church_id UUID DEFAULT NULL,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_type,
        target_id,
        church_id,
        old_value,
        new_value,
        reason
    ) VALUES (
        auth.uid(),
        p_action,
        p_target_type,
        p_target_id,
        p_church_id,
        p_old_value,
        p_new_value,
        p_reason
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- ============================================
-- 11. Comments for documentation
-- ============================================

COMMENT ON TABLE admin_settings IS 'Global system settings managed by super admins';
COMMENT ON TABLE feature_flags IS 'Feature flags for controlling system features';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail of all super admin actions';
COMMENT ON TABLE integration_status IS 'Health status of external integrations';
COMMENT ON TABLE system_alerts IS 'System-wide alerts and notifications';

COMMENT ON COLUMN churches.status IS 'Church status: active, suspended, or deleted';
COMMENT ON COLUMN churches.suspended_at IS 'When the church was suspended';
COMMENT ON COLUMN churches.suspended_by IS 'Admin who suspended the church';
COMMENT ON COLUMN churches.suspension_reason IS 'Reason for suspension';
COMMENT ON COLUMN churches.admin_notes IS 'Internal notes from admins';

COMMENT ON FUNCTION is_super_admin() IS 'Check if current user is a super admin';
COMMENT ON FUNCTION log_admin_action(TEXT, TEXT, UUID, UUID, JSONB, JSONB, TEXT) IS 'Log an admin action to audit trail';
