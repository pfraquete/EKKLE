-- =====================================================
-- FACE RECOGNITION SYSTEM - 2026-01-30
-- =====================================================
-- Sistema de reconhecimento facial para álbum de célula
-- - Armazena embeddings faciais dos membros
-- - Detecta e identifica faces em fotos
-- - Permite busca de fotos por membro
-- =====================================================

-- =====================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- =====================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 2. MEMBER FACE EMBEDDINGS TABLE
-- Armazena o embedding facial da foto de perfil
-- =====================================================

CREATE TABLE IF NOT EXISTS member_face_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Embedding facial (128 dimensões do face-api.js/FaceNet)
    embedding vector(128) NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_member_face_embeddings_church_id ON member_face_embeddings(church_id);
CREATE INDEX idx_member_face_embeddings_profile_id ON member_face_embeddings(profile_id);

-- Vector index for similarity search (IVFFlat)
CREATE INDEX idx_member_embeddings_vector ON member_face_embeddings
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Updated at trigger
CREATE TRIGGER update_member_face_embeddings_updated_at
    BEFORE UPDATE ON member_face_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE member_face_embeddings ENABLE ROW LEVEL SECURITY;

-- Members can view embeddings from their church
CREATE POLICY "Members can view church face embeddings" ON member_face_embeddings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = member_face_embeddings.church_id
        )
    );

-- Members can manage their own embedding
CREATE POLICY "Members can manage own face embedding" ON member_face_embeddings
    FOR ALL USING (profile_id = auth.uid());

-- Leaders and pastors can manage all embeddings
CREATE POLICY "Leaders can manage all face embeddings" ON member_face_embeddings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = member_face_embeddings.church_id
            AND role IN ('LEADER', 'PASTOR')
        )
    );

-- =====================================================
-- 3. PHOTO FACE DETECTIONS TABLE
-- Armazena faces detectadas em fotos do álbum
-- =====================================================

CREATE TABLE IF NOT EXISTS photo_face_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES cell_photos(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

    -- Membro identificado (NULL se não identificado)
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Embedding facial da face detectada
    embedding vector(128) NOT NULL,

    -- Confiança do match (0-1)
    confidence FLOAT,

    -- Bounding box da face na imagem (coordenadas normalizadas 0-1)
    box_x FLOAT NOT NULL,
    box_y FLOAT NOT NULL,
    box_width FLOAT NOT NULL,
    box_height FLOAT NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_photo_face_detections_photo_id ON photo_face_detections(photo_id);
CREATE INDEX idx_photo_face_detections_profile_id ON photo_face_detections(profile_id);
CREATE INDEX idx_photo_face_detections_church_id ON photo_face_detections(church_id);

-- Vector index for similarity search
CREATE INDEX idx_photo_detections_vector ON photo_face_detections
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS
ALTER TABLE photo_face_detections ENABLE ROW LEVEL SECURITY;

-- Members can view detections from their church
CREATE POLICY "Members can view photo face detections" ON photo_face_detections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = photo_face_detections.church_id
        )
    );

-- Leaders and pastors can manage detections
CREATE POLICY "Leaders can manage photo face detections" ON photo_face_detections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = photo_face_detections.church_id
            AND role IN ('LEADER', 'PASTOR')
        )
    );

-- =====================================================
-- 4. FUNCTIONS FOR FACE MATCHING
-- =====================================================

-- Function to match a face embedding to a member
CREATE OR REPLACE FUNCTION match_face_embedding(
    query_embedding vector(128),
    match_threshold FLOAT DEFAULT 0.6,
    p_church_id UUID DEFAULT NULL
)
RETURNS TABLE (
    profile_id UUID,
    full_name TEXT,
    photo_url TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mfe.profile_id,
        p.full_name,
        p.photo_url,
        (1 - (mfe.embedding <=> query_embedding))::FLOAT as similarity
    FROM member_face_embeddings mfe
    JOIN profiles p ON p.id = mfe.profile_id
    WHERE (p_church_id IS NULL OR mfe.church_id = p_church_id)
      AND (1 - (mfe.embedding <=> query_embedding)) > match_threshold
    ORDER BY mfe.embedding <=> query_embedding
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search photos by member
CREATE OR REPLACE FUNCTION search_photos_by_member(
    p_profile_id UUID,
    p_church_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    photo_id UUID,
    photo_url TEXT,
    confidence FLOAT,
    box_x FLOAT,
    box_y FLOAT,
    box_width FLOAT,
    box_height FLOAT,
    photo_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pfd.photo_id,
        cp.photo_url,
        pfd.confidence,
        pfd.box_x,
        pfd.box_y,
        pfd.box_width,
        pfd.box_height,
        cp.created_at
    FROM photo_face_detections pfd
    JOIN cell_photos cp ON cp.id = pfd.photo_id
    WHERE pfd.profile_id = p_profile_id
      AND (p_church_id IS NULL OR pfd.church_id = p_church_id)
    ORDER BY cp.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all face detections for a photo
CREATE OR REPLACE FUNCTION get_photo_faces(
    p_photo_id UUID
)
RETURNS TABLE (
    detection_id UUID,
    profile_id UUID,
    full_name TEXT,
    member_photo_url TEXT,
    confidence FLOAT,
    box_x FLOAT,
    box_y FLOAT,
    box_width FLOAT,
    box_height FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pfd.id as detection_id,
        pfd.profile_id,
        p.full_name,
        p.photo_url as member_photo_url,
        pfd.confidence,
        pfd.box_x,
        pfd.box_y,
        pfd.box_width,
        pfd.box_height
    FROM photo_face_detections pfd
    LEFT JOIN profiles p ON p.id = pfd.profile_id
    WHERE pfd.photo_id = p_photo_id
    ORDER BY pfd.box_x;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ADD face_processed FLAG TO cell_photos
-- =====================================================

ALTER TABLE cell_photos ADD COLUMN IF NOT EXISTS face_processed BOOLEAN DEFAULT false;
ALTER TABLE cell_photos ADD COLUMN IF NOT EXISTS face_count INTEGER DEFAULT 0;

-- Index for unprocessed photos
CREATE INDEX IF NOT EXISTS idx_cell_photos_face_processed ON cell_photos(face_processed) WHERE face_processed = false;
