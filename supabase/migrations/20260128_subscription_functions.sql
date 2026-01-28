-- =====================================================
-- Database Functions for Subscription Management
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS has_active_subscription(UUID);
DROP FUNCTION IF EXISTS get_church_subscription(UUID);

-- Function: has_active_subscription
-- Returns true if church has an active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_church_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_active BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE church_id = p_church_id
          AND status IN ('active', 'trialing')
          AND current_period_end > NOW()
    ) INTO v_has_active;

    RETURN v_has_active;
END;
$$;

-- Function: get_church_subscription
-- Returns church subscription details with plan information
CREATE OR REPLACE FUNCTION get_church_subscription(p_church_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_id UUID,
    plan_name TEXT,
    plan_price_cents INTEGER,
    status TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN,
    canceled_at TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS subscription_id,
        s.plan_id,
        sp.name AS plan_name,
        sp.price_cents AS plan_price_cents,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.canceled_at,
        s.stripe_subscription_id,
        s.stripe_customer_id
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.church_id = p_church_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_church_subscription(UUID) TO authenticated;

-- =====================================================
-- Functions Created Successfully
-- =====================================================
