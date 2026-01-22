-- ISS-003: Fix RLS Vulnerability in orders table
-- The old policy allowed any authenticated user to insert orders with any church_id.

-- 1. Drop the vulnerable policy
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;

-- 2. Create a secure policy that validates church_id and customer_id
CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT 
    WITH CHECK (
        auth.uid() = customer_id 
        AND 
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- 3. Also secure order_items and order_payments
DROP POLICY IF EXISTS "Can create order items with order" ON order_items;
CREATE POLICY "Users can create items for their own orders" ON order_items
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_items.order_id
            AND customer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Can create order payments with order" ON order_payments;
CREATE POLICY "Users can create payments for their own orders" ON order_payments
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_payments.order_id
            AND customer_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can create their own orders" ON orders IS 'Fixed ISS-003: Restricts order creation to the users own church and profile.';
