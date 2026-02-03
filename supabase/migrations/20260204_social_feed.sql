-- ============================================
-- Migration: Church Social Feed
-- ============================================
-- This migration creates a social feed for churches:
-- - Feed settings (per church configuration)
-- - Posts with moderation workflow
-- - Media attachments (photos/videos)
-- - Reactions on posts
-- - Threaded comments
-- ============================================

-- ============================================
-- 1. Feed Settings (per church configuration)
-- ============================================

CREATE TABLE IF NOT EXISTS feed_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL UNIQUE REFERENCES churches(id) ON DELETE CASCADE,

    -- Who can create posts (minimum role required)
    -- 'MEMBER' = everyone, 'LEADER' = leaders+, 'DISCIPULADOR' = discipuladores+, 'PASTOR' = only pastor
    min_role_to_post TEXT NOT NULL DEFAULT 'MEMBER'
        CHECK (min_role_to_post IN ('PASTOR', 'DISCIPULADOR', 'LEADER', 'MEMBER')),

    -- Moderation settings
    require_approval BOOLEAN NOT NULL DEFAULT false,

    -- Feature toggles
    allow_comments BOOLEAN NOT NULL DEFAULT true,
    allow_reactions BOOLEAN NOT NULL DEFAULT true,
    allow_media BOOLEAN NOT NULL DEFAULT true,
    max_media_per_post INTEGER NOT NULL DEFAULT 10,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for feed settings
CREATE INDEX IF NOT EXISTS idx_feed_settings_church ON feed_settings(church_id);

-- ============================================
-- 2. Feed Posts
-- ============================================

CREATE TABLE IF NOT EXISTS feed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,

    -- Moderation status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Pinning (pastor can pin important posts)
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    pinned_at TIMESTAMPTZ,
    pinned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Counters (denormalized for performance)
    reactions_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for feed_posts
CREATE INDEX IF NOT EXISTS idx_feed_posts_church ON feed_posts(church_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_status ON feed_posts(status);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_pinned ON feed_posts(is_pinned) WHERE is_pinned = true;
-- Composite index for feed queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_church_status_created ON feed_posts(church_id, status, created_at DESC);

-- ============================================
-- 3. Feed Post Media
-- ============================================

CREATE TABLE IF NOT EXISTS feed_post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,

    -- Media info
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    storage_path TEXT NOT NULL,
    media_url TEXT NOT NULL,

    -- Metadata
    file_name TEXT,
    file_size INTEGER, -- in bytes
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER, -- for videos
    thumbnail_url TEXT, -- for videos

    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for feed_post_media
CREATE INDEX IF NOT EXISTS idx_feed_media_post ON feed_post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_media_church ON feed_post_media(church_id);

-- ============================================
-- 4. Feed Post Reactions
-- ============================================

CREATE TABLE IF NOT EXISTS feed_post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Reaction type (matching existing chat reactions)
    reaction TEXT NOT NULL CHECK (reaction IN ('like', 'love', 'laugh', 'sad', 'wow', 'pray')),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- One reaction type per user per post
    UNIQUE(post_id, user_id, reaction)
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_feed_reactions_post ON feed_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON feed_post_reactions(user_id);

-- ============================================
-- 5. Feed Post Comments
-- ============================================

CREATE TABLE IF NOT EXISTS feed_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,

    -- Threading (replies)
    parent_id UUID REFERENCES feed_post_comments(id) ON DELETE CASCADE,

    -- Moderation
    is_pinned BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_author ON feed_post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent ON feed_post_comments(parent_id);

-- ============================================
-- 6. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE feed_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_comments ENABLE ROW LEVEL SECURITY;

-- Feed Settings Policies
CREATE POLICY "feed_settings_select" ON feed_settings
    FOR SELECT USING (
        church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_settings_insert" ON feed_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = feed_settings.church_id
            AND role = 'PASTOR'
        )
    );

CREATE POLICY "feed_settings_update" ON feed_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = feed_settings.church_id
            AND role = 'PASTOR'
        )
    );

CREATE POLICY "feed_settings_delete" ON feed_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = feed_settings.church_id
            AND role = 'PASTOR'
        )
    );

-- Feed Posts Policies
CREATE POLICY "feed_posts_select" ON feed_posts
    FOR SELECT USING (
        church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
        AND (
            status = 'approved'
            OR author_id = auth.uid()
            OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'PASTOR'
        )
    );

CREATE POLICY "feed_posts_insert" ON feed_posts
    FOR INSERT WITH CHECK (
        church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
        AND author_id = auth.uid()
    );

CREATE POLICY "feed_posts_update_author" ON feed_posts
    FOR UPDATE USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "feed_posts_update_pastor" ON feed_posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = feed_posts.church_id
            AND role = 'PASTOR'
        )
    );

