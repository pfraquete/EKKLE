-- =====================================================
-- FASE 3: GAMIFICAÇÃO KIDS
-- Sistema de versículos, pontos, medalhas e atividades
-- =====================================================

-- =====================================================
-- 1. SISTEMA DE VERSÍCULOS PARA MEMORIZAÇÃO
-- =====================================================

-- Tabela de versículos disponíveis para memorização
CREATE TABLE IF NOT EXISTS kids_memory_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  reference TEXT NOT NULL, -- Ex: "João 3:16"
  text TEXT NOT NULL, -- Texto do versículo
  translation TEXT DEFAULT 'NVI', -- Tradução (NVI, ARA, etc)
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
  points INTEGER DEFAULT 10, -- Pontos por memorizar
  target_age_min INTEGER DEFAULT 0,
  target_age_max INTEGER DEFAULT 12,
  category TEXT, -- Ex: "Amor", "Fé", "Obediência"
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versículos memorizados pelas crianças
CREATE TABLE IF NOT EXISTS kids_child_memorized_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES kids_children(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES kids_memory_verses(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  memorized_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 1, -- Quantas tentativas até acertar
  notes TEXT,
  UNIQUE(child_id, verse_id)
);

-- =====================================================
-- 2. SISTEMA DE MEDALHAS E CONQUISTAS
-- =====================================================

-- Tipos de medalhas disponíveis
CREATE TABLE IF NOT EXISTS kids_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'medal', -- Nome do ícone (lucide)
  color TEXT DEFAULT '#FFD700', -- Cor da medalha
  category TEXT CHECK (category IN ('verses', 'attendance', 'activities', 'formation', 'special')) DEFAULT 'special',
  requirement_type TEXT CHECK (requirement_type IN ('count', 'streak', 'milestone', 'manual')) DEFAULT 'manual',
  requirement_value INTEGER, -- Ex: 10 versículos, 5 presenças seguidas
  points_value INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medalhas conquistadas pelas crianças
CREATE TABLE IF NOT EXISTS kids_child_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES kids_children(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES kids_badges(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  awarded_by UUID REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(child_id, badge_id)
);

-- =====================================================
-- 3. SISTEMA DE PONTOS
-- =====================================================

-- Histórico de pontos (log de todas as transações)
CREATE TABLE IF NOT EXISTS kids_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES kids_children(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- Pode ser positivo ou negativo
  reason TEXT NOT NULL, -- Descrição do motivo
  source_type TEXT CHECK (source_type IN ('verse', 'badge', 'activity', 'attendance', 'bonus', 'manual')) NOT NULL,
  source_id UUID, -- ID do versículo, medalha, etc
  awarded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache de pontos totais por criança (para performance)
-- Será atualizado via trigger
ALTER TABLE kids_children ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE kids_children ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE kids_children ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

-- =====================================================
-- 4. CHECKLIST DE ATIVIDADES DO DISCÍPULO
-- =====================================================

-- Tipos de atividades do discípulo
CREATE TABLE IF NOT EXISTS kids_disciple_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Orou", "Leu a Bíblia", "Deu testemunho"
  description TEXT,
  icon_name TEXT DEFAULT 'check',
  color TEXT DEFAULT '#10B981',
  points INTEGER DEFAULT 5, -- Pontos por completar
  is_daily BOOLEAN DEFAULT true, -- Se pode ser feita diariamente
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atividades completadas pelas crianças
CREATE TABLE IF NOT EXISTS kids_child_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES kids_children(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES kids_disciple_activities(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_date DATE DEFAULT CURRENT_DATE, -- Para atividades diárias
  points_earned INTEGER DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(child_id, activity_id, completed_date) -- Uma atividade por dia
);

-- =====================================================
-- 5. ATIVIDADES EM REUNIÕES DE CÉLULA
-- =====================================================

-- Atividades realizadas durante reuniões
CREATE TABLE IF NOT EXISTS kids_meeting_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES kids_cell_meetings(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES kids_children(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  participated_prayer BOOLEAN DEFAULT false,
  participated_worship BOOLEAN DEFAULT false,
  participated_testimony BOOLEAN DEFAULT false,
  led_activity BOOLEAN DEFAULT false,
  brought_friend BOOLEAN DEFAULT false,
  brought_bible BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, child_id)
);

-- =====================================================
-- 6. NÍVEIS E RANKINGS
-- =====================================================

-- Níveis de progressão
CREATE TABLE IF NOT EXISTS kids_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Semente", "Broto", "Árvore"
  description TEXT,
  icon_name TEXT DEFAULT 'star',
  color TEXT DEFAULT '#3B82F6',
  min_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER, -- NULL = sem limite (último nível)
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar nível atual na criança
ALTER TABLE kids_children ADD COLUMN IF NOT EXISTS current_level_id UUID REFERENCES kids_levels(id);

-- =====================================================
-- 7. TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar pontos totais da criança
CREATE OR REPLACE FUNCTION update_child_total_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kids_children
  SET total_points = (
    SELECT COALESCE(SUM(points), 0)
    FROM kids_points_log
    WHERE child_id = NEW.child_id
  ),
  updated_at = NOW()
  WHERE id = NEW.child_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar pontos
DROP TRIGGER IF EXISTS trigger_update_child_points ON kids_points_log;
CREATE TRIGGER trigger_update_child_points
AFTER INSERT OR UPDATE OR DELETE ON kids_points_log
FOR EACH ROW
EXECUTE FUNCTION update_child_total_points();

-- Função para registrar pontos automaticamente ao memorizar versículo
CREATE OR REPLACE FUNCTION log_verse_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kids_points_log (child_id, church_id, points, reason, source_type, source_id, awarded_by)
  SELECT 
    NEW.child_id,
    NEW.church_id,
    v.points,
    'Memorizou: ' || v.reference,
    'verse',
    NEW.verse_id,
    NEW.verified_by
  FROM kids_memory_verses v
  WHERE v.id = NEW.verse_id;
  
  -- Atualizar pontos ganhos no registro
  UPDATE kids_child_memorized_verses
  SET points_earned = (SELECT points FROM kids_memory_verses WHERE id = NEW.verse_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para pontos de versículos
DROP TRIGGER IF EXISTS trigger_verse_points ON kids_child_memorized_verses;
CREATE TRIGGER trigger_verse_points
AFTER INSERT ON kids_child_memorized_verses
FOR EACH ROW
EXECUTE FUNCTION log_verse_points();

-- Função para registrar pontos de atividades
CREATE OR REPLACE FUNCTION log_activity_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kids_points_log (child_id, church_id, points, reason, source_type, source_id, awarded_by)
  SELECT 
    NEW.child_id,
    NEW.church_id,
    a.points,
    'Atividade: ' || a.name,
    'activity',
    NEW.activity_id,
    NEW.recorded_by
  FROM kids_disciple_activities a
  WHERE a.id = NEW.activity_id;
  
  -- Atualizar pontos ganhos
  UPDATE kids_child_activities
  SET points_earned = (SELECT points FROM kids_disciple_activities WHERE id = NEW.activity_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para pontos de atividades
DROP TRIGGER IF EXISTS trigger_activity_points ON kids_child_activities;
CREATE TRIGGER trigger_activity_points
AFTER INSERT ON kids_child_activities
FOR EACH ROW
EXECUTE FUNCTION log_activity_points();

-- Função para registrar pontos de medalhas
CREATE OR REPLACE FUNCTION log_badge_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kids_points_log (child_id, church_id, points, reason, source_type, source_id, awarded_by)
  SELECT 
    NEW.child_id,
    NEW.church_id,
    b.points_value,
    'Medalha: ' || b.name,
    'badge',
    NEW.badge_id,
    NEW.awarded_by
  FROM kids_badges b
  WHERE b.id = NEW.badge_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para pontos de medalhas
DROP TRIGGER IF EXISTS trigger_badge_points ON kids_child_badges;
CREATE TRIGGER trigger_badge_points
AFTER INSERT ON kids_child_badges
FOR EACH ROW
EXECUTE FUNCTION log_badge_points();

-- =====================================================
-- 8. SEED DE DADOS PADRÃO
-- =====================================================

-- Função para criar atividades padrão
CREATE OR REPLACE FUNCTION seed_default_disciple_activities(p_church_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO kids_disciple_activities (church_id, name, description, icon_name, color, points, is_daily, order_index)
  VALUES
    (p_church_id, 'Orou', 'Fez uma oração pessoal', 'hands-praying', '#8B5CF6', 5, true, 1),
    (p_church_id, 'Leu a Bíblia', 'Leu um trecho da Bíblia', 'book-open', '#3B82F6', 10, true, 2),
    (p_church_id, 'Deu testemunho', 'Compartilhou algo que Deus fez', 'message-circle', '#10B981', 15, true, 3),
    (p_church_id, 'Ajudou alguém', 'Praticou uma boa ação', 'heart-handshake', '#EC4899', 10, true, 4),
    (p_church_id, 'Convidou um amigo', 'Convidou alguém para a célula', 'user-plus', '#F59E0B', 20, false, 5),
    (p_church_id, 'Memorizou versículo', 'Decorou um versículo bíblico', 'brain', '#6366F1', 15, false, 6)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para criar medalhas padrão
CREATE OR REPLACE FUNCTION seed_default_badges(p_church_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO kids_badges (church_id, name, description, icon_name, color, category, requirement_type, requirement_value, points_value, order_index)
  VALUES
    -- Medalhas de Versículos
    (p_church_id, 'Primeiro Versículo', 'Memorizou o primeiro versículo', 'book', '#3B82F6', 'verses', 'count', 1, 25, 1),
    (p_church_id, 'Conhecedor da Palavra', 'Memorizou 5 versículos', 'book-open', '#3B82F6', 'verses', 'count', 5, 50, 2),
    (p_church_id, 'Mestre dos Versículos', 'Memorizou 10 versículos', 'graduation-cap', '#3B82F6', 'verses', 'count', 10, 100, 3),
    
    -- Medalhas de Presença
    (p_church_id, 'Fiel', 'Participou de 4 reuniões seguidas', 'calendar-check', '#10B981', 'attendance', 'streak', 4, 50, 4),
    (p_church_id, 'Super Fiel', 'Participou de 8 reuniões seguidas', 'calendar-heart', '#10B981', 'attendance', 'streak', 8, 100, 5),
    
    -- Medalhas de Atividades
    (p_church_id, 'Discípulo Ativo', 'Completou 10 atividades', 'check-circle', '#8B5CF6', 'activities', 'count', 10, 50, 6),
    (p_church_id, 'Evangelista Mirim', 'Convidou 3 amigos', 'users', '#F59E0B', 'activities', 'count', 3, 75, 7),
    
    -- Medalhas de Formação
    (p_church_id, 'Trilho Completo', 'Completou todas as etapas do trilho', 'trophy', '#FFD700', 'formation', 'milestone', 1, 200, 8),
    
    -- Medalhas Especiais
    (p_church_id, 'Líder Kids', 'Liderou uma atividade na célula', 'star', '#EC4899', 'special', 'manual', NULL, 100, 9),
    (p_church_id, 'Aniversariante', 'Fez aniversário no ministério', 'cake', '#F472B6', 'special', 'manual', NULL, 50, 10)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para criar níveis padrão
CREATE OR REPLACE FUNCTION seed_default_levels(p_church_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO kids_levels (church_id, name, description, icon_name, color, min_points, max_points, order_index)
  VALUES
    (p_church_id, 'Semente', 'Começando a jornada', 'sprout', '#A3E635', 0, 99, 1),
    (p_church_id, 'Broto', 'Crescendo na fé', 'leaf', '#22C55E', 100, 299, 2),
    (p_church_id, 'Plantinha', 'Firmando raízes', 'flower', '#10B981', 300, 599, 3),
    (p_church_id, 'Arbusto', 'Dando frutos', 'tree-deciduous', '#059669', 600, 999, 4),
    (p_church_id, 'Árvore', 'Forte e frutífero', 'tree-pine', '#047857', 1000, NULL, 5)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para criar versículos padrão
CREATE OR REPLACE FUNCTION seed_default_verses(p_church_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO kids_memory_verses (church_id, reference, text, difficulty, points, category, order_index)
  VALUES
    (p_church_id, 'João 3:16', 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', 'easy', 10, 'Amor', 1),
    (p_church_id, 'Salmos 23:1', 'O Senhor é o meu pastor; nada me faltará.', 'easy', 10, 'Confiança', 2),
    (p_church_id, 'Filipenses 4:13', 'Tudo posso naquele que me fortalece.', 'easy', 10, 'Força', 3),
    (p_church_id, 'Provérbios 3:5', 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.', 'medium', 15, 'Confiança', 4),
    (p_church_id, 'Josué 1:9', 'Não to mandei eu? Esforça-te e tem bom ânimo; não pasmes, nem te espantes, porque o Senhor, teu Deus, é contigo, por onde quer que andares.', 'medium', 15, 'Coragem', 5),
    (p_church_id, 'Romanos 8:28', 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.', 'medium', 15, 'Fé', 6),
    (p_church_id, 'Isaías 41:10', 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.', 'hard', 20, 'Coragem', 7),
    (p_church_id, 'Jeremias 29:11', 'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.', 'hard', 20, 'Esperança', 8)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_kids_memory_verses_church ON kids_memory_verses(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_child_memorized_verses_child ON kids_child_memorized_verses(child_id);
CREATE INDEX IF NOT EXISTS idx_kids_badges_church ON kids_badges(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_child_badges_child ON kids_child_badges(child_id);
CREATE INDEX IF NOT EXISTS idx_kids_points_log_child ON kids_points_log(child_id);
CREATE INDEX IF NOT EXISTS idx_kids_disciple_activities_church ON kids_disciple_activities(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_child_activities_child ON kids_child_activities(child_id);
CREATE INDEX IF NOT EXISTS idx_kids_child_activities_date ON kids_child_activities(completed_date);
CREATE INDEX IF NOT EXISTS idx_kids_meeting_activities_meeting ON kids_meeting_activities(meeting_id);
CREATE INDEX IF NOT EXISTS idx_kids_levels_church ON kids_levels(church_id);

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE kids_memory_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_child_memorized_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_child_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_disciple_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_child_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_meeting_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_levels ENABLE ROW LEVEL SECURITY;

-- Políticas serão criadas via MCP separadamente
