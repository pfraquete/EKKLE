-- =====================================================
-- ALVOS PESSOAIS - Sistema de Metas e Conquistas
-- Migration: 20260205_personal_goals.sql
-- =====================================================

-- 1. PERSONAL_GOALS - Alvos pessoais do usuário
CREATE TABLE IF NOT EXISTS personal_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Conteúdo do alvo
    title TEXT NOT NULL,
    description TEXT,
    
    -- Categoria do alvo
    category TEXT NOT NULL CHECK (category IN (
        'ESPIRITUAL',      -- Crescimento espiritual
        'FAMILIAR',        -- Família e relacionamentos
        'PROFISSIONAL',    -- Carreira e trabalho
        'FINANCEIRO',      -- Finanças e provisão
        'SAUDE',           -- Saúde física e mental
        'MINISTERIAL',     -- Ministério e serviço
        'EDUCACIONAL',     -- Estudos e aprendizado
        'OUTRO'            -- Outros alvos
    )) DEFAULT 'ESPIRITUAL',

    -- Prioridade
    priority TEXT NOT NULL CHECK (priority IN ('ALTA', 'MEDIA', 'BAIXA')) DEFAULT 'MEDIA',

    -- Data limite (opcional)
    target_date DATE,

    -- Status de realização
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,

    -- Versículo relacionado (opcional)
    verse_reference TEXT,
    verse_text TEXT,

    -- Ordenação personalizada
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_personal_goals_profile_id ON personal_goals(profile_id);
CREATE INDEX IF NOT EXISTS idx_personal_goals_church_id ON personal_goals(church_id);
CREATE INDEX IF NOT EXISTS idx_personal_goals_category ON personal_goals(category);
CREATE INDEX IF NOT EXISTS idx_personal_goals_is_completed ON personal_goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_personal_goals_created_at ON personal_goals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_goals_target_date ON personal_goals(target_date) WHERE target_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personal_goals_display_order ON personal_goals(profile_id, display_order);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios alvos
CREATE POLICY "Users can view their own personal goals" ON personal_goals
    FOR SELECT USING (profile_id = auth.uid());

-- Usuários podem criar seus próprios alvos
CREATE POLICY "Users can create their own personal goals" ON personal_goals
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Usuários podem atualizar seus próprios alvos
CREATE POLICY "Users can update their own personal goals" ON personal_goals
    FOR UPDATE USING (profile_id = auth.uid());

-- Usuários podem deletar seus próprios alvos
CREATE POLICY "Users can delete their own personal goals" ON personal_goals
    FOR DELETE USING (profile_id = auth.uid());

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_personal_goals_updated_at 
    BEFORE UPDATE ON personal_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para obter estatísticas de alvos do usuário
CREATE OR REPLACE FUNCTION get_personal_goals_stats(p_profile_id UUID)
RETURNS TABLE (
    total_goals INTEGER,
    completed_goals INTEGER,
    pending_goals INTEGER,
    completion_rate NUMERIC,
    goals_by_category JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_goals,
        COUNT(*) FILTER (WHERE is_completed = true)::INTEGER as completed_goals,
        COUNT(*) FILTER (WHERE is_completed = false)::INTEGER as pending_goals,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE is_completed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
            ELSE 0
        END as completion_rate,
        COALESCE(
            jsonb_object_agg(
                pg.category,
                jsonb_build_object(
                    'total', pg.cat_total,
                    'completed', pg.cat_completed
                )
            ),
            '{}'::jsonb
        ) as goals_by_category
    FROM personal_goals
    LEFT JOIN LATERAL (
        SELECT 
            category,
            COUNT(*)::INTEGER as cat_total,
            COUNT(*) FILTER (WHERE is_completed = true)::INTEGER as cat_completed
        FROM personal_goals
        WHERE profile_id = p_profile_id
        GROUP BY category
    ) pg ON true
    WHERE profile_id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
