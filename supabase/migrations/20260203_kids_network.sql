-- =====================================================
-- Rede Kids - Estrutura Paralela de Células
-- =====================================================
-- Esta migration cria a estrutura completa para a Rede Kids,
-- permitindo que uma pessoa tenha papel diferente na rede normal
-- e na rede kids (ex: MEMBER na normal, LEADER_KIDS na kids)
-- =====================================================

-- =====================================================
-- 1. NOVOS CAMPOS NA TABELA PROFILES
-- =====================================================

-- Flag que indica se a pessoa faz parte da Rede Kids
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_kids_network BOOLEAN DEFAULT false;

-- Role específico na Rede Kids (independente do role principal)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kids_role TEXT;

-- Adicionar constraint para kids_role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'profiles_kids_role_check'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_kids_role_check
            CHECK (kids_role IS NULL OR kids_role IN (
                'PASTORA_KIDS',
                'DISCIPULADORA_KIDS',
                'LEADER_KIDS',
                'MEMBER_KIDS'
            ));
    END IF;
END $$;

-- Célula kids que a pessoa participa (como voluntária)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kids_cell_id UUID;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_kids_network
    ON profiles(is_kids_network) WHERE is_kids_network = true;
CREATE INDEX IF NOT EXISTS idx_profiles_kids_role
    ON profiles(kids_role) WHERE kids_role IS NOT NULL;

-- =====================================================
-- 2. TABELA KIDS_CELLS (Células Kids)
-- =====================================================

