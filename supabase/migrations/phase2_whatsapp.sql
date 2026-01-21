-- Phase 2: WhatsApp Integration Migration

-- 1. WhatsApp Instances table
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE UNIQUE,
  instance_name TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR')),
  qr_code TEXT,
  connected_at TIMESTAMPTZ,
  last_ping TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Message Templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- "Olá {nome}, lembrete da reunião amanhã às {hora}"
  category TEXT NOT NULL CHECK (category IN ('REMINDER', 'BIRTHDAY', 'WELCOME', 'CUSTOM')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WhatsApp Messages (History) table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('OUTBOUND', 'INBOUND')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'TEXT',
  content TEXT,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  context_type TEXT, -- 'MEETING_REMINDER', 'BIRTHDAY', etc.
  context_id UUID,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_church ON whatsapp_messages(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_message_templates_church ON message_templates(church_id);

-- RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors can manage their church's WhatsApp instance" ON whatsapp_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = whatsapp_instances.church_id
      AND profiles.role = 'PASTOR'
    )
  );

CREATE POLICY "Pastors and leaders can view message templates" ON message_templates
  FOR SELECT USING (
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Pastors can manage templates" ON message_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = message_templates.church_id
      AND profiles.role = 'PASTOR'
    )
  );

CREATE POLICY "Users can view their church's message history" ON whatsapp_messages
  FOR SELECT USING (
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
