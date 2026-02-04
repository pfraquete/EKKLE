-- =====================================================
-- KIDS LIBRARY - Biblioteca de Conteúdo para Rede Kids
-- =====================================================

-- Categorias da Biblioteca
CREATE TABLE IF NOT EXISTS kids_library_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conteúdos da Biblioteca
CREATE TABLE IF NOT EXISTS kids_library_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    category_id UUID REFERENCES kids_library_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('lesson', 'story', 'music', 'activity', 'video', 'document', 'image', 'other')),
    
    -- Conteúdo
    content_text TEXT, -- Para lições e histórias em texto
    file_url TEXT, -- URL do arquivo (PDF, imagem, vídeo, etc)
    file_name VARCHAR(255),
    file_size INTEGER, -- Em bytes
    file_type VARCHAR(100), -- MIME type
    
    -- Metadados
    target_age_min INTEGER, -- Idade mínima recomendada
    target_age_max INTEGER, -- Idade máxima recomendada
    duration_minutes INTEGER, -- Duração estimada
    bible_reference VARCHAR(255), -- Referência bíblica (ex: "João 3:16")
    tags TEXT[], -- Tags para busca
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anexos de conteúdo (múltiplos arquivos por conteúdo)
CREATE TABLE IF NOT EXISTS kids_library_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES kids_library_content(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relação entre reuniões de célula kids e conteúdos da biblioteca
CREATE TABLE IF NOT EXISTS kids_cell_meeting_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES kids_cell_meetings(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES kids_library_content(id) ON DELETE CASCADE,
    notes TEXT, -- Notas do líder sobre a aplicação
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, content_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kids_library_categories_church ON kids_library_categories(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_library_content_church ON kids_library_content(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_library_content_category ON kids_library_content(category_id);
CREATE INDEX IF NOT EXISTS idx_kids_library_content_type ON kids_library_content(content_type);
CREATE INDEX IF NOT EXISTS idx_kids_library_content_tags ON kids_library_content USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kids_library_attachments_content ON kids_library_attachments(content_id);
CREATE INDEX IF NOT EXISTS idx_kids_cell_meeting_lessons_meeting ON kids_cell_meeting_lessons(meeting_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_kids_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kids_library_categories_updated_at
    BEFORE UPDATE ON kids_library_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_kids_library_updated_at();

CREATE TRIGGER trigger_kids_library_content_updated_at
    BEFORE UPDATE ON kids_library_content
    FOR EACH ROW
    EXECUTE FUNCTION update_kids_library_updated_at();

-- RLS
ALTER TABLE kids_library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_library_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_library_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_cell_meeting_lessons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kids_library_categories
CREATE POLICY "Membros Kids podem visualizar categorias"
    ON kids_library_categories FOR SELECT
    USING (is_kids_network_member(auth.uid(), church_id));

CREATE POLICY "Pastor pode gerenciar categorias"
    ON kids_library_categories FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.church_id = kids_library_categories.church_id 
        AND profiles.role = 'PASTOR'
    ));

-- Políticas RLS para kids_library_content
CREATE POLICY "Membros Kids podem visualizar conteúdos"
    ON kids_library_content FOR SELECT
    USING (is_kids_network_member(auth.uid(), church_id));

CREATE POLICY "Líderes Kids podem criar conteúdos"
    ON kids_library_content FOR INSERT
    WITH CHECK (is_kids_network_leader(auth.uid(), church_id));

CREATE POLICY "Pastor pode gerenciar conteúdos"
    ON kids_library_content FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.church_id = kids_library_content.church_id 
        AND profiles.role = 'PASTOR'
    ));

-- Políticas RLS para kids_library_attachments
CREATE POLICY "Membros Kids podem visualizar anexos"
    ON kids_library_attachments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM kids_library_content 
        WHERE kids_library_content.id = kids_library_attachments.content_id
        AND is_kids_network_member(auth.uid(), kids_library_content.church_id)
    ));

CREATE POLICY "Líderes Kids podem gerenciar anexos"
    ON kids_library_attachments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM kids_library_content 
        WHERE kids_library_content.id = kids_library_attachments.content_id
        AND is_kids_network_leader(auth.uid(), kids_library_content.church_id)
    ));

-- Políticas RLS para kids_cell_meeting_lessons
CREATE POLICY "Membros Kids podem visualizar lições de reuniões"
    ON kids_cell_meeting_lessons FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM kids_cell_meetings 
        WHERE kids_cell_meetings.id = kids_cell_meeting_lessons.meeting_id
        AND is_kids_network_member(auth.uid(), kids_cell_meetings.church_id)
    ));

CREATE POLICY "Líderes Kids podem gerenciar lições de reuniões"
    ON kids_cell_meeting_lessons FOR ALL
    USING (EXISTS (
        SELECT 1 FROM kids_cell_meetings 
        WHERE kids_cell_meetings.id = kids_cell_meeting_lessons.meeting_id
        AND is_kids_network_leader(auth.uid(), kids_cell_meetings.church_id)
    ));

-- Função para criar categorias padrão
CREATE OR REPLACE FUNCTION seed_default_kids_library_categories(target_church_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO kids_library_categories (church_id, name, description, icon_name, color, sort_order)
    VALUES
        (target_church_id, 'Lições Bíblicas', 'Estudos e lições para células kids', 'book-open', '#3B82F6', 1),
        (target_church_id, 'Histórias', 'Histórias bíblicas ilustradas', 'book', '#8B5CF6', 2),
        (target_church_id, 'Músicas', 'Louvores e músicas infantis', 'music', '#EC4899', 3),
        (target_church_id, 'Atividades', 'Atividades, jogos e dinâmicas', 'puzzle', '#F59E0B', 4),
        (target_church_id, 'Vídeos', 'Vídeos educativos e de louvor', 'video', '#EF4444', 5),
        (target_church_id, 'Recursos', 'Materiais de apoio diversos', 'folder', '#6B7280', 6)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
