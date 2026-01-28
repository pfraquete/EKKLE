-- =====================================================
-- Migration: Pagar.me to Stripe
-- =====================================================
-- Migrates subscription system from Pagar.me to Stripe
-- =====================================================

-- Update subscription_plans table
ALTER TABLE subscription_plans
  DROP COLUMN IF EXISTS pagarme_plan_id,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Update subscriptions table
ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS pagarme_subscription_id,
  DROP COLUMN IF EXISTS pagarme_customer_id,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Update subscription_invoices table
ALTER TABLE subscription_invoices
  DROP COLUMN IF EXISTS pagarme_invoice_id,
  DROP COLUMN IF EXISTS pagarme_charge_id,
  DROP COLUMN IF EXISTS boleto_url,
  DROP COLUMN IF EXISTS boleto_barcode,
  DROP COLUMN IF EXISTS pix_qr_code,
  DROP COLUMN IF EXISTS pix_qr_code_url,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Update payment_methods table
ALTER TABLE payment_methods
  DROP COLUMN IF EXISTS pagarme_card_id,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- Update webhook_events table
ALTER TABLE webhook_events
  DROP COLUMN IF EXISTS pagarme_event_id,
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

-- Add indexes for Stripe IDs
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_stripe_invoice ON subscription_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_pm ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event ON webhook_events(stripe_event_id);

-- =====================================================
-- Migration Complete
-- =====================================================
