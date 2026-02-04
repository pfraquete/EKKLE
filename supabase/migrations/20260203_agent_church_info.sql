-- ============================================
-- Migration: Church Information for AI Agent
-- Date: 2026-02-03
-- Description: Adds church information fields to church_agent_config
--              for the AI agent to provide location, service times, and leader contacts
-- ============================================

-- Add church information columns to church_agent_config
ALTER TABLE church_agent_config
ADD COLUMN IF NOT EXISTS church_address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS church_address_complement TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS church_city TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS church_state TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS church_zip_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS church_google_maps_link TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS church_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS church_email TEXT DEFAULT '';

-- Add service times as JSONB array for flexibility
-- Format: [{ "day": "Domingo", "time": "10:00", "name": "Culto da Manhã" }, ...]
ALTER TABLE church_agent_config
ADD COLUMN IF NOT EXISTS service_times JSONB DEFAULT '[]'::jsonb;

-- Add leaders contact info as JSONB array
-- Format: [{ "name": "João Silva", "role": "Líder de Célula", "phone": "+5511999999999", "area": "Zona Norte" }, ...]
ALTER TABLE church_agent_config
ADD COLUMN IF NOT EXISTS leaders_contacts JSONB DEFAULT '[]'::jsonb;

-- Add custom info field for any additional information the pastor wants the agent to know
ALTER TABLE church_agent_config
ADD COLUMN IF NOT EXISTS custom_info TEXT DEFAULT '';

-- Comments for documentation
COMMENT ON COLUMN church_agent_config.church_address IS 'Full street address of the church';
COMMENT ON COLUMN church_agent_config.church_address_complement IS 'Address complement (apartment, suite, etc.)';
COMMENT ON COLUMN church_agent_config.church_city IS 'City where the church is located';
COMMENT ON COLUMN church_agent_config.church_state IS 'State/Province where the church is located';
COMMENT ON COLUMN church_agent_config.church_zip_code IS 'Postal/ZIP code of the church';
COMMENT ON COLUMN church_agent_config.church_google_maps_link IS 'Google Maps link for the church location';
COMMENT ON COLUMN church_agent_config.church_phone IS 'Main phone number of the church';
COMMENT ON COLUMN church_agent_config.church_email IS 'Main email of the church';
COMMENT ON COLUMN church_agent_config.service_times IS 'JSON array of service times with day, time, and name';
COMMENT ON COLUMN church_agent_config.leaders_contacts IS 'JSON array of leader contacts with name, role, phone, and area';
COMMENT ON COLUMN church_agent_config.custom_info IS 'Custom information for the AI agent to use in responses';
