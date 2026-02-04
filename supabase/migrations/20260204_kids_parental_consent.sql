-- =====================================================
-- KIDS PARENTAL CONSENT - Autorização Parental para Eventos
-- =====================================================

-- Adicionar campo para identificar eventos kids que requerem autorização
ALTER TABLE events ADD COLUMN IF NOT EXISTS requires_parental_consent BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_kids_event BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_age INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_age INTEGER;

-- Tabela de autorizações parentais
CREATE TABLE IF NOT EXISTS event_parental_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES kids_children(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    -- Dados do responsável
    parent_name VARCHAR(255) NOT NULL,
    parent_cpf VARCHAR(14),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    relationship VARCHAR(50), -- pai, mãe, avó, tio, etc
    
    -- Autorização
    consent_given BOOLEAN DEFAULT false,
    consent_date TIMESTAMPTZ,
    consent_signature_url TEXT, -- URL da assinatura digital (opcional)
    
    -- Informações médicas para o evento
    medical_notes TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Permissões específicas
    allows_photos BOOLEAN DEFAULT true,
    allows_transportation BOOLEAN DEFAULT true,
    allows_swimming BOOLEAN DEFAULT false, -- Para eventos com piscina
    allows_medication BOOLEAN DEFAULT false, -- Permite administrar medicação
    medication_instructions TEXT,
    
    -- Check-in/Check-out
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES profiles(id),
    checked_out_at TIMESTAMPTZ,
    checked_out_by UUID REFERENCES profiles(id),
    checkout_person_name VARCHAR(255), -- Quem buscou a criança
    checkout_person_document VARCHAR(20), -- Documento de quem buscou
    
    -- Controle
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, child_id)
);

-- Histórico de check-in/check-out (para eventos de múltiplos dias)
CREATE TABLE IF NOT EXISTS event_attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL REFERENCES event_parental_consents(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('check_in', 'check_out')),
    action_date DATE NOT NULL,
    action_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    performed_by UUID REFERENCES profiles(id),
    person_name VARCHAR(255), -- Para check-out: quem buscou
    person_document VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_event_parental_consents_event ON event_parental_consents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_parental_consents_child ON event_parental_consents(child_id);
CREATE INDEX IF NOT EXISTS idx_event_parental_consents_church ON event_parental_consents(church_id);
CREATE INDEX IF NOT EXISTS idx_event_parental_consents_status ON event_parental_consents(status);
CREATE INDEX IF NOT EXISTS idx_event_attendance_log_consent ON event_attendance_log(consent_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_log_date ON event_attendance_log(action_date);

-- Trigger para updated_at
CREATE TRIGGER trigger_event_parental_consents_updated_at
    BEFORE UPDATE ON event_parental_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_kids_library_updated_at();

-- RLS
ALTER TABLE event_parental_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para event_parental_consents
CREATE POLICY "Membros Kids podem visualizar autorizações"
    ON event_parental_consents FOR SELECT
    USING (is_kids_network_member(auth.uid(), church_id));

CREATE POLICY "Líderes Kids podem criar autorizações"
    ON event_parental_consents FOR INSERT
    WITH CHECK (is_kids_network_leader(auth.uid(), church_id));

CREATE POLICY "Líderes Kids podem atualizar autorizações"
    ON event_parental_consents FOR UPDATE
    USING (is_kids_network_leader(auth.uid(), church_id));

CREATE POLICY "Pastor pode gerenciar autorizações"
    ON event_parental_consents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.church_id = event_parental_consents.church_id 
        AND profiles.role = 'PASTOR'
    ));

-- Políticas RLS para event_attendance_log
CREATE POLICY "Membros Kids podem visualizar log de presença"
    ON event_attendance_log FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM event_parental_consents 
        WHERE event_parental_consents.id = event_attendance_log.consent_id
        AND is_kids_network_member(auth.uid(), event_parental_consents.church_id)
    ));

CREATE POLICY "Líderes Kids podem gerenciar log de presença"
    ON event_attendance_log FOR ALL
    USING (EXISTS (
        SELECT 1 FROM event_parental_consents 
        WHERE event_parental_consents.id = event_attendance_log.consent_id
        AND is_kids_network_leader(auth.uid(), event_parental_consents.church_id)
    ));

-- View para estatísticas de evento kids
CREATE OR REPLACE VIEW event_kids_stats AS
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.church_id,
    COUNT(epc.id) as total_registrations,
    COUNT(CASE WHEN epc.consent_given = true THEN 1 END) as authorized_count,
    COUNT(CASE WHEN epc.consent_given = false OR epc.consent_given IS NULL THEN 1 END) as pending_count,
    COUNT(CASE WHEN epc.checked_in_at IS NOT NULL THEN 1 END) as checked_in_count,
    COUNT(CASE WHEN epc.checked_out_at IS NOT NULL THEN 1 END) as checked_out_count
FROM events e
LEFT JOIN event_parental_consents epc ON e.id = epc.event_id
WHERE e.is_kids_event = true
GROUP BY e.id, e.name, e.church_id;
