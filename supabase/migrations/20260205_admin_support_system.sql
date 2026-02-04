-- =====================================================
-- ADMIN SUPPORT SYSTEM - TICKETS E COMUNICACAO
-- =====================================================
-- Sistema de tickets para suporte ao cliente
-- Sistema de comunicacao (email + whatsapp)
-- =====================================================

-- =====================================================
-- 1. TABELA DE TICKETS DE SUPORTE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number SERIAL UNIQUE,

    -- Quem abriu o ticket
    requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    requester_email TEXT, -- Para casos onde usuario nao tem conta
    requester_name TEXT,

    -- Igreja relacionada (opcional)
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

    -- Admin responsavel
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Conteudo
    subject TEXT NOT NULL,
    description TEXT,

    -- Status e prioridade
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT CHECK (category IN ('billing', 'technical', 'feature_request', 'bug', 'account', 'other')),

    -- Tags para organizacao
    tags TEXT[] DEFAULT '{}',

    -- Metricas de SLA
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,

    -- Source do ticket
    source TEXT DEFAULT 'admin_panel' CHECK (source IN ('admin_panel', 'email', 'whatsapp', 'in_app')),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_church ON support_tickets(church_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON support_tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- =====================================================
-- 2. TABELA DE MENSAGENS DOS TICKETS
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

    -- Autor da mensagem
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'user', 'system')),
    sender_name TEXT, -- Cache para exibicao

    -- Conteudo
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'markdown')),

    -- Anexos
    attachments JSONB DEFAULT '[]', -- [{name, url, size, type}]

    -- Flags
    is_internal BOOLEAN DEFAULT FALSE, -- Nota interna (nao visivel ao usuario)
    is_first_response BOOLEAN DEFAULT FALSE,

    -- Email tracking
    email_message_id TEXT, -- ID do email se veio por email

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at);

-- =====================================================
-- 3. TABELA DE NOTAS ADMINISTRATIVAS
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Entidade relacionada
    entity_type TEXT NOT NULL CHECK (entity_type IN ('church', 'user', 'ticket', 'subscription')),
    entity_id UUID NOT NULL,

    -- Conteudo
    content TEXT NOT NULL,

    -- Flags
    is_pinned BOOLEAN DEFAULT FALSE,

    -- Autor
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_admin_notes_entity ON admin_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_pinned ON admin_notes(is_pinned) WHERE is_pinned = TRUE;

-- =====================================================
-- 4. TABELA DE COMUNICACOES ADMINISTRATIVAS
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Autor
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Conteudo
    title TEXT NOT NULL,
    subject TEXT, -- Para emails
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'markdown')),

    -- Canal de envio
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both', 'in_app')),

    -- Destinatarios
    target_type TEXT NOT NULL CHECK (target_type IN ('all_churches', 'specific_churches', 'specific_users', 'by_plan', 'by_status')),
    target_filter JSONB DEFAULT '{}', -- Filtros aplicados
    target_ids UUID[] DEFAULT '{}', -- IDs especificos quando aplicavel

    -- Status de envio
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'partially_sent', 'failed')),

    -- Agendamento
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,

    -- Metricas
    total_recipients INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0, -- Para emails com tracking

    -- Detalhes de envio
    delivery_details JSONB DEFAULT '[]', -- [{recipient_id, channel, status, sent_at, error}]

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_admin_communications_status ON admin_communications(status);
CREATE INDEX IF NOT EXISTS idx_admin_communications_channel ON admin_communications(channel);
CREATE INDEX IF NOT EXISTS idx_admin_communications_scheduled ON admin_communications(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_admin_communications_created ON admin_communications(created_at DESC);

-- =====================================================
-- 5. TABELA DE TEMPLATES DE COMUNICACAO
-- =====================================================
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificacao
    name TEXT NOT NULL,
    slug TEXT UNIQUE, -- Para referencia em codigo
    description TEXT,

    -- Conteudo
    subject TEXT, -- Para emails
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'markdown')),

    -- Canal
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both')),

    -- Variaveis disponiveis
    variables JSONB DEFAULT '[]', -- [{name, description, default_value}]

    -- Categoria
    category TEXT CHECK (category IN ('support', 'billing', 'notification', 'marketing', 'system')),

    -- Flags
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE, -- Templates do sistema (nao editaveis)

    -- Autor
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_communication_templates_channel ON communication_templates(channel);
CREATE INDEX IF NOT EXISTS idx_communication_templates_category ON communication_templates(category);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 6. FUNCOES AUXILIARES
-- =====================================================

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_notes_updated_at ON admin_notes;
CREATE TRIGGER update_admin_notes_updated_at
    BEFORE UPDATE ON admin_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_communications_updated_at ON admin_communications;
CREATE TRIGGER update_admin_communications_updated_at
    BEFORE UPDATE ON admin_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communication_templates_updated_at ON communication_templates;
