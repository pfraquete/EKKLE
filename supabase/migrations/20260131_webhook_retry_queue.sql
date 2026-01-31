-- ============================================
-- Webhook Retry Queue System
-- ============================================
-- Stores failed webhook events for automatic retry
-- with exponential backoff and dead letter queue

-- Create the failed webhook events table
CREATE TABLE IF NOT EXISTS failed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'stripe', 'mux', 'twilio'
    event_id TEXT NOT NULL, -- Original event ID from provider
    event_type TEXT NOT NULL, -- Event type (e.g., 'invoice.paid')
    payload JSONB NOT NULL DEFAULT '{}', -- Sanitized event payload
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    next_retry_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'failed', 'dead_letter')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint to prevent duplicate events
    CONSTRAINT unique_provider_event UNIQUE (provider, event_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_failed_webhooks_status_retry
    ON failed_webhook_events (status, next_retry_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_failed_webhooks_provider
    ON failed_webhook_events (provider);

CREATE INDEX IF NOT EXISTS idx_failed_webhooks_dead_letter
    ON failed_webhook_events (status, created_at)
    WHERE status = 'dead_letter';

-- Enable RLS
ALTER TABLE failed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access (internal system table)
CREATE POLICY "Service role only" ON failed_webhook_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_failed_webhook_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS trigger_update_failed_webhook_timestamp ON failed_webhook_events;
CREATE TRIGGER trigger_update_failed_webhook_timestamp
    BEFORE UPDATE ON failed_webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_failed_webhook_timestamp();

-- Function to cleanup old dead letter events (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_dead_letter_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM failed_webhook_events
    WHERE status = 'dead_letter'
    AND created_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE failed_webhook_events IS 'Stores failed webhook events for automatic retry with exponential backoff';
COMMENT ON COLUMN failed_webhook_events.provider IS 'Webhook provider: stripe, mux, twilio';
COMMENT ON COLUMN failed_webhook_events.status IS 'pending = waiting for retry, processing = currently being processed, dead_letter = max retries exceeded';
