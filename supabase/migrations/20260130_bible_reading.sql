-- =====================================================
-- SISTEMA DE PLANOS DE LEITURA BIBLICA
-- Ekkle - Igreja Management SaaS
-- =====================================================

-- 1. Planos de leitura (templates/presets)
CREATE TABLE IF NOT EXISTS bible_reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,

    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('SEQUENTIAL', 'THEMATIC', 'CHRONOLOGICAL', 'CUSTOM')) DEFAULT 'SEQUENTIAL',

    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Leituras diarias de cada plano
CREATE TABLE IF NOT EXISTS bible_plan_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES bible_reading_plans(id) ON DELETE CASCADE,

    day_number INTEGER NOT NULL CHECK (day_number > 0),

    bible_id TEXT NOT NULL DEFAULT 'b9ce6f04aa8f6fb5-01',
    book_id TEXT NOT NULL,
    chapter_start INTEGER NOT NULL,
    chapter_end INTEGER,
    verse_start INTEGER,
    verse_end INTEGER,

    reading_title TEXT,
    cached_content TEXT,
    cached_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(plan_id, day_number)
);

-- 3. Planos ativos do usuario
CREATE TABLE IF NOT EXISTS user_reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES bible_reading_plans(id) ON DELETE CASCADE,

    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_day INTEGER DEFAULT 1,

    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED')) DEFAULT 'ACTIVE',
    completed_at TIMESTAMPTZ,

    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_reading_date DATE,

    reminder_time TIME,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Progresso diario
CREATE TABLE IF NOT EXISTS reading_plan_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    user_plan_id UUID NOT NULL REFERENCES user_reading_plans(id) ON DELETE CASCADE,
    reading_id UUID NOT NULL REFERENCES bible_plan_readings(id) ON DELETE CASCADE,

    day_number INTEGER NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    UNIQUE(user_plan_id, reading_id)
);

-- 5. Planos de grupo (celula)
CREATE TABLE IF NOT EXISTS group_reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES bible_reading_plans(id) ON DELETE CASCADE,

    name TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED')) DEFAULT 'ACTIVE',

    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Membros do plano de grupo
CREATE TABLE IF NOT EXISTS group_reading_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    group_plan_id UUID NOT NULL REFERENCES group_reading_plans(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    current_day INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_reading_date DATE,

    joined_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(group_plan_id, profile_id)
);

-- 7. Progresso de grupo
CREATE TABLE IF NOT EXISTS group_reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    group_plan_id UUID NOT NULL REFERENCES group_reading_plans(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES group_reading_members(id) ON DELETE CASCADE,
    reading_id UUID NOT NULL REFERENCES bible_plan_readings(id) ON DELETE CASCADE,

    day_number INTEGER NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    UNIQUE(member_id, reading_id)
);

-- 8. Cache de conteudo biblico
CREATE TABLE IF NOT EXISTS bible_content_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bible_id TEXT NOT NULL,
    passage_id TEXT NOT NULL,

    content_html TEXT NOT NULL,
    content_text TEXT,
    reference TEXT NOT NULL,

    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

    UNIQUE(bible_id, passage_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bible_reading_plans_church_id ON bible_reading_plans(church_id);
CREATE INDEX IF NOT EXISTS idx_bible_reading_plans_is_public ON bible_reading_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_bible_reading_plans_is_active ON bible_reading_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_bible_plan_readings_plan_id ON bible_plan_readings(plan_id);
CREATE INDEX IF NOT EXISTS idx_bible_plan_readings_day_number ON bible_plan_readings(day_number);

CREATE INDEX IF NOT EXISTS idx_user_reading_plans_profile_id ON user_reading_plans(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_plans_church_id ON user_reading_plans(church_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_plans_status ON user_reading_plans(status);

CREATE INDEX IF NOT EXISTS idx_reading_plan_progress_user_plan_id ON reading_plan_progress(user_plan_id);
CREATE INDEX IF NOT EXISTS idx_reading_plan_progress_completed_at ON reading_plan_progress(completed_at);

CREATE INDEX IF NOT EXISTS idx_group_reading_plans_cell_id ON group_reading_plans(cell_id);
CREATE INDEX IF NOT EXISTS idx_group_reading_plans_status ON group_reading_plans(status);

CREATE INDEX IF NOT EXISTS idx_group_reading_members_group_plan_id ON group_reading_members(group_plan_id);
CREATE INDEX IF NOT EXISTS idx_group_reading_members_profile_id ON group_reading_members(profile_id);

CREATE INDEX IF NOT EXISTS idx_bible_content_cache_lookup ON bible_content_cache(bible_id, passage_id);
CREATE INDEX IF NOT EXISTS idx_bible_content_cache_expires_at ON bible_content_cache(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE bible_reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_plan_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_reading_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_content_cache ENABLE ROW LEVEL SECURITY;

-- Bible Reading Plans: Users can view public plans or plans from their church
CREATE POLICY "Users can view available bible plans" ON bible_reading_plans
    FOR SELECT USING (
        is_public = true
        OR church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Pastors can manage church plans
CREATE POLICY "Pastors can manage church bible plans" ON bible_reading_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = bible_reading_plans.church_id
            AND role = 'PASTOR'
        )
    );

-- Plan Readings: Users can view readings for accessible plans
CREATE POLICY "Users can view plan readings" ON bible_plan_readings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bible_reading_plans bp
            WHERE bp.id = bible_plan_readings.plan_id
            AND (bp.is_public = true OR bp.church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()))
        )
    );

