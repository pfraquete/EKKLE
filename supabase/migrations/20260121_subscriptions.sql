-- =====================================================
-- Ekkle - Sistema de Assinaturas (Pagar.me)
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- SUBSCRIPTION PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL, -- Valor em centavos (5700 = R$ 57,00)
    interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
    interval_count INTEGER NOT NULL DEFAULT 1,
    trial_days INTEGER DEFAULT 0,
    pagarme_plan_id TEXT, -- ID do plano no Pagar.me
    features JSONB DEFAULT '[]'::jsonb, -- Lista de features do plano
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    pagarme_subscription_id TEXT, -- ID da assinatura no Pagar.me
    pagarme_customer_id TEXT, -- ID do cliente no Pagar.me
    status TEXT NOT NULL CHECK (status IN (
        'pending',      -- Aguardando pagamento
        'active',       -- Ativa
        'canceled',     -- Cancelada
        'past_due',     -- Pagamento atrasado
        'unpaid',       -- Não pago
        'trialing',     -- Em período de teste
        'expired'       -- Expirada
    )) DEFAULT 'pending',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTION INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    pagarme_invoice_id TEXT, -- ID da fatura no Pagar.me
    pagarme_charge_id TEXT, -- ID da cobrança no Pagar.me
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'pending',      -- Aguardando pagamento
        'paid',         -- Pago
        'failed',       -- Falhou
        'refunded',     -- Reembolsado
        'canceled'      -- Cancelado
    )) DEFAULT 'pending',
    payment_method TEXT, -- 'credit_card', 'boleto', 'pix'
    paid_at TIMESTAMPTZ,
    due_date DATE,
    boleto_url TEXT,
    boleto_barcode TEXT,
    pix_qr_code TEXT,
    pix_qr_code_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENT METHODS TABLE (Cartões salvos)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    pagarme_card_id TEXT, -- ID do cartão no Pagar.me
    brand TEXT, -- 'visa', 'mastercard', etc
    last_four TEXT, -- Últimos 4 dígitos
    exp_month INTEGER,
    exp_year INTEGER,
    holder_name TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WEBHOOK EVENTS TABLE (Log de eventos do Pagar.me)
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    pagarme_event_id TEXT,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_church_id ON subscriptions(church_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pagarme_id ON subscriptions(pagarme_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_church_id ON subscription_invoices(church_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);

CREATE INDEX IF NOT EXISTS idx_payment_methods_church_id ON payment_methods(church_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Todos podem ver planos ativos
CREATE POLICY "Anyone can view active plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Subscriptions: Usuários podem ver assinaturas da sua igreja
CREATE POLICY "Users can view their church subscription" ON subscriptions
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors can manage subscriptions
CREATE POLICY "Pastors can manage subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = subscriptions.church_id
            AND role = 'PASTOR'
        )
    );

-- Invoices: Usuários podem ver faturas da sua igreja
CREATE POLICY "Users can view their church invoices" ON subscription_invoices
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Payment Methods: Pastors podem gerenciar métodos de pagamento
CREATE POLICY "Pastors can manage payment methods" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = payment_methods.church_id
            AND role = 'PASTOR'
        )
    );

-- Webhook events: Apenas service role pode acessar
CREATE POLICY "Service role can manage webhook events" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_invoices_updated_at BEFORE UPDATE ON subscription_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA - PLANOS EKKLE
-- =====================================================

-- Plano Mensal - R$ 57,00
INSERT INTO subscription_plans (id, name, description, price_cents, interval, interval_count, features)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Plano Mensal',
    'Acesso completo ao Ekkle com cobrança mensal',
    5700,
    'month',
    1,
    '[
        "Gestão ilimitada de células",
        "Gestão ilimitada de membros",
        "Relatórios completos",
        "Automação via WhatsApp",
        "Site personalizado para igreja",
        "Cursos e eventos",
        "Suporte prioritário"
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_cents = EXCLUDED.price_cents,
    features = EXCLUDED.features;

-- Plano Anual - R$ 397,00 (economia de ~42%)
INSERT INTO subscription_plans (id, name, description, price_cents, interval, interval_count, features)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Plano Anual',
    'Acesso completo ao Ekkle com cobrança anual - Economize 42%!',
    39700,
    'year',
    1,
    '[
        "Gestão ilimitada de células",
        "Gestão ilimitada de membros",
        "Relatórios completos",
        "Automação via WhatsApp",
        "Site personalizado para igreja",
        "Cursos e eventos",
        "Suporte prioritário",
        "Economia de 42% em relação ao mensal"
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_cents = EXCLUDED.price_cents,
    features = EXCLUDED.features;

-- =====================================================
-- FUNCTION: Check if church has active subscription
-- =====================================================

CREATE OR REPLACE FUNCTION has_active_subscription(p_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE church_id = p_church_id
        AND status IN ('active', 'trialing')
        AND (current_period_end IS NULL OR current_period_end > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get church subscription status
-- =====================================================

CREATE OR REPLACE FUNCTION get_church_subscription(p_church_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_price_cents INTEGER,
    status TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        sp.name,
        sp.price_cents,
        s.status,
        s.current_period_end,
        s.cancel_at_period_end
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.church_id = p_church_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