CREATE TABLE IF NOT EXISTS kids_cells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),

    -- Informações da célula
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    meeting_time TIME,
    address TEXT,
    neighborhood TEXT,

    -- Faixa etária das crianças atendidas
    age_range_min INTEGER DEFAULT 0,
    age_range_max INTEGER DEFAULT 12,

    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kids_cells_church_id ON kids_cells(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_cells_leader_id ON kids_cells(leader_id);
CREATE INDEX IF NOT EXISTS idx_kids_cells_status ON kids_cells(status);

-- Foreign key para kids_cell_id em profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_kids_cell_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_kids_cell_id_fkey
    FOREIGN KEY (kids_cell_id) REFERENCES kids_cells(id) ON DELETE SET NULL;

-- =====================================================
-- 3. TABELA KIDS_NETWORK_MEMBERSHIP
-- =====================================================
-- Controla quem faz parte da Rede Kids e com qual role

CREATE TABLE IF NOT EXISTS kids_network_membership (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Role na rede kids
    kids_role TEXT NOT NULL CHECK (kids_role IN (
        'PASTORA_KIDS',
        'DISCIPULADORA_KIDS',
        'LEADER_KIDS',
        'MEMBER_KIDS'
    )),

    -- Se líder, qual célula kids lidera
    kids_cell_id UUID REFERENCES kids_cells(id) ON DELETE SET NULL,

    -- Auditoria
    added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Uma pessoa só pode ter um role na rede kids por igreja
    UNIQUE(church_id, profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kids_network_membership_church_id ON kids_network_membership(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_network_membership_profile_id ON kids_network_membership(profile_id);
CREATE INDEX IF NOT EXISTS idx_kids_network_membership_kids_role ON kids_network_membership(kids_role);

-- =====================================================
-- 4. TABELA KIDS_CELL_SUPERVISION
-- =====================================================
-- Discipuladora Kids supervisiona 3-5 células kids

CREATE TABLE IF NOT EXISTS kids_cell_supervision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    discipuladora_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    kids_cell_id UUID NOT NULL REFERENCES kids_cells(id) ON DELETE CASCADE,

    -- Auditoria
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Cada célula kids tem apenas uma discipuladora
    UNIQUE(church_id, kids_cell_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kids_cell_supervision_discipuladora
    ON kids_cell_supervision(discipuladora_id);
CREATE INDEX IF NOT EXISTS idx_kids_cell_supervision_cell
    ON kids_cell_supervision(kids_cell_id);

-- =====================================================
-- 5. TABELA KIDS_CHILDREN (Crianças)
-- =====================================================
-- Sistema híbrido: crianças podem ser cadastradas ou apenas contadas

CREATE TABLE IF NOT EXISTS kids_children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    kids_cell_id UUID REFERENCES kids_cells(id) ON DELETE SET NULL,

    -- Dados da criança
    full_name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('M', 'F')),

    -- Dados do responsável
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    parent_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- se pai/mãe é membro

    -- Informações adicionais
    allergies TEXT,
    medical_notes TEXT,
    notes TEXT,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kids_children_church_id ON kids_children(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_children_cell_id ON kids_children(kids_cell_id);
CREATE INDEX IF NOT EXISTS idx_kids_children_parent_profile ON kids_children(parent_profile_id);
CREATE INDEX IF NOT EXISTS idx_kids_children_active ON kids_children(is_active) WHERE is_active = true;

-- =====================================================
-- 6. TABELA KIDS_CELL_MEETINGS (Reuniões)
-- =====================================================

CREATE TABLE IF NOT EXISTS kids_cell_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    kids_cell_id UUID NOT NULL REFERENCES kids_cells(id) ON DELETE CASCADE,

    meeting_date DATE NOT NULL,
    meeting_time TIME,
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')),

    -- Dados da reunião
    theme TEXT,
    bible_verse TEXT,
    notes TEXT,

    -- Contadores
    kids_present INTEGER DEFAULT 0,
    volunteers_present INTEGER DEFAULT 0,

    -- Auditoria
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kids_cell_meetings_cell ON kids_cell_meetings(kids_cell_id);
CREATE INDEX IF NOT EXISTS idx_kids_cell_meetings_date ON kids_cell_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_kids_cell_meetings_status ON kids_cell_meetings(status);

-- =====================================================
-- 7. TABELA KIDS_MEETING_ATTENDANCE (Presença)
-- =====================================================

CREATE TABLE IF NOT EXISTS kids_meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    meeting_id UUID NOT NULL REFERENCES kids_cell_meetings(id) ON DELETE CASCADE,

    -- Pode ser uma criança cadastrada ou um voluntário
    child_id UUID REFERENCES kids_children(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Ou nome avulso (criança visitante)
    visitor_name TEXT,
    visitor_parent_phone TEXT,

    attendance_type TEXT NOT NULL CHECK (attendance_type IN ('CHILD', 'VOLUNTEER', 'VISITOR')),
    status TEXT DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'JUSTIFIED')),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: deve ter ou child_id, ou volunteer_id, ou visitor_name
    CONSTRAINT kids_attendance_person_check CHECK (
        (child_id IS NOT NULL AND volunteer_id IS NULL AND visitor_name IS NULL) OR
        (child_id IS NULL AND volunteer_id IS NOT NULL AND visitor_name IS NULL) OR
        (child_id IS NULL AND volunteer_id IS NULL AND visitor_name IS NOT NULL)
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kids_meeting_attendance_meeting ON kids_meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_kids_meeting_attendance_child ON kids_meeting_attendance(child_id);
CREATE INDEX IF NOT EXISTS idx_kids_meeting_attendance_volunteer ON kids_meeting_attendance(volunteer_id);

-- =====================================================
-- 8. MODIFICAÇÃO NA TABELA SERVICES (Cultos)
-- =====================================================
-- Adicionar categoria para filtrar cultos por público

ALTER TABLE services ADD COLUMN IF NOT EXISTS service_category TEXT DEFAULT 'GENERAL';

-- Adicionar constraint para categoria
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'services_category_check'
    ) THEN
        ALTER TABLE services ADD CONSTRAINT services_category_check
            CHECK (service_category IN ('GENERAL', 'KIDS', 'YOUTH', 'WOMEN', 'MEN'));
    END IF;
END $$;

-- Índice para filtrar por categoria
CREATE INDEX IF NOT EXISTS idx_services_category ON services(service_category);

-- =====================================================
-- 9. TRIGGERS DE SINCRONIZAÇÃO
-- =====================================================

-- Trigger para sincronizar is_kids_network e kids_role quando adicionar/remover da rede
CREATE OR REPLACE FUNCTION fn_sync_kids_network_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET is_kids_network = true,
            kids_role = NEW.kids_role,
            kids_cell_id = NEW.kids_cell_id
        WHERE id = NEW.profile_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE profiles
        SET kids_role = NEW.kids_role,
            kids_cell_id = NEW.kids_cell_id
        WHERE id = NEW.profile_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET is_kids_network = false,
            kids_role = NULL,
            kids_cell_id = NULL
        WHERE id = OLD.profile_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_kids_network_to_profiles ON kids_network_membership;
CREATE TRIGGER trg_sync_kids_network_to_profiles
    AFTER INSERT OR UPDATE OR DELETE ON kids_network_membership
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_kids_network_to_profiles();

-- Trigger para limitar 5 células por Discipuladora Kids
CREATE OR REPLACE FUNCTION fn_check_max_kids_cells_per_discipuladora()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM kids_cell_supervision
        WHERE discipuladora_id = NEW.discipuladora_id
        AND church_id = NEW.church_id) >= 5 THEN
        RAISE EXCEPTION 'Discipuladora Kids já supervisiona o máximo de 5 células';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_kids_cells ON kids_cell_supervision;
CREATE TRIGGER trg_check_max_kids_cells
    BEFORE INSERT ON kids_cell_supervision
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_max_kids_cells_per_discipuladora();

-- Trigger para atualizar contadores de presença
CREATE OR REPLACE FUNCTION fn_update_kids_meeting_attendance_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE kids_cell_meetings
        SET
            kids_present = (
                SELECT COUNT(*) FROM kids_meeting_attendance
                WHERE meeting_id = NEW.meeting_id
                AND attendance_type IN ('CHILD', 'VISITOR')
                AND status = 'PRESENT'
            ),
            volunteers_present = (
                SELECT COUNT(*) FROM kids_meeting_attendance
                WHERE meeting_id = NEW.meeting_id
                AND attendance_type = 'VOLUNTEER'
                AND status = 'PRESENT'
            )
        WHERE id = NEW.meeting_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE kids_cell_meetings
        SET
            kids_present = (
                SELECT COUNT(*) FROM kids_meeting_attendance
                WHERE meeting_id = OLD.meeting_id
                AND attendance_type IN ('CHILD', 'VISITOR')
                AND status = 'PRESENT'
            ),
            volunteers_present = (
                SELECT COUNT(*) FROM kids_meeting_attendance
                WHERE meeting_id = OLD.meeting_id
                AND attendance_type = 'VOLUNTEER'
                AND status = 'PRESENT'
            )
        WHERE id = OLD.meeting_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_kids_attendance_count ON kids_meeting_attendance;
CREATE TRIGGER trg_update_kids_attendance_count
    AFTER INSERT OR UPDATE OR DELETE ON kids_meeting_attendance
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_kids_meeting_attendance_count();

-- Trigger para updated_at
CREATE TRIGGER update_kids_cells_updated_at BEFORE UPDATE ON kids_cells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kids_network_membership_updated_at BEFORE UPDATE ON kids_network_membership
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kids_cell_supervision_updated_at BEFORE UPDATE ON kids_cell_supervision
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kids_children_updated_at BEFORE UPDATE ON kids_children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kids_cell_meetings_updated_at BEFORE UPDATE ON kids_cell_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE kids_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_network_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_cell_supervision ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_cell_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_meeting_attendance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS: KIDS_CELLS
-- =====================================================

-- Pastores e Pastoras Kids podem gerenciar todas as células kids
CREATE POLICY "Pastors and Pastoras Kids can manage all kids cells" ON kids_cells
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_cells.church_id
            AND (role = 'PASTOR' OR kids_role = 'PASTORA_KIDS')
        )
    );

-- Discipuladoras Kids podem ver e atualizar células que supervisionam
CREATE POLICY "Discipuladoras can manage supervised cells" ON kids_cells
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_cell_supervision kcs
            JOIN profiles p ON p.id = kcs.discipuladora_id
            WHERE kcs.kids_cell_id = kids_cells.id
            AND kcs.discipuladora_id = auth.uid()
            AND p.kids_role = 'DISCIPULADORA_KIDS'
        )
    );