CREATE TRIGGER update_communication_templates_updated_at
    BEFORE UPDATE ON communication_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Funcao para marcar primeira resposta do ticket
CREATE OR REPLACE FUNCTION mark_ticket_first_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Se e uma resposta de admin e o ticket ainda nao tem primeira resposta
    IF NEW.sender_type = 'admin' AND NOT NEW.is_internal THEN
        UPDATE support_tickets
        SET first_response_at = COALESCE(first_response_at, NOW())
        WHERE id = NEW.ticket_id AND first_response_at IS NULL;

        -- Marcar esta mensagem como primeira resposta
        NEW.is_first_response = (
            SELECT first_response_at IS NULL
            FROM support_tickets
            WHERE id = NEW.ticket_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mark_first_response ON ticket_messages;
CREATE TRIGGER mark_first_response
    BEFORE INSERT ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION mark_ticket_first_response();

-- Funcao para atualizar status do ticket quando resolvido
CREATE OR REPLACE FUNCTION update_ticket_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
    END IF;

    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        NEW.closed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resolved_at ON support_tickets;
CREATE TRIGGER update_resolved_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_resolved_at();

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

-- Funcao helper para verificar super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'SUPER_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies para support_tickets
CREATE POLICY "Super admins can do everything with tickets"
    ON support_tickets FOR ALL
    USING (is_super_admin());

CREATE POLICY "Users can view their own tickets"
    ON support_tickets FOR SELECT
    USING (requester_id = auth.uid());

CREATE POLICY "Users can create tickets"
    ON support_tickets FOR INSERT
    WITH CHECK (requester_id = auth.uid());

-- Policies para ticket_messages
CREATE POLICY "Super admins can do everything with messages"
    ON ticket_messages FOR ALL
    USING (is_super_admin());

CREATE POLICY "Users can view non-internal messages of their tickets"
    ON ticket_messages FOR SELECT
    USING (
        NOT is_internal AND
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE id = ticket_messages.ticket_id
            AND requester_id = auth.uid()
        )
    );

CREATE POLICY "Users can add messages to their tickets"
    ON ticket_messages FOR INSERT
    WITH CHECK (
        sender_type = 'user' AND
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE id = ticket_messages.ticket_id
            AND requester_id = auth.uid()
        )
    );

-- Policies para admin_notes (somente super admins)
CREATE POLICY "Super admins can do everything with notes"
    ON admin_notes FOR ALL
    USING (is_super_admin());

-- Policies para admin_communications (somente super admins)
CREATE POLICY "Super admins can do everything with communications"
    ON admin_communications FOR ALL
    USING (is_super_admin());

-- Policies para communication_templates
CREATE POLICY "Super admins can do everything with templates"
    ON communication_templates FOR ALL
    USING (is_super_admin());

CREATE POLICY "Anyone can view active templates"
    ON communication_templates FOR SELECT
    USING (is_active = TRUE);

-- =====================================================
-- 8. TEMPLATES INICIAIS DO SISTEMA
-- =====================================================

