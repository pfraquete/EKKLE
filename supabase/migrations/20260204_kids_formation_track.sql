-- =====================================================
-- Fase 1: Trilho de Formação Kids
-- =====================================================
-- Esta migration cria a infraestrutura para gerenciar a
-- jornada de desenvolvimento espiritual de cada criança,
-- baseado no modelo "Trilho do Vencedor" da Igreja Videira.
-- =====================================================

-- =====================================================
-- 1. TABELA KIDS_FORMATION_STAGES
-- =====================================================
-- Define as etapas do trilho de formação (personalizável por igreja)
-- Ex: Evangelizado, Encontro com Deus, Consolidação, Treinamento

CREATE TABLE IF NOT EXISTS kids_formation_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    stage_order SMALLINT NOT NULL DEFAULT 0,
    icon_name TEXT DEFAULT 'star', -- Nome do ícone Lucide para exibição
    color TEXT DEFAULT '#3B82F6', -- Cor hex para o badge da etapa
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(church_id, name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kids_formation_stages_church_id 
    ON kids_formation_stages(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_formation_stages_order 
    ON kids_formation_stages(church_id, stage_order);

-- =====================================================
-- 2. TABELA KIDS_CHILD_FORMATION_PROGRESS
-- =====================================================
-- Registra o progresso de cada criança no trilho

CREATE TABLE IF NOT EXISTS kids_child_formation_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES kids_children(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES kids_formation_stages(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, stage_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kids_child_formation_progress_child_id 
    ON kids_child_formation_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_kids_child_formation_progress_stage_id 
    ON kids_child_formation_progress(stage_id);
CREATE INDEX IF NOT EXISTS idx_kids_child_formation_progress_church_id 
    ON kids_child_formation_progress(church_id);

-- =====================================================
-- 3. HELPER FUNCTIONS PARA RLS
-- =====================================================

-- Função para verificar se o usuário é membro da Rede Kids
CREATE OR REPLACE FUNCTION is_kids_network_member(user_id UUID, church_id_to_check UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id 
        AND church_id = church_id_to_check 
        AND is_kids_network = true
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se o usuário é líder na Rede Kids
CREATE OR REPLACE FUNCTION is_kids_network_leader(user_id UUID, church_id_to_check UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id 
        AND church_id = church_id_to_check
        AND (
            role = 'PASTOR'
            OR kids_role IN ('PASTORA_KIDS', 'DISCIPULADORA_KIDS', 'LEADER_KIDS')
        )
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE kids_formation_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_child_formation_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para kids_formation_stages
DROP POLICY IF EXISTS "Pastor pode gerenciar etapas" ON kids_formation_stages;
CREATE POLICY "Pastor pode gerenciar etapas" ON kids_formation_stages
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = kids_formation_stages.church_id
            AND profiles.role = 'PASTOR'
        )
    );

DROP POLICY IF EXISTS "Membros Kids podem visualizar etapas" ON kids_formation_stages;
CREATE POLICY "Membros Kids podem visualizar etapas" ON kids_formation_stages
    FOR SELECT 
    USING (is_kids_network_member(auth.uid(), church_id));

-- Políticas para kids_child_formation_progress
DROP POLICY IF EXISTS "Pastor pode gerenciar progresso" ON kids_child_formation_progress;
CREATE POLICY "Pastor pode gerenciar progresso" ON kids_child_formation_progress
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = kids_child_formation_progress.church_id
            AND profiles.role = 'PASTOR'
        )
    );

DROP POLICY IF EXISTS "Líderes Kids podem gerenciar progresso" ON kids_child_formation_progress;
CREATE POLICY "Líderes Kids podem gerenciar progresso" ON kids_child_formation_progress
    FOR ALL 
    USING (is_kids_network_leader(auth.uid(), church_id));

DROP POLICY IF EXISTS "Membros Kids podem visualizar progresso" ON kids_child_formation_progress;
CREATE POLICY "Membros Kids podem visualizar progresso" ON kids_child_formation_progress
    FOR SELECT 
    USING (is_kids_network_member(auth.uid(), church_id));

-- =====================================================
-- 5. TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_kids_formation_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kids_formation_stages_updated_at ON kids_formation_stages;
CREATE TRIGGER trigger_update_kids_formation_stages_updated_at
    BEFORE UPDATE ON kids_formation_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_kids_formation_stages_updated_at();

-- =====================================================
-- 6. DADOS INICIAIS (SEED) - ETAPAS PADRÃO
-- =====================================================
-- Estas etapas serão criadas automaticamente para novas igrejas
-- através de uma função que pode ser chamada no onboarding

CREATE OR REPLACE FUNCTION seed_default_kids_formation_stages(target_church_id UUID)
RETURNS void AS $$
BEGIN
    -- Só insere se a igreja ainda não tem etapas
    IF NOT EXISTS (SELECT 1 FROM kids_formation_stages WHERE church_id = target_church_id) THEN
        INSERT INTO kids_formation_stages (church_id, name, description, stage_order, icon_name, color) VALUES
            (target_church_id, 'Evangelizado', 'A criança aceitou Jesus como Salvador', 1, 'heart', '#EF4444'),
            (target_church_id, 'Encontro com Deus', 'Participou do retiro Encontro com Deus Kids', 2, 'sparkles', '#F59E0B'),
            (target_church_id, 'Consolidação', 'Concluiu o processo de consolidação', 3, 'book-open', '#10B981'),
            (target_church_id, 'Em Treinamento', 'Está sendo treinado para ministrar', 4, 'graduation-cap', '#3B82F6'),
            (target_church_id, 'Líder Kids', 'Formado como líder do ministério infantil', 5, 'crown', '#8B5CF6');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