-- Pastors can manage plan readings
CREATE POLICY "Pastors can manage plan readings" ON bible_plan_readings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bible_reading_plans bp
            JOIN profiles p ON p.church_id = bp.church_id
            WHERE bp.id = bible_plan_readings.plan_id
            AND p.id = auth.uid()
            AND p.role = 'PASTOR'
        )
    );

-- User Plans: Users can manage their own plans
CREATE POLICY "Users can manage their own reading plans" ON user_reading_plans
    FOR ALL USING (profile_id = auth.uid());

-- Users can view plans from their church (for leaderboards, etc.)
CREATE POLICY "Users can view church reading plans" ON user_reading_plans
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Progress: Users can manage their own progress
CREATE POLICY "Users can manage their reading progress" ON reading_plan_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_reading_plans up
            WHERE up.id = reading_plan_progress.user_plan_id
            AND up.profile_id = auth.uid()
        )
    );

-- Group Plans: Cell members can view their group plans
CREATE POLICY "Cell members can view group plans" ON group_reading_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.cell_id = group_reading_plans.cell_id
        )
    );

-- Cell leaders can manage group plans
CREATE POLICY "Cell leaders can manage group plans" ON group_reading_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cells c
            WHERE c.id = group_reading_plans.cell_id
            AND c.leader_id = auth.uid()
        )
        OR created_by = auth.uid()
    );

-- Group Members: Members can manage their own participation
CREATE POLICY "Users can manage their group membership" ON group_reading_members
    FOR ALL USING (profile_id = auth.uid());

-- Cell members can view group members
CREATE POLICY "Cell members can view group members" ON group_reading_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_reading_plans grp
            JOIN profiles p ON p.cell_id = grp.cell_id
            WHERE grp.id = group_reading_members.group_plan_id
            AND p.id = auth.uid()
        )
    );

-- Group Progress: Members can manage their own progress
CREATE POLICY "Users can manage their group progress" ON group_reading_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM group_reading_members gm
            WHERE gm.id = group_reading_progress.member_id
            AND gm.profile_id = auth.uid()
        )
    );

-- Cell members can view group progress (for group stats)
CREATE POLICY "Cell members can view group progress" ON group_reading_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_reading_plans grp
            JOIN profiles p ON p.cell_id = grp.cell_id
            WHERE grp.id = group_reading_progress.group_plan_id
            AND p.id = auth.uid()
        )
    );

-- Bible Cache: Public read access (no sensitive data)
CREATE POLICY "Public can read bible cache" ON bible_content_cache
    FOR SELECT USING (true);

-- Service role can manage cache
CREATE POLICY "Service can manage cache" ON bible_content_cache
    FOR ALL USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update streak when completing a reading