-- Líderes Kids podem ver e atualizar sua própria célula
CREATE POLICY "Leaders can manage their own cell" ON kids_cells
    FOR ALL USING (leader_id = auth.uid());

-- Membros da rede kids podem ver células da sua igreja
CREATE POLICY "Kids network members can view cells" ON kids_cells
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_cells.church_id
            AND is_kids_network = true
        )
    );

-- =====================================================
-- RLS: KIDS_NETWORK_MEMBERSHIP
-- =====================================================

-- Pastores e Pastoras Kids podem gerenciar membros da rede
CREATE POLICY "Pastors and Pastoras Kids can manage network membership" ON kids_network_membership
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_network_membership.church_id
            AND (role = 'PASTOR' OR kids_role = 'PASTORA_KIDS')
        )
    );

-- Discipuladoras Kids podem adicionar membros
CREATE POLICY "Discipuladoras can add members" ON kids_network_membership
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_network_membership.church_id
            AND kids_role = 'DISCIPULADORA_KIDS'
        )
    );

-- Membros da rede podem ver outros membros
CREATE POLICY "Kids network members can view membership" ON kids_network_membership
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_network_membership.church_id
            AND is_kids_network = true
        )
    );

-- =====================================================
-- RLS: KIDS_CELL_SUPERVISION
-- =====================================================

-- Pastores e Pastoras Kids podem gerenciar supervisão
CREATE POLICY "Pastors and Pastoras Kids can manage supervision" ON kids_cell_supervision
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_cell_supervision.church_id
            AND (role = 'PASTOR' OR kids_role = 'PASTORA_KIDS')
        )
    );

