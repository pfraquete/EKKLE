-- =====================================================
-- FINANCIAL MODULE MIGRATION - 2026-02-15
-- =====================================================

-- 1. Create financial_transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    -- Transaction info
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category TEXT NOT NULL CHECK (category IN (
        'TITHE', 
        'OFFERING', 
        'STORE_SALE', 
        'EVENT_REGISTRATION', 
        'RENT', 
        'UTILITIES', 
        'SALARY', 
        'MAINTENANCE',
        'OTHER'
    )),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')) DEFAULT 'PAID',
    
    -- Values (in cents)
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    description TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Optional links
    member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reference_id UUID, -- Link to order_id, event_payment_id, etc.
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_finance_church_id ON financial_transactions(church_id);
CREATE INDEX idx_finance_date ON financial_transactions(date DESC);
CREATE INDEX idx_finance_type ON financial_transactions(type);
CREATE INDEX idx_finance_category ON financial_transactions(category);
CREATE INDEX idx_finance_reference ON financial_transactions(reference_id);

-- Updated at trigger
CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Pastors can manage all financial data
CREATE POLICY "Pastors can manage church finance" ON financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = financial_transactions.church_id
            AND role = 'PASTOR'
        )
    );

-- Leaders can view financial data (optional, or maybe only specific ones? Let's limit to pastors for now as requested)
-- CREATE POLICY "Leaders can view church finance" ON financial_transactions ...

-- 2. AUTOMATION TRIGGERS

-- Function to sync store orders
CREATE OR REPLACE FUNCTION fn_sync_order_to_finance() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if status changed to 'paid'
    IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid')) THEN
        INSERT INTO financial_transactions (
            church_id,
            type,
            category,
            status,
            amount_cents,
            description,
            date,
            member_id,
            reference_id,
            metadata
        ) VALUES (
            NEW.church_id,
            'INCOME',
            'STORE_SALE',
            'PAID',
            NEW.total_cents,
            'Venda na Loja - Pedido #' || NEW.order_number,
            NEW.paid_at,
            NEW.customer_id,
            NEW.id,
            jsonb_build_object('order_number', NEW.order_number)
        )
        ON CONFLICT (reference_id) DO UPDATE SET
            status = 'PAID',
            amount_cents = NEW.total_cents,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for orders
CREATE TRIGGER trg_sync_order_to_finance
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_order_to_finance();

-- Ensure reference_id is unique enough for sync?
-- Actually, reference_id alone isn't unique across tables. 
-- But in the insertion we can use a unique constraint or just check.
-- For safety, let's add a unique constraint on (reference_id, category) if we want idempotency.
ALTER TABLE financial_transactions ADD CONSTRAINT unique_finance_reference UNIQUE (reference_id, category);

-- Function to sync event payments
CREATE OR REPLACE FUNCTION fn_sync_event_payment_to_finance() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if status changed to 'PAID'
    IF (NEW.status = 'PAID' AND (OLD.status IS DISTINCT FROM 'PAID')) THEN
        INSERT INTO financial_transactions (
            church_id,
            type,
            category,
            status,
            amount_cents,
            description,
            date,
            member_id,
            reference_id,
            metadata
        ) VALUES (
            NEW.church_id,
            'INCOME',
            'EVENT_REGISTRATION',
            'PAID',
            NEW.amount_cents,
            'Inscrição em Evento - Pagamento #' || NEW.id,
            COALESCE(NEW.paid_at, NOW()),
            (SELECT profile_id FROM event_registrations WHERE id = NEW.registration_id),
            NEW.id,
            jsonb_build_object('registration_id', NEW.registration_id)
        )
        ON CONFLICT (reference_id, category) DO UPDATE SET
            status = 'PAID',
            amount_cents = NEW.amount_cents,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for event payments
CREATE TRIGGER trg_sync_event_payment_to_finance
    AFTER UPDATE ON event_payments
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_event_payment_to_finance();
