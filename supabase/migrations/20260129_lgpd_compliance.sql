-- LGPD Compliance: User Consents and Deletion Requests
-- This migration adds tables to track user consent and handle data deletion requests

-- =====================================================
-- USER CONSENTS TABLE
-- Tracks explicit consent for various data processing activities
-- =====================================================

CREATE TABLE IF NOT EXISTS user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Consent flags
    face_recognition BOOLEAN DEFAULT false,
    face_recognition_date TIMESTAMPTZ,

    marketing_emails BOOLEAN DEFAULT false,
    marketing_emails_date TIMESTAMPTZ,

    data_analytics BOOLEAN DEFAULT false,
    data_analytics_date TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_profile_consent UNIQUE (profile_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_profile ON user_consents(profile_id);

-- RLS Policies
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own consent
CREATE POLICY "Users can read own consent"
    ON user_consents FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own consent"
    ON user_consents FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own consent"
    ON user_consents FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);


-- =====================================================
-- DELETION REQUESTS TABLE
-- Tracks requests for account/data deletion (LGPD Art. 18)
-- =====================================================

CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Request details
    reason TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED')),

    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES profiles(id),

    -- Notes from processor
    admin_notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deletion_requests_profile ON deletion_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_church ON deletion_requests(church_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);

-- RLS Policies
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own deletion requests
CREATE POLICY "Users can read own deletion requests"
    ON deletion_requests FOR SELECT
    USING (auth.uid() = profile_id);

-- Users can create deletion requests
CREATE POLICY "Users can create deletion requests"
    ON deletion_requests FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Pastors can read church deletion requests
CREATE POLICY "Pastors can read church deletion requests"
    ON deletion_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = deletion_requests.church_id
            AND role = 'PASTOR'
        )
    );

-- Pastors can update deletion requests
CREATE POLICY "Pastors can update church deletion requests"
    ON deletion_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = deletion_requests.church_id
            AND role = 'PASTOR'
        )
    );


-- =====================================================
-- AUDIT LOG FOR LGPD COMPLIANCE
-- Tracks data access and modifications for compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS lgpd_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

    -- Action details
    action TEXT NOT NULL, -- 'DATA_EXPORT', 'CONSENT_UPDATE', 'DATA_DELETE', 'DATA_ACCESS'
    entity_type TEXT, -- 'profile', 'tithe', 'attendance', etc.
    entity_id UUID,

    -- Additional context
    details JSONB,
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_lgpd_audit_profile ON lgpd_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_audit_church ON lgpd_audit_log(church_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_audit_action ON lgpd_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_lgpd_audit_created ON lgpd_audit_log(created_at);

-- RLS Policies (very restrictive - only pastors can read)
ALTER TABLE lgpd_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors can read church audit logs"
    ON lgpd_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = lgpd_audit_log.church_id
            AND role = 'PASTOR'
        )
    );

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
    ON lgpd_audit_log FOR INSERT
    WITH CHECK (true);


-- =====================================================
-- FUNCTION: Log LGPD action
-- =====================================================

CREATE OR REPLACE FUNCTION log_lgpd_action(
    p_profile_id UUID,
    p_church_id UUID,
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO lgpd_audit_log (
        profile_id,
        church_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_profile_id,
        p_church_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_details
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- TRIGGER: Auto-log consent changes
-- =====================================================

CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_lgpd_action(
        NEW.profile_id,
        (SELECT church_id FROM profiles WHERE id = NEW.profile_id),
        'CONSENT_UPDATE',
        'user_consents',
        NEW.id,
        jsonb_build_object(
            'face_recognition', NEW.face_recognition,
            'marketing_emails', NEW.marketing_emails,
            'data_analytics', NEW.data_analytics
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_consent_change ON user_consents;
CREATE TRIGGER trigger_log_consent_change
    AFTER INSERT OR UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION log_consent_change();


-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_consents IS 'Stores explicit user consent for data processing activities (LGPD compliance)';
COMMENT ON TABLE deletion_requests IS 'Tracks user requests for account/data deletion (LGPD Art. 18, V)';
COMMENT ON TABLE lgpd_audit_log IS 'Audit trail for LGPD-related actions (data access, export, deletion)';
