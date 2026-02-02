-- =====================================================
-- DISCIPULADOR ROLE - Sistema de Supervisão de Células
-- =====================================================
-- Este papel fica entre PASTOR e LEADER na hierarquia
-- O Discipulador supervisiona de 3 a 5 células
-- =====================================================

-- 1. Adicionar DISCIPULADOR ao enum de roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('PASTOR', 'DISCIPULADOR', 'LEADER', 'MEMBER'));

-- 2. Criar tabela de supervisão de células
CREATE TABLE IF NOT EXISTS cell_supervision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    discipulador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Cada célula só pode ter 1 discipulador por igreja
    UNIQUE(church_id, cell_id)
);

-- 3. Criar tabela de metas de células
CREATE TABLE IF NOT EXISTS cell_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN (
        'ATTENDANCE_RATE',      -- Meta de presença (%)
        'MONTHLY_GROWTH',       -- Meta de crescimento (membros/mês)
        'REPORTS_SUBMITTED',    -- Meta de relatórios enviados (%)
        'MEETINGS_PER_MONTH'    -- Meta de reuniões por mês
    )),
    target_value NUMERIC NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('WEEKLY', 'MONTHLY')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Uma meta de cada tipo por célula
    UNIQUE(church_id, cell_id, goal_type)
);

-- 4. Criar tabela de anotações de supervisão
CREATE TABLE IF NOT EXISTS supervision_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    discipulador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type TEXT NOT NULL CHECK (note_type IN (
        'FEEDBACK',     -- Feedback geral
        'CONCERN',      -- Preocupação
        'PRAISE',       -- Elogio
        'ACTION_ITEM'   -- Item de ação
    )) DEFAULT 'FEEDBACK',
    is_private BOOLEAN DEFAULT false, -- Se true, só o discipulador vê
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cell_supervision_church_id ON cell_supervision(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_supervision_discipulador_id ON cell_supervision(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_cell_supervision_cell_id ON cell_supervision(cell_id);

CREATE INDEX IF NOT EXISTS idx_cell_goals_church_id ON cell_goals(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_goals_cell_id ON cell_goals(cell_id);

CREATE INDEX IF NOT EXISTS idx_supervision_notes_church_id ON supervision_notes(church_id);
CREATE INDEX IF NOT EXISTS idx_supervision_notes_cell_id ON supervision_notes(cell_id);
CREATE INDEX IF NOT EXISTS idx_supervision_notes_discipulador_id ON supervision_notes(discipulador_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_cell_supervision_updated_at
    BEFORE UPDATE ON cell_supervision
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cell_goals_updated_at
    BEFORE UPDATE ON cell_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervision_notes_updated_at
    BEFORE UPDATE ON supervision_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE cell_supervision ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS: cell_supervision
-- =====================================================

-- Pastores podem gerenciar todas as supervisões da igreja
CREATE POLICY "Pastors can manage all cell supervision" ON cell_supervision
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = cell_supervision.church_id
            AND role = 'PASTOR'
        )
    );

-- Discipuladores podem ver suas próprias atribuições
CREATE POLICY "Discipuladores can view their supervised cells" ON cell_supervision
    FOR SELECT USING (discipulador_id = auth.uid());

-- Líderes podem ver quem supervisiona sua célula
CREATE POLICY "Leaders can view their cell supervisor" ON cell_supervision
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cells
            WHERE cells.id = cell_supervision.cell_id
            AND cells.leader_id = auth.uid()
        )
    );

-- =====================================================
-- RLS: cell_goals
-- =====================================================

-- Pastores podem gerenciar todas as metas
CREATE POLICY "Pastors can manage all cell goals" ON cell_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = cell_goals.church_id
            AND role = 'PASTOR'
        )
    );

-- Discipuladores podem ver metas das células supervisionadas
CREATE POLICY "Discipuladores can view supervised cell goals" ON cell_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cell_supervision cs
            WHERE cs.cell_id = cell_goals.cell_id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- Líderes podem ver metas da sua célula
CREATE POLICY "Leaders can view their cell goals" ON cell_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cells
            WHERE cells.id = cell_goals.cell_id
            AND cells.leader_id = auth.uid()
        )
    );

-- =====================================================
-- RLS: supervision_notes
-- =====================================================

-- Pastores podem ver todas as anotações
CREATE POLICY "Pastors can view all supervision notes" ON supervision_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = supervision_notes.church_id
            AND role = 'PASTOR'
        )
    );

-- Discipuladores podem gerenciar suas próprias anotações
CREATE POLICY "Discipuladores can manage their notes" ON supervision_notes
    FOR ALL USING (discipulador_id = auth.uid());

-- Líderes podem ver anotações não privadas da sua célula
CREATE POLICY "Leaders can view non-private notes for their cell" ON supervision_notes
    FOR SELECT USING (
        is_private = false
        AND EXISTS (
            SELECT 1 FROM cells
            WHERE cells.id = supervision_notes.cell_id
            AND cells.leader_id = auth.uid()
        )
    );

-- =====================================================
-- RLS: Acesso do Discipulador às tabelas existentes
-- =====================================================

-- Discipuladores podem ver células que supervisionam
CREATE POLICY "Discipuladores can view supervised cells" ON cells
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cell_supervision cs
            WHERE cs.cell_id = cells.id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- Discipuladores podem ver reuniões das células supervisionadas
CREATE POLICY "Discipuladores can view supervised cell meetings" ON cell_meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cell_supervision cs
            WHERE cs.cell_id = cell_meetings.cell_id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- Discipuladores podem criar relatórios em emergência
CREATE POLICY "Discipuladores can create emergency reports" ON cell_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cell_meetings cm
            JOIN cell_supervision cs ON cs.cell_id = cm.cell_id
            WHERE cm.id = cell_reports.meeting_id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- Discipuladores podem ver relatórios das células supervisionadas
CREATE POLICY "Discipuladores can view supervised cell reports" ON cell_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cell_meetings cm
            JOIN cell_supervision cs ON cs.cell_id = cm.cell_id
            WHERE cm.id = cell_reports.meeting_id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- Discipuladores podem ver presença das células supervisionadas
CREATE POLICY "Discipuladores can view supervised cell attendance" ON attendance
    FOR SELECT USING (
        context_type = 'CELL_MEETING'
        AND EXISTS (
            SELECT 1 FROM cell_meetings cm
            JOIN cell_supervision cs ON cs.cell_id = cm.cell_id
            WHERE cm.id = attendance.context_id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- Discipuladores podem aprovar solicitações de entrada
CREATE POLICY "Discipuladores can manage supervised cell requests" ON cell_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cell_supervision cs
            WHERE cs.cell_id = cell_requests.cell_id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- Discipuladores podem ver perfis dos membros das células supervisionadas
CREATE POLICY "Discipuladores can view supervised cell members" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cell_supervision cs
            WHERE cs.cell_id = profiles.cell_id
            AND cs.discipulador_id = auth.uid()
        )
    );

-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE cell_supervision;
ALTER PUBLICATION supabase_realtime ADD TABLE supervision_notes;

-- =====================================================
-- FUNÇÃO: Validar máximo de 5 células por discipulador
-- =====================================================

CREATE OR REPLACE FUNCTION check_max_cells_per_discipulador()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM cell_supervision
        WHERE discipulador_id = NEW.discipulador_id) >= 5 THEN
        RAISE EXCEPTION 'Discipulador já supervisiona o máximo de 5 células';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_cells_per_discipulador
    BEFORE INSERT ON cell_supervision
    FOR EACH ROW EXECUTE FUNCTION check_max_cells_per_discipulador();

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
