-- =====================================================
-- Church Creation Flow Migration
-- =====================================================
-- This migration adds support for the new subscription-based
-- church creation flow where users pay before becoming pastors.
-- =====================================================

-- =====================================================
-- 1. ADD STRIPE CUSTOMER ID TO PROFILES
-- =====================================================
-- Store Stripe customer ID at user level (before church exists)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
    ON profiles(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

-- =====================================================
-- 2. CREATE PENDING CHURCH REQUESTS TABLE
-- =====================================================
-- Tracks users who initiated "Open a Church" but haven't completed payment

CREATE TABLE IF NOT EXISTS pending_church_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    church_name TEXT NOT NULL,
    church_slug TEXT NOT NULL,
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL CHECK (status IN (
        'pending_payment',      -- Checkout session created, awaiting payment
        'payment_processing',   -- Payment received, processing church creation
        'completed',            -- Church created successfully
        'failed',               -- Payment failed or error during creation
        'expired'               -- Checkout session expired
    )) DEFAULT 'pending_payment',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    completed_at TIMESTAMPTZ
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pending_church_requests_user
    ON pending_church_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_church_requests_session
    ON pending_church_requests(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_pending_church_requests_status
    ON pending_church_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_church_requests_slug
    ON pending_church_requests(church_slug)
    WHERE status IN ('pending_payment', 'payment_processing');

-- Partial unique index: only one pending request per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request_per_user
    ON pending_church_requests(user_id)
    WHERE status IN ('pending_payment', 'payment_processing');

-- RLS
ALTER TABLE pending_church_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending requests
CREATE POLICY "Users can view own pending requests"
    ON pending_church_requests
    FOR SELECT
    USING (user_id = auth.uid());

-- Service role can manage all (for webhooks)
CREATE POLICY "Service role can manage pending requests"
    ON pending_church_requests
    FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_pending_church_requests_updated_at
    BEFORE UPDATE ON pending_church_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. GRACE PERIOD CONSTANT (3 days)
-- =====================================================
-- We'll use this in our functions

-- =====================================================
-- 4. FUNCTION: get_subscription_status_for_user
-- =====================================================
-- Returns granular subscription status for access control

DROP FUNCTION IF EXISTS get_subscription_status_for_user(UUID);

CREATE OR REPLACE FUNCTION get_subscription_status_for_user(p_user_id UUID)
RETURNS TABLE (
    status TEXT,
    church_id UUID,
    church_slug TEXT,
    is_ekkle_hub BOOLEAN,
    is_pastor BOOLEAN,
    can_access_profile BOOLEAN,
    can_access_church_features BOOLEAN,
    is_in_grace_period BOOLEAN,
    subscription_end_date TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
    v_subscription RECORD;
    v_is_ekkle_hub BOOLEAN;
    v_is_pastor BOOLEAN;
    v_grace_period_days INTERVAL := INTERVAL '3 days';
    v_grace_end TIMESTAMPTZ;
BEGIN
    -- Get user profile with church info
    SELECT p.*, c.slug as church_slug_value
    INTO v_profile
    FROM profiles p
    LEFT JOIN churches c ON c.id = p.church_id
    WHERE p.id = p_user_id;

    IF v_profile IS NULL THEN
        RETURN QUERY SELECT
            'no_profile'::TEXT,
            NULL::UUID,
            NULL::TEXT,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Check if Ekkle Hub user
    v_is_ekkle_hub := (v_profile.church_id = '00000000-0000-0000-0000-000000000001');
    v_is_pastor := (v_profile.role = 'PASTOR');

    -- Ekkle Hub users always have profile access, no church features
    IF v_is_ekkle_hub THEN
        RETURN QUERY SELECT
            'ekkle_hub'::TEXT,
            v_profile.church_id,
            'ekkle'::TEXT,
            TRUE,
            FALSE,
            TRUE,   -- Can always access profile
            FALSE,  -- No church features (they don't have a church)
            FALSE,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Get church subscription (most recent)
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE church_id = v_profile.church_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- No subscription exists
    IF v_subscription IS NULL THEN
        RETURN QUERY SELECT
            'no_subscription'::TEXT,
            v_profile.church_id,
            v_profile.church_slug_value,
            FALSE,
            v_is_pastor,
            TRUE,   -- Profile always accessible
            FALSE,  -- No church features without subscription
            FALSE,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Calculate grace period end
    v_grace_end := v_subscription.current_period_end + v_grace_period_days;

    -- Check subscription status with grace period
    IF v_subscription.status IN ('active', 'trialing')
       AND v_subscription.current_period_end > NOW() THEN
        -- Active subscription
        RETURN QUERY SELECT
            'active'::TEXT,
            v_profile.church_id,
            v_profile.church_slug_value,
            FALSE,
            v_is_pastor,
            TRUE,
            TRUE,
            FALSE,
            v_subscription.current_period_end,
            v_grace_end;
    ELSIF v_grace_end > NOW() THEN
        -- In grace period (subscription expired but within 3 days)
        RETURN QUERY SELECT
            'grace_period'::TEXT,
            v_profile.church_id,
            v_profile.church_slug_value,
            FALSE,
            v_is_pastor,
            TRUE,
            TRUE,  -- Still has access during grace period
            TRUE,
            v_subscription.current_period_end,
            v_grace_end;
    ELSE
        -- Fully expired (past grace period)
        RETURN QUERY SELECT
            'expired'::TEXT,
            v_profile.church_id,
            v_profile.church_slug_value,
            FALSE,
            v_is_pastor,
            TRUE,   -- Profile still accessible
            FALSE,  -- Church features blocked
            FALSE,
            v_subscription.current_period_end,
            v_grace_end;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_subscription_status_for_user(UUID) TO authenticated;

-- =====================================================
-- 5. FUNCTION: check_church_subscription_status
-- =====================================================
-- Check subscription status by church_id (for site blocking)

DROP FUNCTION IF EXISTS check_church_subscription_status(UUID);

CREATE OR REPLACE FUNCTION check_church_subscription_status(p_church_id UUID)
RETURNS TABLE (
    status TEXT,
    is_active BOOLEAN,
    is_in_grace_period BOOLEAN,
    subscription_end_date TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription RECORD;
    v_grace_period_days INTERVAL := INTERVAL '3 days';
    v_grace_end TIMESTAMPTZ;
BEGIN
    -- Ekkle Hub doesn't need subscription
    IF p_church_id = '00000000-0000-0000-0000-000000000001' THEN
        RETURN QUERY SELECT
            'ekkle_hub'::TEXT,
            TRUE,
            FALSE,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Get church subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE church_id = p_church_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- No subscription
    IF v_subscription IS NULL THEN
        RETURN QUERY SELECT
            'no_subscription'::TEXT,
            FALSE,
            FALSE,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    v_grace_end := v_subscription.current_period_end + v_grace_period_days;

    IF v_subscription.status IN ('active', 'trialing')
       AND v_subscription.current_period_end > NOW() THEN
        RETURN QUERY SELECT
            'active'::TEXT,
            TRUE,
            FALSE,
            v_subscription.current_period_end,
            v_grace_end;
    ELSIF v_grace_end > NOW() THEN
        RETURN QUERY SELECT
            'grace_period'::TEXT,
            TRUE,
            TRUE,
            v_subscription.current_period_end,
            v_grace_end;
    ELSE
        RETURN QUERY SELECT
            'expired'::TEXT,
            FALSE,
            FALSE,
            v_subscription.current_period_end,
            v_grace_end;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION check_church_subscription_status(UUID) TO authenticated, anon;

-- =====================================================
-- 6. UPDATE has_active_subscription TO INCLUDE GRACE PERIOD
-- =====================================================

DROP FUNCTION IF EXISTS has_active_subscription(UUID);

CREATE OR REPLACE FUNCTION has_active_subscription(p_church_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_active BOOLEAN;
    v_grace_period_days INTERVAL := INTERVAL '3 days';
BEGIN
    -- Ekkle Hub always "active" (special case)
    IF p_church_id = '00000000-0000-0000-0000-000000000001' THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE church_id = p_church_id
          AND status IN ('active', 'trialing')
          AND (current_period_end + v_grace_period_days) > NOW()
    ) INTO v_has_active;

    RETURN v_has_active;
END;
$$;

GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
