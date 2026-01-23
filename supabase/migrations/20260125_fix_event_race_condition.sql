-- =====================================================
-- FIX EVENT REGISTRATION RACE CONDITION
-- Correção Crítica de Segurança - Fase 1
-- =====================================================

-- Função para contar inscrições ativas com pessimistic lock
CREATE OR REPLACE FUNCTION get_active_registration_count_locked(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Lock da linha do evento para prevenir race conditions
    PERFORM 1 FROM events WHERE id = p_event_id FOR UPDATE;

    -- Contar inscrições ativas
    SELECT COUNT(*) INTO v_count
    FROM event_registrations
    WHERE event_id = p_event_id
    AND status IN ('CONFIRMED', 'PENDING', 'ATTENDED');

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger function para validar capacidade antes de INSERT/UPDATE
CREATE OR REPLACE FUNCTION validate_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_event_capacity INTEGER;
    v_active_count INTEGER;
    v_new_status_is_active BOOLEAN;
    v_old_status_is_active BOOLEAN;
BEGIN
    -- Determinar se novo status é "ativo" (conta para capacidade)
    v_new_status_is_active := NEW.status IN ('CONFIRMED', 'PENDING', 'ATTENDED');

    -- Para UPDATE, verificar se status antigo era ativo
    IF TG_OP = 'UPDATE' THEN
        v_old_status_is_active := OLD.status IN ('CONFIRMED', 'PENDING', 'ATTENDED');

        -- Se transição de não-ativo para ativo, continuar validação
        IF NOT v_old_status_is_active AND v_new_status_is_active THEN
            -- Nova inscrição "ativa", verificar capacidade
            NULL;
        ELSIF v_old_status_is_active AND v_new_status_is_active THEN
            -- Já ativo, apenas atualizando, sem verificação
            RETURN NEW;
        ELSE
            -- Transição de ativo para não-ativo, ou permanece não-ativo
            RETURN NEW;
        END IF;
    END IF;

    -- Apenas verificar capacidade para status ativos
    IF NOT v_new_status_is_active THEN
        RETURN NEW;
    END IF;

    -- Buscar capacidade do evento com lock
    SELECT capacity INTO v_event_capacity
    FROM events
    WHERE id = NEW.event_id
    FOR UPDATE;

    -- Se sem limite de capacidade, permitir inscrição
    IF v_event_capacity IS NULL THEN
        RETURN NEW;
    END IF;

    -- Contar inscrições ativas atuais (excluindo esta se for UPDATE)
    IF TG_OP = 'UPDATE' THEN
        SELECT COUNT(*) INTO v_active_count
        FROM event_registrations
        WHERE event_id = NEW.event_id
        AND status IN ('CONFIRMED', 'PENDING', 'ATTENDED')
        AND id != NEW.id;
    ELSE
        SELECT COUNT(*) INTO v_active_count
        FROM event_registrations
        WHERE event_id = NEW.event_id
        AND status IN ('CONFIRMED', 'PENDING', 'ATTENDED');
    END IF;

    -- Verificar se adicionar esta inscrição excederia capacidade
    IF v_active_count >= v_event_capacity THEN
        -- Se tentando inserir/atualizar para CONFIRMED/ATTENDED, forçar WAITLIST
        IF NEW.status IN ('CONFIRMED', 'ATTENDED') THEN
            RAISE EXCEPTION 'Event is at full capacity. Registration must be WAITLIST.'
                USING ERRCODE = 'check_violation',
                      HINT = 'Current capacity: %, Active registrations: %', v_event_capacity, v_active_count;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger existente se houver
DROP TRIGGER IF EXISTS trg_validate_event_capacity ON event_registrations;

-- Criar trigger BEFORE INSERT OR UPDATE
CREATE TRIGGER trg_validate_event_capacity
    BEFORE INSERT OR UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION validate_event_capacity();

-- Adicionar CHECK constraint para garantir status válidos
ALTER TABLE event_registrations
DROP CONSTRAINT IF EXISTS check_valid_status_transition;

ALTER TABLE event_registrations
ADD CONSTRAINT check_valid_status_transition
CHECK (
    status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST', 'ATTENDED')
);

-- Adicionar índice composto para otimizar COUNT queries
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status
ON event_registrations(event_id, status)
WHERE status IN ('CONFIRMED', 'PENDING', 'ATTENDED');

-- Comentários para documentação
COMMENT ON FUNCTION get_active_registration_count_locked IS 'Get active registration count with pessimistic lock on event row to prevent race conditions';
COMMENT ON FUNCTION validate_event_capacity IS 'Validate event capacity before registration insert/update - prevents overbooking';
COMMENT ON TRIGGER trg_validate_event_capacity ON event_registrations IS 'Enforces capacity limits and prevents race conditions in event registrations';
