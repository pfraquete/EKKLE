-- ============================================
-- Migration: Agent Configuration System
-- Date: 2026-02-03
-- Description: Adds church_agent_config table for AI agent personality,
--              working hours, automated messages, and automation rules
-- ============================================

-- Create church_agent_config table
CREATE TABLE IF NOT EXISTS church_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Personality Settings
    agent_name TEXT NOT NULL DEFAULT 'Assistente Ekkle',
    tone TEXT NOT NULL DEFAULT 'friendly' CHECK (tone IN ('formal', 'casual', 'friendly', 'professional')),
    language_style TEXT NOT NULL DEFAULT 'encouraging' CHECK (language_style IN ('direct', 'detailed', 'encouraging')),
    emoji_usage TEXT NOT NULL DEFAULT 'moderate' CHECK (emoji_usage IN ('none', 'minimal', 'moderate', 'frequent')),

    -- Working Hours Settings
    working_hours_enabled BOOLEAN NOT NULL DEFAULT false,
    working_hours_start TIME NOT NULL DEFAULT '08:00',
    working_hours_end TIME NOT NULL DEFAULT '18:00',
    working_days INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5],
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',

    -- Automated Messages
    outside_hours_message TEXT NOT NULL DEFAULT 'Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. Deixe sua mensagem que responderemos assim que possível. Que Deus abençoe! 🙏',
    first_contact_message TEXT NOT NULL DEFAULT 'Olá! Sou o assistente virtual da igreja. Como posso ajudá-lo hoje?',
    fallback_message TEXT NOT NULL DEFAULT 'Desculpe, não consegui processar sua mensagem no momento. Por favor, tente novamente em alguns instantes.',

    -- Birthday Automation
    auto_birthday_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_birthday_time TIME NOT NULL DEFAULT '09:00',

    -- Event Reminder Automation
    auto_event_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_event_reminder_hours INTEGER NOT NULL DEFAULT 24,

    -- Welcome Automation
    auto_welcome_enabled BOOLEAN NOT NULL DEFAULT true,

    -- Absence Follow-up Automation
    auto_absence_followup_enabled BOOLEAN NOT NULL DEFAULT false,
    auto_absence_followup_days INTEGER NOT NULL DEFAULT 14,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT church_agent_config_church_unique UNIQUE (church_id)
);

-- Create indexes
CREATE INDEX idx_church_agent_config_church_id ON church_agent_config(church_id);

-- Enable RLS
ALTER TABLE church_agent_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their church agent config"
    ON church_agent_config FOR SELECT
    USING (
        church_id IN (
            SELECT church_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Pastors can manage their church agent config"
    ON church_agent_config FOR ALL
    USING (
        church_id IN (
            SELECT church_id FROM profiles
            WHERE id = auth.uid() AND role = 'PASTOR'
        )
    )
    WITH CHECK (
        church_id IN (
            SELECT church_id FROM profiles
            WHERE id = auth.uid() AND role = 'PASTOR'
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_church_agent_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_church_agent_config_updated_at
    BEFORE UPDATE ON church_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION update_church_agent_config_updated_at();

-- Alter message_templates to add new categories
-- First, drop the existing check constraint if it exists
DO $$
BEGIN
    ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_category_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add new check constraint with expanded categories
ALTER TABLE message_templates ADD CONSTRAINT message_templates_category_check
    CHECK (category IN (
        'BIRTHDAY',
        'REMINDER',
        'WELCOME',
        'CUSTOM',
        'FIRST_CONTACT',
        'ABSENCE',
        'EVENT_REMINDER',
        'EVENT_THANKYOU',
        'OUTSIDE_HOURS'
    ));

-- Comments for documentation
COMMENT ON TABLE church_agent_config IS 'Configuration for the WhatsApp AI agent per church';
COMMENT ON COLUMN church_agent_config.tone IS 'Communication tone: formal, casual, friendly, professional';
COMMENT ON COLUMN church_agent_config.language_style IS 'Language style: direct, detailed, encouraging';
COMMENT ON COLUMN church_agent_config.emoji_usage IS 'Emoji frequency: none, minimal, moderate, frequent';
COMMENT ON COLUMN church_agent_config.working_days IS 'Array of weekday numbers (0=Sunday, 1=Monday, etc.)';
