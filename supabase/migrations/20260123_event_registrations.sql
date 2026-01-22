-- Event Registrations System
-- This migration adds the event registration/RSVP functionality

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Registration info
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST', 'ATTENDED')) DEFAULT 'CONFIRMED',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,

    -- Payment info (for paid events)
    payment_required BOOLEAN NOT NULL DEFAULT FALSE,
    payment_amount_cents INTEGER,
    payment_status TEXT CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
    pagarme_order_id TEXT,
    pagarme_charge_id TEXT,
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    -- Attendance tracking
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES profiles(id),

    -- Guest registrations
    guest_count INTEGER NOT NULL DEFAULT 0,
    guest_names TEXT[],

    -- Metadata
    registration_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(event_id, profile_id),
    CHECK (guest_count >= 0),
    CHECK (payment_required = FALSE OR payment_amount_cents IS NOT NULL)
);

-- Create indexes for event_registrations
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_profile_id ON event_registrations(profile_id);
CREATE INDEX idx_event_registrations_church_id ON event_registrations(church_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_payment_status ON event_registrations(payment_status) WHERE payment_status IS NOT NULL;
CREATE INDEX idx_event_registrations_registered_at ON event_registrations(registered_at);

-- Create event_payments table
CREATE TABLE IF NOT EXISTS event_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Pagar.me integration
    pagarme_order_id TEXT,
    pagarme_charge_id TEXT,
    pagarme_transaction_id TEXT,

    -- Payment details
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'pix', 'boleto')),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')) DEFAULT 'PENDING',

    -- Split payment
    platform_fee_cents INTEGER,
    church_amount_cents INTEGER,

    -- Payment method specific data
    card_brand TEXT,
    card_last_four TEXT,
    pix_qr_code TEXT,
    pix_qr_code_url TEXT,
    pix_expires_at TIMESTAMPTZ,
    boleto_url TEXT,
    boleto_barcode TEXT,

    -- Timestamps
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for event_payments
CREATE INDEX idx_event_payments_registration_id ON event_payments(registration_id);
CREATE INDEX idx_event_payments_event_id ON event_payments(event_id);
CREATE INDEX idx_event_payments_church_id ON event_payments(church_id);
CREATE INDEX idx_event_payments_status ON event_payments(status);
CREATE INDEX idx_event_payments_pagarme_order_id ON event_payments(pagarme_order_id) WHERE pagarme_order_id IS NOT NULL;

-- Trigger for updated_at on event_registrations
CREATE TRIGGER update_event_registrations_updated_at
    BEFORE UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on event_payments
CREATE TRIGGER update_event_payments_updated_at
    BEFORE UPDATE ON event_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_registrations

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations"
    ON event_registrations
    FOR SELECT
    USING (profile_id = auth.uid());

-- Users can create their own registrations
CREATE POLICY "Users can register for events"
    ON event_registrations
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Users can update their own registrations (for cancellation)
CREATE POLICY "Users can update their own registrations"
    ON event_registrations
    FOR UPDATE
    USING (profile_id = auth.uid());

-- Pastors/leaders can view all registrations for their church
CREATE POLICY "Pastors and leaders can view church registrations"
    ON event_registrations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = event_registrations.church_id
            AND profiles.role IN ('PASTOR', 'LEADER')
        )
    );

-- Pastors/leaders can manage all registrations for their church
CREATE POLICY "Pastors and leaders can manage church registrations"
    ON event_registrations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = event_registrations.church_id
            AND profiles.role IN ('PASTOR', 'LEADER')
        )
    );

-- RLS Policies for event_payments

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
    ON event_payments
    FOR SELECT
    USING (
        registration_id IN (
            SELECT id FROM event_registrations WHERE profile_id = auth.uid()
        )
    );

-- System can create payments (through server actions)
CREATE POLICY "System can create payments"
    ON event_payments
    FOR INSERT
    WITH CHECK (
        registration_id IN (
            SELECT id FROM event_registrations WHERE profile_id = auth.uid()
        )
    );

-- Pastors can view all church payments
CREATE POLICY "Pastors can view church payments"
    ON event_payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = event_payments.church_id
            AND profiles.role IN ('PASTOR', 'LEADER')
        )
    );

-- Pastors can manage all church payments
CREATE POLICY "Pastors can manage church payments"
    ON event_payments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.church_id = event_payments.church_id
            AND profiles.role = 'PASTOR'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE event_registrations IS 'Stores event registrations/RSVPs with payment and attendance tracking';
COMMENT ON TABLE event_payments IS 'Stores payment information for paid events with Pagar.me integration';
COMMENT ON COLUMN event_registrations.status IS 'PENDING: Awaiting confirmation, CONFIRMED: Registered, CANCELLED: Cancelled, WAITLIST: On waiting list, ATTENDED: Checked in';
COMMENT ON COLUMN event_registrations.payment_status IS 'PENDING: Payment not completed, PAID: Payment successful, REFUNDED: Payment refunded, FAILED: Payment failed';
COMMENT ON COLUMN event_payments.status IS 'PENDING: Payment pending, PAID: Payment completed, REFUNDED: Payment refunded, FAILED: Payment failed';
