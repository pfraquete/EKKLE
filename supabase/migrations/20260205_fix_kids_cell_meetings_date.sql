-- =====================================================
-- FIX: Add missing meeting_date column to kids_cell_meetings
-- =====================================================
-- This migration adds the meeting_date column if it doesn't exist
-- The column should have been created by 20260203_kids_network.sql
-- but may be missing in some environments

-- Add meeting_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kids_cell_meetings'
        AND column_name = 'meeting_date'
    ) THEN
        ALTER TABLE kids_cell_meetings ADD COLUMN meeting_date DATE NOT NULL DEFAULT CURRENT_DATE;

        -- Remove the default after adding (we want it required for new records)
        ALTER TABLE kids_cell_meetings ALTER COLUMN meeting_date DROP DEFAULT;
    END IF;
END $$;

-- Add meeting_time column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kids_cell_meetings'
        AND column_name = 'meeting_time'
    ) THEN
        ALTER TABLE kids_cell_meetings ADD COLUMN meeting_time TIME;
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kids_cell_meetings'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE kids_cell_meetings ADD COLUMN status TEXT DEFAULT 'SCHEDULED'
            CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'));
    END IF;
END $$;

-- Create index on meeting_date if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_kids_cell_meetings_date ON kids_cell_meetings(meeting_date);

-- Create index on status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_kids_cell_meetings_status ON kids_cell_meetings(status);

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'kids_cell_meetings table columns verified/added successfully';
END $$;
