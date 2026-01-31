-- =====================================================
-- Annual Plan Migration
-- =====================================================
-- Adds annual subscription plan (R$397/year - 42% savings)
-- =====================================================

-- Ensure annual plan exists with correct Stripe price ID
INSERT INTO subscription_plans (id, name, price_cents, interval, stripe_price_id, is_active, description)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Plano Igreja Anual',
    39700,
    'year',
    'price_1SvlWWAtp9RY5iV7fFsC5iFo',
    true,
    'Acesso completo a todas as funcionalidades - pagamento anual com 42% de desconto'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents,
    interval = EXCLUDED.interval,
    stripe_price_id = EXCLUDED.stripe_price_id,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description;

-- Update monthly plan to ensure correct data
UPDATE subscription_plans
SET
    name = 'Plano Igreja Mensal',
    price_cents = 5700,
    interval = 'month',
    stripe_price_id = 'price_1SvlT5Atp9RY5iV7ZxcrvciJ',
    is_active = true,
    description = 'Acesso completo a todas as funcionalidades - pagamento mensal'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