CREATE OR REPLACE FUNCTION update_reading_streak()
RETURNS TRIGGER AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
BEGIN
    -- Get current values
    SELECT last_reading_date, current_streak, longest_streak
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM user_reading_plans
    WHERE id = NEW.user_plan_id;

    -- Calculate new streak
    IF v_last_date IS NULL OR v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
        v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF v_last_date = CURRENT_DATE THEN
        -- Same day, no change to streak
        NULL;
    ELSE
        -- Streak broken, reset to 1
        v_current_streak := 1;
    END IF;

    -- Update longest streak if needed
    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
        v_longest_streak := v_current_streak;
    END IF;

    -- Update user plan
    UPDATE user_reading_plans
    SET
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_reading_date = CURRENT_DATE,
        current_day = GREATEST(current_day, NEW.day_number + 1),
        updated_at = NOW()
    WHERE id = NEW.user_plan_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reading_streak ON reading_plan_progress;
CREATE TRIGGER trigger_update_reading_streak
    AFTER INSERT ON reading_plan_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_streak();

-- Similar trigger for group progress
CREATE OR REPLACE FUNCTION update_group_reading_streak()
RETURNS TRIGGER AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
BEGIN
    SELECT last_reading_date, current_streak, longest_streak
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM group_reading_members
    WHERE id = NEW.member_id;

    IF v_last_date IS NULL OR v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
        v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF v_last_date = CURRENT_DATE THEN
        NULL;
    ELSE
        v_current_streak := 1;
    END IF;

    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
        v_longest_streak := v_current_streak;
    END IF;

    UPDATE group_reading_members
    SET
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_reading_date = CURRENT_DATE,
        current_day = GREATEST(current_day, NEW.day_number + 1)
    WHERE id = NEW.member_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_reading_streak ON group_reading_progress;
CREATE TRIGGER trigger_update_group_reading_streak
    AFTER INSERT ON group_reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_group_reading_streak();

-- Updated_at trigger for tables
CREATE OR REPLACE FUNCTION update_bible_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bible_reading_plans_updated_at ON bible_reading_plans;
CREATE TRIGGER trigger_bible_reading_plans_updated_at
    BEFORE UPDATE ON bible_reading_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_bible_plan_updated_at();

DROP TRIGGER IF EXISTS trigger_user_reading_plans_updated_at ON user_reading_plans;
CREATE TRIGGER trigger_user_reading_plans_updated_at
    BEFORE UPDATE ON user_reading_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_bible_plan_updated_at();

DROP TRIGGER IF EXISTS trigger_group_reading_plans_updated_at ON group_reading_plans;
CREATE TRIGGER trigger_group_reading_plans_updated_at
    BEFORE UPDATE ON group_reading_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_bible_plan_updated_at();

-- =====================================================
-- SEED DATA - Default Reading Plans
-- =====================================================

-- Insert global default plans (church_id = NULL, is_public = true)
INSERT INTO bible_reading_plans (id, church_id, name, description, duration_days, plan_type, is_public, is_active)
VALUES
    ('00000000-0000-0000-0001-000000000001', NULL, 'Biblia em 1 Ano', 'Leia toda a Biblia em 365 dias, com leituras diarias do Antigo e Novo Testamento.', 365, 'SEQUENTIAL', true, true),
    ('00000000-0000-0000-0001-000000000002', NULL, 'Novo Testamento em 90 Dias', 'Leia o Novo Testamento completo em 90 dias, aproximadamente 3 capitulos por dia.', 90, 'SEQUENTIAL', true, true),
    ('00000000-0000-0000-0001-000000000003', NULL, 'Salmos e Proverbios em 30 Dias', 'Um mes de sabedoria biblica: leia os Salmos e Proverbios em 30 dias.', 30, 'THEMATIC', true, true),
    ('00000000-0000-0000-0001-000000000004', NULL, 'Evangelhos em 30 Dias', 'Conheca a vida de Jesus atraves dos quatro Evangelhos em 30 dias.', 30, 'THEMATIC', true, true)
ON CONFLICT (id) DO NOTHING;

