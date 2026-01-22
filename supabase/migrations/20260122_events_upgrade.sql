-- Add new columns to events table for Courses and Advanced Events support

DO $$ 
BEGIN 
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'category') THEN
        ALTER TABLE events ADD COLUMN category TEXT DEFAULT 'EVENT';
    END IF;

    -- Add requires_registration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'requires_registration') THEN
        ALTER TABLE events ADD COLUMN requires_registration BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_paid
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_paid') THEN
        ALTER TABLE events ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'price') THEN
        ALTER TABLE events ADD COLUMN price DECIMAL(10, 2);
    END IF;

    -- Add capacity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'capacity') THEN
        ALTER TABLE events ADD COLUMN capacity INTEGER;
    END IF;

    -- Add is_online
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_online') THEN
        ALTER TABLE events ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add online_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'online_url') THEN
        ALTER TABLE events ADD COLUMN online_url TEXT;
    END IF;

    -- Add registration_link
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registration_link') THEN
        ALTER TABLE events ADD COLUMN registration_link TEXT;
    END IF;

    -- Add recurring pattern (optional, good for prayer campaigns)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'recurrence_pattern') THEN
        ALTER TABLE events ADD COLUMN recurrence_pattern TEXT;
    END IF;

    -- Add image_url (if not exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
    END IF;

END $$;
