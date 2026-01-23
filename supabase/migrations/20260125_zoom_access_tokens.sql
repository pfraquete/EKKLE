-- =====================================================
-- ZOOM ACCESS TOKENS - Security Enhancement
-- Correção Crítica de Segurança - Fase 1
-- =====================================================

-- Criar tabela para tokens temporários de acesso ao Zoom
CREATE TABLE IF NOT EXISTS service_zoom_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accessed_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint único por service e token
    CONSTRAINT unique_service_token UNIQUE(service_id, token)
);

-- Índices para otimizar lookups
CREATE INDEX idx_service_zoom_tokens_service_id ON service_zoom_tokens(service_id);
CREATE INDEX idx_service_zoom_tokens_token ON service_zoom_tokens(token);
CREATE INDEX idx_service_zoom_tokens_expires_at ON service_zoom_tokens(expires_at);

-- Enable RLS
ALTER TABLE service_zoom_tokens ENABLE ROW LEVEL SECURITY;

-- Public pode validar tokens (read-only, token é requerido)
CREATE POLICY "Anyone can validate tokens with token value"
    ON service_zoom_tokens
    FOR SELECT
    USING (
        expires_at > NOW()
    );

-- Apenas pastores/líderes da igreja podem criar tokens
CREATE POLICY "Church admins can create tokens"
    ON service_zoom_tokens
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM services s
            JOIN profiles p ON p.church_id = s.church_id
            WHERE s.id = service_id
            AND p.id = auth.uid()
            AND p.role IN ('PASTOR', 'LEADER')
        )
    );

-- Função para gerar token seguro
CREATE OR REPLACE FUNCTION generate_zoom_access_token(
    p_service_id UUID,
    p_valid_hours INTEGER DEFAULT 48
)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Gerar token único
    LOOP
        -- Gerar token criptograficamente seguro (32 bytes = 64 caracteres hex)
        v_token := encode(gen_random_bytes(32), 'hex');

        -- Verificar se token já existe
        SELECT EXISTS(SELECT 1 FROM service_zoom_tokens WHERE token = v_token) INTO v_exists;

        EXIT WHEN NOT v_exists;
    END LOOP;

    -- Inserir token
    INSERT INTO service_zoom_tokens (service_id, token, expires_at)
    VALUES (p_service_id, v_token, NOW() + (p_valid_hours || ' hours')::INTERVAL);

    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar token e retornar credenciais Zoom
CREATE OR REPLACE FUNCTION get_zoom_credentials_with_token(
    p_service_id UUID,
    p_token TEXT
)
RETURNS TABLE(
    zoom_meeting_id TEXT,
    zoom_password TEXT
) AS $$
BEGIN
    -- Validar token
    IF NOT EXISTS (
        SELECT 1 FROM service_zoom_tokens
        WHERE service_id = p_service_id
        AND token = p_token
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;

    -- Atualizar contador de acesso
    UPDATE service_zoom_tokens
    SET accessed_count = accessed_count + 1,
        last_accessed_at = NOW()
    WHERE service_id = p_service_id AND token = p_token;

    -- Retornar credenciais
    RETURN QUERY
    SELECT s.zoom_meeting_id, s.zoom_password
    FROM services s
    WHERE s.id = p_service_id
    AND s.is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para cleanup de tokens expirados (executar via cron diariamente)
CREATE OR REPLACE FUNCTION cleanup_expired_zoom_tokens()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM service_zoom_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE service_zoom_tokens IS 'Temporary access tokens for Zoom meeting credentials - expires in 48h';
COMMENT ON FUNCTION generate_zoom_access_token IS 'Generates a secure temporary token for zoom access (default 48h validity)';
COMMENT ON FUNCTION get_zoom_credentials_with_token IS 'Validates token and returns zoom credentials if valid and not expired';
COMMENT ON FUNCTION cleanup_expired_zoom_tokens IS 'Cleanup function for expired tokens (run daily via cron)';
