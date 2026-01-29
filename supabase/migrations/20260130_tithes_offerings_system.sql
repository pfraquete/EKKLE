-- =====================================================
-- TITHES AND OFFERINGS SYSTEM - 2026-01-30
-- =====================================================
-- Sistema completo de dizimos, ofertas e financeiro
-- - Dizimos dos membros (PIX direto + comprovante)
-- - Caixa da celula (ofertas via Pagar.me)
-- - Equipe financeira da igreja
-- =====================================================

-- =====================================================
-- 1. MEMBER TITHES TABLE
-- Registro mensal de dizimos dos membros
-- =====================================================

CREATE TABLE IF NOT EXISTS member_tithes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Periodo
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

    -- Valores
    amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),

    -- Comprovante
    receipt_url TEXT,
    payment_method TEXT CHECK (payment_method IN ('pix', 'cash', 'transfer', 'other')),

    -- Status e confirmacao
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED')) DEFAULT 'PENDING',
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,

    -- Notas
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: um registro por membro por mes
    UNIQUE(profile_id, year, month)
);

-- Indexes
CREATE INDEX idx_tithes_church_id ON member_tithes(church_id);
CREATE INDEX idx_tithes_profile_id ON member_tithes(profile_id);
CREATE INDEX idx_tithes_year_month ON member_tithes(year, month);
CREATE INDEX idx_tithes_status ON member_tithes(status);

-- Updated at trigger
CREATE TRIGGER update_member_tithes_updated_at
    BEFORE UPDATE ON member_tithes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE member_tithes ENABLE ROW LEVEL SECURITY;

-- Members can view and manage their own tithes
CREATE POLICY "Members can view their own tithes" ON member_tithes
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Members can insert their own tithes" ON member_tithes
    FOR INSERT WITH CHECK (
        profile_id = auth.uid() AND
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Members can update their own pending tithes" ON member_tithes
    FOR UPDATE USING (
        profile_id = auth.uid() AND
        status = 'PENDING'
    );

-- Pastors and finance team can manage all tithes
CREATE POLICY "Pastors can manage all tithes" ON member_tithes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = member_tithes.church_id
            AND role = 'PASTOR'
        )
    );

CREATE POLICY "Finance team can manage tithes" ON member_tithes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN finance_team ft ON ft.profile_id = p.id
            WHERE p.id = auth.uid()
            AND ft.church_id = member_tithes.church_id
        )
    );

-- =====================================================
-- 2. CELL BALANCE TABLE
-- Saldo atual do caixa de cada celula
-- =====================================================

CREATE TABLE IF NOT EXISTS cell_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID NOT NULL UNIQUE REFERENCES cells(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Saldo em centavos
    balance_cents INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cell_balance_church_id ON cell_balance(church_id);
CREATE INDEX idx_cell_balance_cell_id ON cell_balance(cell_id);

-- Updated at trigger
CREATE TRIGGER update_cell_balance_updated_at
    BEFORE UPDATE ON cell_balance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE cell_balance ENABLE ROW LEVEL SECURITY;

-- Cell members can view their cell balance
CREATE POLICY "Cell members can view their cell balance" ON cell_balance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND cell_id = cell_balance.cell_id
        )
    );

-- Cell leaders can view their cell balance
CREATE POLICY "Cell leaders can view their cell balance" ON cell_balance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cells
            WHERE id = cell_balance.cell_id
            AND leader_id = auth.uid()
        )
    );

-- Pastors can view all cell balances
CREATE POLICY "Pastors can view all cell balances" ON cell_balance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = cell_balance.church_id
            AND role = 'PASTOR'
        )
    );

-- Finance team can view all cell balances
CREATE POLICY "Finance team can view cell balances" ON cell_balance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN finance_team ft ON ft.profile_id = p.id
            WHERE p.id = auth.uid()
            AND ft.church_id = cell_balance.church_id
        )
    );

-- =====================================================
-- 3. CELL OFFERINGS TABLE
-- Ofertas feitas para o caixa da celula
-- =====================================================

CREATE TABLE IF NOT EXISTS cell_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Valores em centavos
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),

    -- Metodo de pagamento
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card')),

    -- Status do pagamento
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')) DEFAULT 'PENDING',

    -- Pagar.me integration
    pagarme_order_id TEXT,
    pagarme_charge_id TEXT,

    -- PIX data
    pix_qr_code TEXT,
    pix_qr_code_url TEXT,
    pix_expires_at TIMESTAMPTZ,

    -- Split amounts
    platform_fee_cents INTEGER NOT NULL DEFAULT 0,
    cell_amount_cents INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cell_offerings_church_id ON cell_offerings(church_id);
CREATE INDEX idx_cell_offerings_cell_id ON cell_offerings(cell_id);
CREATE INDEX idx_cell_offerings_profile_id ON cell_offerings(profile_id);
CREATE INDEX idx_cell_offerings_status ON cell_offerings(status);
CREATE INDEX idx_cell_offerings_pagarme_order ON cell_offerings(pagarme_order_id);

-- Updated at trigger
CREATE TRIGGER update_cell_offerings_updated_at
    BEFORE UPDATE ON cell_offerings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE cell_offerings ENABLE ROW LEVEL SECURITY;

-- Cell members can view offerings from their cell
CREATE POLICY "Cell members can view cell offerings" ON cell_offerings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND cell_id = cell_offerings.cell_id
        )
    );

