-- =====================================================
-- SISTEMA DE PROFESSOR PARA CURSOS AO VIVO
-- =====================================================

-- 1. Adicionar campo is_teacher na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT false;

-- 2. Adicionar teacher_id na tabela courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id);

-- 3. Criar tabela de aulas ao vivo de cursos
CREATE TABLE IF NOT EXISTS course_live_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id),

    title TEXT NOT NULL,
    description TEXT,

    -- Agendamento
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,

    -- Status: SCHEDULED, LIVE, ENDED, CANCELLED
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED')),

    -- Streaming (integração Mux)
    mux_stream_key TEXT,
    mux_playback_id TEXT,
    mux_live_stream_id TEXT,

    -- Gravação
    recording_url TEXT,

    -- Configurações
    chat_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela de presença nas aulas ao vivo
CREATE TABLE IF NOT EXISTS course_live_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_live_lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id),

    -- Presença automática
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_online BOOLEAN DEFAULT true,

    -- Tempo total assistido (em segundos)
    watch_time_seconds INTEGER DEFAULT 0,

    -- Presença validada (calculada após encerramento)
    is_present_valid BOOLEAN DEFAULT false,

    UNIQUE(lesson_id, student_id)
);

-- 5. Criar tabela de chat das aulas ao vivo
CREATE TABLE IF NOT EXISTS course_live_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_live_lessons(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id),

    message TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_by UUID REFERENCES profiles(id),
    is_pinned BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_course_live_lessons_course_id ON course_live_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_live_lessons_teacher_id ON course_live_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_live_lessons_status ON course_live_lessons(status);
CREATE INDEX IF NOT EXISTS idx_course_live_lessons_scheduled_start ON course_live_lessons(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_course_live_attendance_lesson_id ON course_live_attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_live_attendance_student_id ON course_live_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_course_live_attendance_is_online ON course_live_attendance(is_online);

CREATE INDEX IF NOT EXISTS idx_course_live_chat_lesson_id ON course_live_chat(lesson_id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_teacher ON profiles(is_teacher) WHERE is_teacher = true;
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE course_live_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_live_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_live_chat ENABLE ROW LEVEL SECURITY;

-- Políticas para course_live_lessons
-- Professores podem gerenciar suas aulas
CREATE POLICY "Teachers can manage their live lessons" ON course_live_lessons
    FOR ALL USING (teacher_id = auth.uid());

-- Pastores podem gerenciar todas as aulas da igreja
CREATE POLICY "Pastors can manage all church live lessons" ON course_live_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'PASTOR'
            AND profiles.church_id = course_live_lessons.church_id
        )
    );

-- Membros da igreja podem ver aulas dos cursos em que estão inscritos
CREATE POLICY "Members can view live lessons of enrolled courses" ON course_live_lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments
            WHERE course_enrollments.course_id = course_live_lessons.course_id
            AND course_enrollments.profile_id = auth.uid()
        )
    );

-- Políticas para course_live_attendance
-- Alunos podem ver e atualizar sua própria presença
CREATE POLICY "Students can manage their own attendance" ON course_live_attendance
    FOR ALL USING (student_id = auth.uid());

-- Professores podem ver presença de suas aulas
CREATE POLICY "Teachers can view attendance of their lessons" ON course_live_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_live_lessons
            WHERE course_live_lessons.id = course_live_attendance.lesson_id
            AND course_live_lessons.teacher_id = auth.uid()
        )
    );

-- Pastores podem ver toda a presença da igreja
CREATE POLICY "Pastors can view all church attendance" ON course_live_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'PASTOR'
            AND profiles.church_id = course_live_attendance.church_id
        )
    );

-- Políticas para course_live_chat
-- Membros podem enviar mensagens
CREATE POLICY "Members can send chat messages" ON course_live_chat
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Membros podem ver mensagens de aulas que podem acessar
CREATE POLICY "Members can view chat of accessible lessons" ON course_live_chat
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments ce
            JOIN course_live_lessons cll ON cll.course_id = ce.course_id
            WHERE cll.id = course_live_chat.lesson_id
            AND ce.profile_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM course_live_lessons cll
            WHERE cll.id = course_live_chat.lesson_id
            AND cll.teacher_id = auth.uid()
        )
    );

-- Professores e pastores podem deletar mensagens
CREATE POLICY "Teachers and pastors can delete chat messages" ON course_live_chat
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM course_live_lessons cll
            WHERE cll.id = course_live_chat.lesson_id
            AND cll.teacher_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'PASTOR'
            AND profiles.church_id = course_live_chat.church_id
        )
    );

-- =====================================================
-- FUNÇÕES RPC
-- =====================================================

-- Função para atualizar presença do aluno
CREATE OR REPLACE FUNCTION update_lesson_attendance(
    p_lesson_id UUID,
    p_is_online BOOLEAN,
    p_additional_seconds INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_church_id UUID;
BEGIN
    -- Buscar church_id da aula
    SELECT church_id INTO v_church_id
    FROM course_live_lessons
    WHERE id = p_lesson_id;

    IF v_church_id IS NULL THEN
        RAISE EXCEPTION 'Aula não encontrada';
    END IF;

    -- Inserir ou atualizar presença
    INSERT INTO course_live_attendance (
        church_id,
        lesson_id,
        student_id,
        joined_at,
        is_online,
        watch_time_seconds
    ) VALUES (
        v_church_id,
        p_lesson_id,
        auth.uid(),
        NOW(),
        p_is_online,
        p_additional_seconds
    )
    ON CONFLICT (lesson_id, student_id) DO UPDATE SET
        is_online = p_is_online,
        watch_time_seconds = course_live_attendance.watch_time_seconds + p_additional_seconds,
        left_at = CASE WHEN p_is_online = false THEN NOW() ELSE course_live_attendance.left_at END;
END;
$$;

-- Função para obter contagem de alunos online
CREATE OR REPLACE FUNCTION get_lesson_online_count(p_lesson_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM course_live_attendance
    WHERE lesson_id = p_lesson_id
    AND is_online = true;
$$;

-- Função para calcular presença válida após encerramento da aula
CREATE OR REPLACE FUNCTION calculate_lesson_attendance(p_lesson_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson_duration INTEGER;
    v_min_watch_time INTEGER;
BEGIN
    -- Calcular duração da aula em segundos
    SELECT EXTRACT(EPOCH FROM (actual_end - actual_start))::INTEGER
    INTO v_lesson_duration
    FROM course_live_lessons
    WHERE id = p_lesson_id;

    IF v_lesson_duration IS NULL OR v_lesson_duration <= 0 THEN
        RETURN;
    END IF;

    -- Mínimo de 70% para presença válida
    v_min_watch_time := (v_lesson_duration * 0.7)::INTEGER;

    -- Atualizar presença válida
    UPDATE course_live_attendance
    SET is_present_valid = (watch_time_seconds >= v_min_watch_time),
        is_online = false
    WHERE lesson_id = p_lesson_id;
END;
$$;

-- =====================================================
-- REALTIME
-- =====================================================

-- Habilitar realtime para as novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE course_live_lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE course_live_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE course_live_chat;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE course_live_lessons IS 'Aulas ao vivo dos cursos, gerenciadas por professores';
COMMENT ON TABLE course_live_attendance IS 'Registro de presença automática dos alunos nas aulas ao vivo';
COMMENT ON TABLE course_live_chat IS 'Chat das aulas ao vivo';
COMMENT ON COLUMN profiles.is_teacher IS 'Indica se o membro é professor (pode criar e gerenciar cursos)';
COMMENT ON COLUMN courses.teacher_id IS 'Professor responsável pelo curso';