-- Seed readings for "Evangelhos em 30 Dias" plan
INSERT INTO bible_plan_readings (plan_id, day_number, book_id, chapter_start, chapter_end, reading_title)
VALUES
    ('00000000-0000-0000-0001-000000000004', 1, 'MAT', 1, 2, 'O Nascimento de Jesus'),
    ('00000000-0000-0000-0001-000000000004', 2, 'MAT', 3, 4, 'O Batismo e Tentacao'),
    ('00000000-0000-0000-0001-000000000004', 3, 'MAT', 5, 6, 'Sermao do Monte - Parte 1'),
    ('00000000-0000-0000-0001-000000000004', 4, 'MAT', 7, 8, 'Sermao do Monte - Parte 2'),
    ('00000000-0000-0000-0001-000000000004', 5, 'MAT', 9, 10, 'Milagres e Discipulos'),
    ('00000000-0000-0000-0001-000000000004', 6, 'MAT', 11, 12, 'Jesus e Joao Batista'),
    ('00000000-0000-0000-0001-000000000004', 7, 'MAT', 13, 14, 'Parabolas do Reino'),
    ('00000000-0000-0000-0001-000000000004', 8, 'MRK', 1, 3, 'Inicio do Ministerio'),
    ('00000000-0000-0000-0001-000000000004', 9, 'MRK', 4, 6, 'Parabolas e Milagres'),
    ('00000000-0000-0000-0001-000000000004', 10, 'MRK', 7, 9, 'Fe e Discipulado'),
    ('00000000-0000-0000-0001-000000000004', 11, 'MRK', 10, 12, 'Caminho para Jerusalem'),
    ('00000000-0000-0000-0001-000000000004', 12, 'MRK', 13, 14, 'Sinais e Ultima Ceia'),
    ('00000000-0000-0000-0001-000000000004', 13, 'MRK', 15, 16, 'Crucificacao e Ressurreicao'),
    ('00000000-0000-0000-0001-000000000004', 14, 'LUK', 1, 2, 'Nascimento de Jesus e Joao'),
    ('00000000-0000-0000-0001-000000000004', 15, 'LUK', 3, 4, 'Batismo e Tentacao'),
    ('00000000-0000-0000-0001-000000000004', 16, 'LUK', 5, 6, 'Chamado dos Discipulos'),
    ('00000000-0000-0000-0001-000000000004', 17, 'LUK', 7, 8, 'Fe e Parabolas'),
    ('00000000-0000-0000-0001-000000000004', 18, 'LUK', 9, 10, 'Transfiguracao e Missao'),
    ('00000000-0000-0000-0001-000000000004', 19, 'LUK', 11, 12, 'Oracoes e Advertencias'),
    ('00000000-0000-0000-0001-000000000004', 20, 'LUK', 13, 14, 'Parabolas da Graca'),
    ('00000000-0000-0000-0001-000000000004', 21, 'LUK', 15, 16, 'O Filho Prodigo'),
    ('00000000-0000-0000-0001-000000000004', 22, 'LUK', 17, 18, 'Fe e Perseveranca'),
    ('00000000-0000-0000-0001-000000000004', 23, 'LUK', 19, 20, 'Entrada em Jerusalem'),
    ('00000000-0000-0000-0001-000000000004', 24, 'LUK', 21, 22, 'Sinais e Ultima Ceia'),
    ('00000000-0000-0000-0001-000000000004', 25, 'LUK', 23, 24, 'Cruz e Ressurreicao'),
    ('00000000-0000-0000-0001-000000000004', 26, 'JHN', 1, 3, 'O Verbo e Nicodemos'),
    ('00000000-0000-0000-0001-000000000004', 27, 'JHN', 4, 6, 'Samaritana e Pao da Vida'),
    ('00000000-0000-0000-0001-000000000004', 28, 'JHN', 7, 10, 'Luz do Mundo e Bom Pastor'),
    ('00000000-0000-0000-0001-000000000004', 29, 'JHN', 11, 14, 'Lazaro e Ultima Ceia'),
    ('00000000-0000-0000-0001-000000000004', 30, 'JHN', 15, 21, 'Videira, Cruz e Ressurreicao')
ON CONFLICT (plan_id, day_number) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE bible_reading_plans IS 'Templates de planos de leitura biblica disponiveis';
COMMENT ON TABLE bible_plan_readings IS 'Leituras diarias de cada plano';
COMMENT ON TABLE user_reading_plans IS 'Planos de leitura ativos de cada usuario';
COMMENT ON TABLE reading_plan_progress IS 'Progresso diario do usuario no plano';
COMMENT ON TABLE group_reading_plans IS 'Planos de leitura compartilhados com a celula';
COMMENT ON TABLE group_reading_members IS 'Membros participando do plano de grupo';
COMMENT ON TABLE group_reading_progress IS 'Progresso dos membros no plano de grupo';
COMMENT ON TABLE bible_content_cache IS 'Cache de conteudo biblico da API.Bible';
