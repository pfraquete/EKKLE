-- =====================================================
-- EKKLE MARKETPLACE MIGRATION
-- Payment split: 1% platform, 99% church
-- Payment methods: PIX and Credit Card only
-- =====================================================

-- =====================================================
-- 1. RECIPIENTS TABLE
-- Stores Pagar.me recipient configuration for each church
-- =====================================================

CREATE TABLE IF NOT EXISTS recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL UNIQUE REFERENCES churches(id) ON DELETE CASCADE,
    pagarme_recipient_id TEXT UNIQUE NOT NULL,

    -- Recipient details
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    document TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('CPF', 'CNPJ')),
    type TEXT NOT NULL CHECK (type IN ('individual', 'company')),

    -- Bank account
    bank_account_id TEXT,
    bank_code TEXT NOT NULL,
    bank_name TEXT,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
    account_number TEXT NOT NULL,
    account_digit TEXT NOT NULL,
    branch_number TEXT NOT NULL,
    branch_digit TEXT,
    holder_name TEXT NOT NULL,
    holder_document TEXT NOT NULL,

    -- Transfer settings
    transfer_enabled BOOLEAN DEFAULT true,
    transfer_interval TEXT DEFAULT 'daily' CHECK (transfer_interval IN ('daily', 'weekly', 'monthly')),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    verified_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_church_recipient UNIQUE (church_id)
);

CREATE INDEX idx_recipients_church_id ON recipients(church_id);
CREATE INDEX idx_recipients_pagarme_id ON recipients(pagarme_recipient_id);
CREATE INDEX idx_recipients_status ON recipients(status);

-- =====================================================
-- 2. PRODUCT CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_church_category_slug UNIQUE (church_id, slug)
);

CREATE INDEX idx_product_categories_church_id ON product_categories(church_id);
CREATE INDEX idx_product_categories_slug ON product_categories(church_id, slug);
CREATE INDEX idx_product_categories_active ON product_categories(church_id, is_active);

-- =====================================================
-- 3. PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

    -- Product details
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    short_description TEXT,

    -- Pricing (in cents)
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    compare_at_price_cents INTEGER CHECK (compare_at_price_cents >= 0),

    -- Inventory
    sku TEXT,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    track_inventory BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'out_of_stock')),
    is_featured BOOLEAN DEFAULT false,

    -- SEO
    meta_title TEXT,
    meta_description TEXT,

    -- Stats
    views_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_church_product_slug UNIQUE (church_id, slug)
);

CREATE INDEX idx_products_church_id ON products(church_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(church_id, slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- =====================================================
-- 4. PRODUCT IMAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    order_index INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_order ON product_images(product_id, order_index);

-- =====================================================
-- 5. ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Order number (user-facing)
    order_number TEXT NOT NULL UNIQUE,

    -- Customer info
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_document TEXT,

    -- Pagar.me integration
    pagarme_order_id TEXT UNIQUE,
    pagarme_customer_id TEXT,

    -- Totals (in cents)
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),
    shipping_cents INTEGER DEFAULT 0 CHECK (shipping_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),

    -- Payment (PIX or Credit Card only)
    payment_method TEXT CHECK (payment_method IN ('credit_card', 'pix')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'canceled')),
    paid_at TIMESTAMPTZ,

    -- Order status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'canceled',
        'refunded'
    )),

    -- Fulfillment
    fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'partially_fulfilled')),
    fulfilled_at TIMESTAMPTZ,

    -- Notes
    customer_note TEXT,
    internal_note TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_church_id ON orders(church_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_pagarme_order_id ON orders(pagarme_order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- =====================================================
-- 6. ORDER ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Product snapshot (at time of order)
    product_name TEXT NOT NULL,
    product_sku TEXT,

    -- Pricing
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- 7. ORDER PAYMENTS TABLE
-- PIX and Credit Card only (no boleto)
-- =====================================================

CREATE TABLE IF NOT EXISTS order_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Pagar.me references
    pagarme_charge_id TEXT UNIQUE,
    pagarme_transaction_id TEXT,

    -- Payment details
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'pix')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'canceled')),

    -- Card info (last 4 digits only for security)
    card_brand TEXT,
    card_last_four TEXT,

    -- PIX info
    pix_qr_code TEXT,
    pix_qr_code_url TEXT,
    pix_expires_at TIMESTAMPTZ,

    -- Split info
    platform_fee_cents INTEGER,
    church_amount_cents INTEGER,

    -- Timestamps
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,

    -- Error handling
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX idx_order_payments_pagarme_charge_id ON order_payments(pagarme_charge_id);
CREATE INDEX idx_order_payments_status ON order_payments(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Recipients: Only pastors can manage
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors can manage recipients" ON recipients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = recipients.church_id
            AND role = 'PASTOR'
        )
    );