CREATE POLICY "feed_posts_delete" ON feed_posts
    FOR DELETE USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = feed_posts.church_id
            AND role = 'PASTOR'
        )
    );

-- Feed Post Media Policies
CREATE POLICY "feed_media_select" ON feed_post_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feed_posts fp
            WHERE fp.id = feed_post_media.post_id
            AND fp.church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
            AND (
                fp.status = 'approved'
                OR fp.author_id = auth.uid()
                OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'PASTOR'
            )
        )
    );

CREATE POLICY "feed_media_insert" ON feed_post_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM feed_posts fp
            WHERE fp.id = feed_post_media.post_id
            AND fp.author_id = auth.uid()
        )
    );

CREATE POLICY "feed_media_delete" ON feed_post_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM feed_posts fp
            WHERE fp.id = feed_post_media.post_id
            AND (
                fp.author_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND church_id = fp.church_id
                    AND role = 'PASTOR'
                )
            )
        )
    );

-- Feed Post Reactions Policies
CREATE POLICY "feed_reactions_select" ON feed_post_reactions
    FOR SELECT USING (
        church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_reactions_insert" ON feed_post_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_reactions_delete" ON feed_post_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Feed Post Comments Policies
CREATE POLICY "feed_comments_select" ON feed_post_comments
    FOR SELECT USING (
        church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_comments_insert" ON feed_post_comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid()
        AND church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_comments_update" ON feed_post_comments
    FOR UPDATE USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = feed_post_comments.church_id
            AND role = 'PASTOR'
        )
    );

CREATE POLICY "feed_comments_delete" ON feed_post_comments
    FOR DELETE USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = feed_post_comments.church_id
            AND role = 'PASTOR'
        )
    );

-- ============================================
-- 7. Triggers for updated_at and counters
-- ============================================

-- Trigger for updated_at on feed_settings
CREATE TRIGGER update_feed_settings_updated_at
    BEFORE UPDATE ON feed_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on feed_posts
CREATE TRIGGER update_feed_posts_updated_at
    BEFORE UPDATE ON feed_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on feed_post_comments
CREATE TRIGGER update_feed_comments_updated_at
    BEFORE UPDATE ON feed_post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update reaction count
CREATE OR REPLACE FUNCTION update_feed_post_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE feed_posts SET reactions_count = reactions_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE feed_posts SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feed_reactions_count
    AFTER INSERT OR DELETE ON feed_post_reactions
    FOR EACH ROW EXECUTE FUNCTION update_feed_post_reactions_count();

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_feed_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE feed_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feed_comments_count
    AFTER INSERT OR DELETE ON feed_post_comments
    FOR EACH ROW EXECUTE FUNCTION update_feed_post_comments_count();

-- ============================================
-- 8. Enable Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_post_comments;

-- ============================================
-- 9. Storage Bucket for Feed Media
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'feed-media',
    'feed-media',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for feed-media bucket
CREATE POLICY "feed_media_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'feed-media' AND
        (storage.foldername(name))[1] = (SELECT church_id::text FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_media_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'feed-media' AND
        (storage.foldername(name))[1] = (SELECT church_id::text FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_media_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'feed-media' AND
        (storage.foldername(name))[1] = (SELECT church_id::text FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "feed_media_public_read" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'feed-media');

-- ============================================
-- 10. Default feed settings for existing churches
-- ============================================

INSERT INTO feed_settings (church_id, min_role_to_post, require_approval)
SELECT id, 'MEMBER', false FROM churches
ON CONFLICT (church_id) DO NOTHING;

-- ============================================
-- 11. Comments for documentation
-- ============================================

COMMENT ON TABLE feed_settings IS 'Per-church configuration for social feed (posting permissions, moderation settings)';
COMMENT ON TABLE feed_posts IS 'Social feed posts with moderation workflow';
COMMENT ON TABLE feed_post_media IS 'Media attachments (images, videos) for feed posts';
COMMENT ON TABLE feed_post_reactions IS 'User reactions on feed posts (like, love, laugh, sad, wow, pray)';
COMMENT ON TABLE feed_post_comments IS 'Threaded comments on feed posts';

COMMENT ON COLUMN feed_settings.min_role_to_post IS 'Minimum role required to create posts: MEMBER, LEADER, DISCIPULADOR, or PASTOR';
COMMENT ON COLUMN feed_settings.require_approval IS 'If true, posts from non-pastors need approval before being visible';
COMMENT ON COLUMN feed_posts.status IS 'Moderation status: pending (awaiting review), approved (visible), rejected (not visible)';
COMMENT ON COLUMN feed_posts.reactions_count IS 'Denormalized count of reactions for performance';
COMMENT ON COLUMN feed_posts.comments_count IS 'Denormalized count of comments for performance';