INSERT INTO communication_templates (name, slug, description, subject, content, channel, category, is_system, variables) VALUES
(
    'Boas-vindas Nova Igreja',
    'welcome-new-church',
    'Email enviado quando uma nova igreja e aprovada na plataforma',
    'Bem-vindo ao EKKLE, {{church_name}}!',
    E'Ola {{pastor_name}},\n\nSeja muito bem-vindo ao EKKLE! Sua igreja {{church_name}} foi aprovada e ja esta pronta para uso.\n\nAcesse sua conta em: {{app_url}}\n\nQualquer duvida, estamos a disposicao.\n\nAbraco,\nEquipe EKKLE',
    'email',
    'system',
    TRUE,
    '[{"name": "church_name", "description": "Nome da igreja"}, {"name": "pastor_name", "description": "Nome do pastor"}, {"name": "app_url", "description": "URL de acesso"}]'
),
(
    'Lembrete de Pagamento',
    'payment-reminder',
    'Lembrete enviado quando o pagamento esta proximo do vencimento',
    'Lembrete: Sua assinatura vence em {{days}} dias',
    E'Ola {{pastor_name}},\n\nSua assinatura do EKKLE vence em {{days}} dias.\n\nPara evitar interrupcao no servico, acesse:\n{{billing_url}}\n\nAbraco,\nEquipe EKKLE',
    'both',
    'billing',
    TRUE,
    '[{"name": "pastor_name", "description": "Nome do pastor"}, {"name": "days", "description": "Dias ate vencimento"}, {"name": "billing_url", "description": "URL da pagina de pagamento"}]'
),
(
    'Assinatura Expirada',
    'subscription-expired',
    'Notificacao quando a assinatura expira',
    'Sua assinatura EKKLE expirou',
    E'Ola {{pastor_name}},\n\nSua assinatura do EKKLE expirou. Os membros da igreja {{church_name}} terao acesso limitado ate que a assinatura seja renovada.\n\nRenove agora: {{billing_url}}\n\nPrecisa de ajuda? Responda este email.\n\nAbraco,\nEquipe EKKLE',
    'both',
    'billing',
    TRUE,
    '[{"name": "pastor_name", "description": "Nome do pastor"}, {"name": "church_name", "description": "Nome da igreja"}, {"name": "billing_url", "description": "URL da pagina de pagamento"}]'
),
(
    'Ticket Recebido',
    'ticket-received',
    'Confirmacao de recebimento de ticket de suporte',
    'Ticket #{{ticket_number}} - Recebemos sua solicitacao',
    E'Ola {{requester_name}},\n\nRecebemos sua solicitacao de suporte.\n\nTicket: #{{ticket_number}}\nAssunto: {{subject}}\n\nNossa equipe ira responder em breve.\n\nAbraco,\nEquipe EKKLE',
    'email',
    'support',
    TRUE,
    '[{"name": "requester_name", "description": "Nome do solicitante"}, {"name": "ticket_number", "description": "Numero do ticket"}, {"name": "subject", "description": "Assunto do ticket"}]'
),
(
    'Ticket Respondido',
    'ticket-replied',
    'Notificacao quando o ticket recebe resposta',
    'Ticket #{{ticket_number}} - Nova resposta',
    E'Ola {{requester_name}},\n\nSeu ticket #{{ticket_number}} recebeu uma nova resposta:\n\n---\n{{message}}\n---\n\nResponda este email para continuar a conversa.\n\nAbraco,\nEquipe EKKLE',
    'email',
    'support',
    TRUE,
    '[{"name": "requester_name", "description": "Nome do solicitante"}, {"name": "ticket_number", "description": "Numero do ticket"}, {"name": "message", "description": "Conteudo da resposta"}]'
),
(
    'Anuncio Geral',
    'general-announcement',
    'Template para anuncios gerais para todas as igrejas',
    '{{subject}}',
    E'Ola {{pastor_name}},\n\n{{content}}\n\nAbraco,\nEquipe EKKLE',
    'both',
    'notification',
    FALSE,
    '[{"name": "pastor_name", "description": "Nome do pastor"}, {"name": "subject", "description": "Assunto"}, {"name": "content", "description": "Conteudo do anuncio"}]'
),
(
    'Nova Funcionalidade',
    'new-feature',
    'Template para anuncio de novas funcionalidades',
    'Novidade no EKKLE: {{feature_name}}',
    E'Ola {{pastor_name}},\n\nTemos uma novidade para voce!\n\n{{feature_name}}\n\n{{feature_description}}\n\nAcesse agora: {{feature_url}}\n\nAbraco,\nEquipe EKKLE',
    'both',
    'notification',
    FALSE,
    '[{"name": "pastor_name", "description": "Nome do pastor"}, {"name": "feature_name", "description": "Nome da funcionalidade"}, {"name": "feature_description", "description": "Descricao da funcionalidade"}, {"name": "feature_url", "description": "URL da funcionalidade"}]'
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 9. VIEWS UTEIS
-- =====================================================

-- View de tickets com informacoes completas
CREATE OR REPLACE VIEW tickets_overview AS
SELECT
    t.id,
    t.ticket_number,
    t.subject,
    t.status,
    t.priority,
    t.category,
    t.source,
    t.created_at,
    t.updated_at,
    t.first_response_at,
    t.resolved_at,
    -- Requester info
    t.requester_id,
    COALESCE(p.full_name, t.requester_name) as requester_name,
    COALESCE(p.email, t.requester_email) as requester_email,
    -- Church info
    t.church_id,
    c.name as church_name,
    c.slug as church_slug,
    -- Assigned admin
    t.assigned_to,
    a.full_name as assigned_name,
    -- Metrics
    EXTRACT(EPOCH FROM (COALESCE(t.first_response_at, NOW()) - t.created_at)) / 3600 as hours_to_first_response,
    EXTRACT(EPOCH FROM (COALESCE(t.resolved_at, NOW()) - t.created_at)) / 3600 as hours_to_resolution,
    -- Message count
    (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count,
    -- Last message
    (SELECT created_at FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message_at
FROM support_tickets t
LEFT JOIN profiles p ON t.requester_id = p.id
LEFT JOIN churches c ON t.church_id = c.id
LEFT JOIN profiles a ON t.assigned_to = a.id;

-- View de estatisticas de tickets
CREATE OR REPLACE VIEW ticket_stats AS
SELECT
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'waiting_response') as waiting_tickets,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved_tickets,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tickets,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tickets,
    AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600) FILTER (WHERE first_response_at IS NOT NULL) as avg_first_response_hours,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as tickets_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as tickets_last_7d
FROM support_tickets;