-- Product Categories: Public read active, pastor write
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Church members can view church categories" ON product_categories
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Pastors can manage categories" ON product_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = product_categories.church_id
            AND role = 'PASTOR'
        )
    );

-- Products: Public read active, pastor manage
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Church members can view church products" ON products
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Pastors can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = products.church_id
            AND role = 'PASTOR'
        )
    );

-- Product Images: Follow product visibility
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images follow product visibility" ON product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE id = product_images.product_id
            AND (status = 'active' OR church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()))
        )
    );

CREATE POLICY "Pastors can manage product images" ON product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN profiles pr ON pr.church_id = p.church_id
            WHERE p.id = product_images.product_id
            AND pr.id = auth.uid()
            AND pr.role = 'PASTOR'
        )
    );

-- Orders: Customer and church can view
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their orders" ON orders
    FOR SELECT USING (
        customer_id = auth.uid()
    );

CREATE POLICY "Church members can view church orders" ON orders
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Authenticated users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Pastors can manage orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = orders.church_id
            AND role = 'PASTOR'
        )
    );

-- Order Items: Follow order visibility
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items follow order visibility" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_items.order_id
            AND (customer_id = auth.uid() OR church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()))
        )
    );

CREATE POLICY "Can create order items with order" ON order_items
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Order Payments: Follow order visibility
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order payments follow order visibility" ON order_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_payments.order_id
            AND (customer_id = auth.uid() OR church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()))
        )
    );

CREATE POLICY "Can create order payments with order" ON order_payments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamps
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_payments_updated_at BEFORE UPDATE ON order_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- Update product stock and sales on order payment
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        -- Decrease stock for each item
        UPDATE products p
        SET stock_quantity = GREATEST(0, stock_quantity - oi.quantity),
            sales_count = sales_count + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND oi.product_id = p.id
        AND p.track_inventory = true;

        -- Mark products as out of stock if needed
        UPDATE products
        SET status = 'out_of_stock'
        WHERE id IN (
            SELECT product_id FROM order_items WHERE order_id = NEW.id
        )
        AND track_inventory = true
        AND stock_quantity <= 0
        AND status = 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_payment AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_order();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE recipients IS 'Pagar.me recipient configuration for churches - enables payment splitting';
COMMENT ON TABLE product_categories IS 'Product categories for organizing church store items';
COMMENT ON TABLE products IS 'Church store products with inventory tracking';
COMMENT ON TABLE product_images IS 'Product images with primary image designation';
COMMENT ON TABLE orders IS 'Customer orders with payment and fulfillment tracking';
COMMENT ON TABLE order_items IS 'Line items for each order with product snapshot';
COMMENT ON TABLE order_payments IS 'Payment records with PIX/card details and split amounts';

COMMENT ON COLUMN recipients.pagarme_recipient_id IS 'Pagar.me recipient ID (rec_xxxxx)';
COMMENT ON COLUMN recipients.transfer_interval IS 'How often Pagar.me transfers funds to church bank account';
COMMENT ON COLUMN products.price_cents IS 'Product price in cents (R$ 10.00 = 1000)';
COMMENT ON COLUMN products.stock_quantity IS 'Current available stock quantity';
COMMENT ON COLUMN products.track_inventory IS 'Whether to track inventory and prevent overselling';
COMMENT ON COLUMN orders.order_number IS 'User-friendly order number (auto-generated)';
COMMENT ON COLUMN order_payments.platform_fee_cents IS 'Platform fee (1% of total)';
COMMENT ON COLUMN order_payments.church_amount_cents IS 'Church amount (99% of total)';
