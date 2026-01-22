-- =====================================================
-- PUBLIC ACCESS FIXES - 2026-01-22
-- =====================================================

-- 1. Allow public read access to churches table
-- Needed for the public site to fetch church details (name, logo, settings)
-- We strictly limit this to SELECT operations.

DO $$ 
BEGIN
    -- Check if RLS is enabled, if not enable it (safety net)
    ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

    -- Create policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'churches' AND policyname = 'Public can view basic church info'
    ) THEN
        CREATE POLICY "Public can view basic church info" ON churches
            FOR SELECT TO anon, authenticated
            USING (true);
    END IF;
END $$;

-- 2. Allow Pastors to update their own church settings
-- Without this, the /configuracoes/site form update might fail if RLS blocks it.
-- (Assuming an existing policy might be too restrictive or missing)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'churches' AND policyname = 'Pastors can update their church'
    ) THEN
        CREATE POLICY "Pastors can update their church" ON churches
            FOR UPDATE TO authenticated
            USING (
                id IN (SELECT church_id FROM profiles WHERE id = auth.uid() AND role = 'PASTOR')
            )
            WITH CHECK (
                id IN (SELECT church_id FROM profiles WHERE id = auth.uid() AND role = 'PASTOR')
            );
    END IF;
END $$;
