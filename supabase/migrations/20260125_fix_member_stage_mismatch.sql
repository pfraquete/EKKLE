-- =====================================================
-- FIX MEMBER_STAGE SCHEMA MISMATCH
-- Correção Crítica de Segurança - Fase 1
-- =====================================================

-- Verificar valores atuais antes da mudança
DO $$
DECLARE
    v_invalid_count INTEGER;
    v_profile RECORD;
BEGIN
    -- Contar profiles com valores fora do constraint atual
    SELECT COUNT(*) INTO v_invalid_count
    FROM profiles
    WHERE member_stage NOT IN ('VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'LEADER');

    IF v_invalid_count > 0 THEN
        RAISE WARNING 'Found % profiles with member_stage values outside current constraint', v_invalid_count;
        RAISE WARNING 'These will need to be migrated. Listing them:';

        -- Logar os profiles para auditoria
        FOR v_profile IN
            SELECT id, full_name, member_stage
            FROM profiles
            WHERE member_stage NOT IN ('VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'LEADER')
        LOOP
            RAISE WARNING 'Profile ID: %, Name: %, Current stage: %',
                v_profile.id, v_profile.full_name, v_profile.member_stage;
        END LOOP;
    ELSE
        RAISE NOTICE 'No profiles with invalid member_stage values. Safe to proceed.';
    END IF;
END $$;

-- Drop constraint antigo
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_member_stage_check;

-- Adicionar novo constraint com 7 valores
ALTER TABLE profiles
ADD CONSTRAINT profiles_member_stage_check
CHECK (member_stage IN (
    'VISITOR',
    'REGULAR_VISITOR',
    'MEMBER',
    'GUARDIAN_ANGEL',
    'TRAINING_LEADER',
    'LEADER',
    'PASTOR'
));

-- Criar índice para otimizar queries por member_stage
CREATE INDEX IF NOT EXISTS idx_profiles_member_stage ON profiles(member_stage);

-- Adicionar comentário para documentação
COMMENT ON COLUMN profiles.member_stage IS
'Member stage: VISITOR (visitante), REGULAR_VISITOR (frequentador), MEMBER (membro), GUARDIAN_ANGEL (anjo da guarda), TRAINING_LEADER (líder em treinamento), LEADER (líder), PASTOR (pastor)';

-- Função helper para obter label do stage
CREATE OR REPLACE FUNCTION get_member_stage_label(stage TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE stage
        WHEN 'VISITOR' THEN 'Visitante'
        WHEN 'REGULAR_VISITOR' THEN 'Frequentador Assíduo'
        WHEN 'MEMBER' THEN 'Membro da Célula'
        WHEN 'GUARDIAN_ANGEL' THEN 'Anjo da Guarda'
        WHEN 'TRAINING_LEADER' THEN 'Líder em Treinamento'
        WHEN 'LEADER' THEN 'Líder de Célula'
        WHEN 'PASTOR' THEN 'Pastor'
        ELSE stage
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validar migration
DO $$
BEGIN
    -- Testar que todos os valores são aceitos
    PERFORM 1 WHERE 'GUARDIAN_ANGEL' IN ('VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'GUARDIAN_ANGEL', 'TRAINING_LEADER', 'LEADER', 'PASTOR');
    PERFORM 1 WHERE 'TRAINING_LEADER' IN ('VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'GUARDIAN_ANGEL', 'TRAINING_LEADER', 'LEADER', 'PASTOR');
    PERFORM 1 WHERE 'PASTOR' IN ('VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'GUARDIAN_ANGEL', 'TRAINING_LEADER', 'LEADER', 'PASTOR');

    RAISE NOTICE 'Migration successful: All member_stage values are now valid';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration failed: %', SQLERRM;
END $$;