-- Members can create offerings for their cell
CREATE POLICY "Members can create offerings for their cell" ON cell_offerings
    FOR INSERT WITH CHECK (
        profile_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND cell_id = cell_offerings.cell_id
        )
    );

-- Members can view their own offerings
CREATE POLICY "Members can view their own offerings" ON cell_offerings
    FOR SELECT USING (profile_id = auth.uid());

-- Pastors can manage all offerings
CREATE POLICY "Pastors can manage all offerings" ON cell_offerings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = cell_offerings.church_id
            AND role = 'PASTOR'
        )
    );

-- Finance team can view all offerings
CREATE POLICY "Finance team can view offerings" ON cell_offerings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN finance_team ft ON ft.profile_id = p.id
            WHERE p.id = auth.uid()
            AND ft.church_id = cell_offerings.church_id
        )
    );

-- =====================================================
-- 4. FINANCE TEAM TABLE
-- Membros com acesso ao financeiro da igreja
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: um membro por igreja na equipe
    UNIQUE(church_id, profile_id)
);

-- Indexes
CREATE INDEX idx_finance_team_church_id ON finance_team(church_id);
CREATE INDEX idx_finance_team_profile_id ON finance_team(profile_id);

-- RLS
ALTER TABLE finance_team ENABLE ROW LEVEL SECURITY;

-- Pastors can manage finance team
CREATE POLICY "Pastors can manage finance team" ON finance_team
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = finance_team.church_id
            AND role = 'PASTOR'
        )
    );

-- Finance team members can view the team
CREATE POLICY "Finance team can view team members" ON finance_team
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM finance_team ft
            WHERE ft.profile_id = auth.uid()
            AND ft.church_id = finance_team.church_id
        )
    );

-- Members can check if they are in finance team
CREATE POLICY "Members can check own finance team status" ON finance_team
    FOR SELECT USING (profile_id = auth.uid());

-- =====================================================
-- 5. ADD PIX CONFIG TO CHURCHES
-- =====================================================

ALTER TABLE churches ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random'));

-- =====================================================
-- 6. ADD is_finance_team TO PROFILES (computed/cached)
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_finance_team BOOLEAN DEFAULT false;

-- =====================================================
-- 7. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update cell balance when offering is paid
CREATE OR REPLACE FUNCTION fn_update_cell_balance_on_offering()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if status changed to 'PAID'
    IF (NEW.status = 'PAID' AND (OLD.status IS DISTINCT FROM 'PAID')) THEN
        -- Insert or update cell balance
        INSERT INTO cell_balance (cell_id, church_id, balance_cents)
        VALUES (NEW.cell_id, NEW.church_id, NEW.cell_amount_cents)
        ON CONFLICT (cell_id) DO UPDATE SET
            balance_cents = cell_balance.balance_cents + NEW.cell_amount_cents,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for cell offerings
CREATE TRIGGER trg_update_cell_balance_on_offering
    AFTER UPDATE ON cell_offerings
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_cell_balance_on_offering();

-- Function to sync confirmed tithes to financial_transactions
CREATE OR REPLACE FUNCTION fn_sync_tithe_to_finance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if status changed to 'CONFIRMED'
    IF (NEW.status = 'CONFIRMED' AND (OLD.status IS DISTINCT FROM 'CONFIRMED')) THEN
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
            'TITHE',
            'PAID',
            NEW.amount_cents,
            'Dizimo - ' || TO_CHAR(MAKE_DATE(NEW.year, NEW.month, 1), 'Month YYYY'),
            COALESCE(NEW.confirmed_at, NOW()),
            NEW.profile_id,
            NEW.id,
            jsonb_build_object('year', NEW.year, 'month', NEW.month)
        )
        ON CONFLICT (reference_id, category) DO UPDATE SET
            status = 'PAID',
            amount_cents = NEW.amount_cents,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tithes
CREATE TRIGGER trg_sync_tithe_to_finance
    AFTER UPDATE ON member_tithes
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_tithe_to_finance();

-- Function to sync cell offerings to financial_transactions
CREATE OR REPLACE FUNCTION fn_sync_cell_offering_to_finance()
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
            'OFFERING',
            'PAID',
            NEW.cell_amount_cents, -- Amount after platform fee
            'Oferta da Celula',
            COALESCE(NEW.paid_at, NOW()),
            NEW.profile_id,
            NEW.id,
            jsonb_build_object('cell_id', NEW.cell_id, 'payment_method', NEW.payment_method)
        )
        ON CONFLICT (reference_id, category) DO UPDATE SET
            status = 'PAID',
            amount_cents = NEW.cell_amount_cents,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for cell offerings to finance
CREATE TRIGGER trg_sync_cell_offering_to_finance
    AFTER UPDATE ON cell_offerings
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_cell_offering_to_finance();

-- Function to sync finance_team membership to profiles.is_finance_team
CREATE OR REPLACE FUNCTION fn_sync_finance_team_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET is_finance_team = true WHERE id = NEW.profile_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET is_finance_team = false WHERE id = OLD.profile_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for finance team changes
CREATE TRIGGER trg_sync_finance_team_flag
    AFTER INSERT OR DELETE ON finance_team
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_finance_team_flag();

-- =====================================================
-- 8. INITIALIZE CELL BALANCES FOR EXISTING CELLS
-- =====================================================

INSERT INTO cell_balance (cell_id, church_id, balance_cents)
SELECT id, church_id, 0
FROM cells
WHERE NOT EXISTS (
    SELECT 1 FROM cell_balance WHERE cell_id = cells.id
)
ON CONFLICT (cell_id) DO NOTHING;