-- Discipuladoras podem ver suas próprias supervisões
CREATE POLICY "Discipuladoras can view own supervisions" ON kids_cell_supervision
    FOR SELECT USING (discipuladora_id = auth.uid());

-- Membros da rede podem ver supervisões
CREATE POLICY "Kids network can view supervisions" ON kids_cell_supervision
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_cell_supervision.church_id
            AND is_kids_network = true
        )
    );

-- =====================================================
-- RLS: KIDS_CHILDREN
-- =====================================================

-- Pastores e Pastoras Kids podem gerenciar todas as crianças
CREATE POLICY "Pastors and Pastoras Kids can manage all children" ON kids_children
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_children.church_id
            AND (role = 'PASTOR' OR kids_role = 'PASTORA_KIDS')
        )
    );

-- Discipuladoras podem gerenciar crianças das células que supervisionam
CREATE POLICY "Discipuladoras can manage children in supervised cells" ON kids_children
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_cell_supervision kcs
            WHERE kcs.kids_cell_id = kids_children.kids_cell_id
            AND kcs.discipuladora_id = auth.uid()
        )
    );

-- Líderes podem gerenciar crianças da sua célula
CREATE POLICY "Leaders can manage children in their cell" ON kids_children
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_cells
            WHERE id = kids_children.kids_cell_id
            AND leader_id = auth.uid()
        )
    );

-- Membros da rede podem ver crianças da sua célula
CREATE POLICY "Kids network members can view children in their cell" ON kids_children
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND kids_cell_id = kids_children.kids_cell_id
            AND is_kids_network = true
        )
    );

-- =====================================================
-- RLS: KIDS_CELL_MEETINGS
-- =====================================================

-- Pastores e Pastoras Kids podem gerenciar todas as reuniões
CREATE POLICY "Pastors and Pastoras Kids can manage all meetings" ON kids_cell_meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_cell_meetings.church_id
            AND (role = 'PASTOR' OR kids_role = 'PASTORA_KIDS')
        )
    );

-- Discipuladoras podem gerenciar reuniões das células supervisionadas
CREATE POLICY "Discipuladoras can manage meetings in supervised cells" ON kids_cell_meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_cell_supervision kcs
            WHERE kcs.kids_cell_id = kids_cell_meetings.kids_cell_id
            AND kcs.discipuladora_id = auth.uid()
        )
    );

-- Líderes podem gerenciar reuniões da sua célula
CREATE POLICY "Leaders can manage meetings in their cell" ON kids_cell_meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_cells
            WHERE id = kids_cell_meetings.kids_cell_id
            AND leader_id = auth.uid()
        )
    );

-- Membros da rede podem ver reuniões da sua célula
CREATE POLICY "Kids network members can view meetings in their cell" ON kids_cell_meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND kids_cell_id = kids_cell_meetings.kids_cell_id
            AND is_kids_network = true
        )
    );

-- =====================================================
-- RLS: KIDS_MEETING_ATTENDANCE
-- =====================================================

-- Pastores e Pastoras Kids podem gerenciar toda presença
CREATE POLICY "Pastors and Pastoras Kids can manage all attendance" ON kids_meeting_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = kids_meeting_attendance.church_id
            AND (role = 'PASTOR' OR kids_role = 'PASTORA_KIDS')
        )
    );

-- Discipuladoras podem gerenciar presença das células supervisionadas
CREATE POLICY "Discipuladoras can manage attendance in supervised cells" ON kids_meeting_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_cell_meetings kcm
            JOIN kids_cell_supervision kcs ON kcs.kids_cell_id = kcm.kids_cell_id
            WHERE kcm.id = kids_meeting_attendance.meeting_id
            AND kcs.discipuladora_id = auth.uid()
        )
    );

-- Líderes podem gerenciar presença da sua célula
CREATE POLICY "Leaders can manage attendance in their cell" ON kids_meeting_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_cell_meetings kcm
            JOIN kids_cells kc ON kc.id = kcm.kids_cell_id
            WHERE kcm.id = kids_meeting_attendance.meeting_id
            AND kc.leader_id = auth.uid()
        )
    );

-- Membros da rede podem ver presença da sua célula
CREATE POLICY "Kids network members can view attendance in their cell" ON kids_meeting_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kids_cell_meetings kcm
            JOIN profiles p ON p.kids_cell_id = kcm.kids_cell_id
            WHERE kcm.id = kids_meeting_attendance.meeting_id
            AND p.id = auth.uid()
            AND p.is_kids_network = true
        )
    );

-- =====================================================
-- 11. CONSTANTES KIDS (para referência)
-- =====================================================
-- MAX_KIDS_CELLS_PER_DISCIPULADORA = 5 (controlado por trigger)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
