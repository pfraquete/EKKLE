/**
 * Feed Types
 *
 * Type definitions for the church social feed system including
 * posts, reactions, comments, and moderation.
 */

// ============================================
// Reaction Types (matching chat system)
// ============================================

export type ReactionType = 'like' | 'love' | 'laugh' | 'sad' | 'wow' | 'pray'

export const REACTION_EMOJIS: Record<ReactionType, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    sad: '😢',
    wow: '😮',
    pray: '🙏',
}

// ============================================
// Role Types
// ============================================

export type UserRole = 'PASTOR' | 'DISCIPULADOR' | 'LEADER' | 'MEMBER'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
    PASTOR: 4,
    DISCIPULADOR: 3,
    LEADER: 2,
    MEMBER: 1,
}

export const ROLE_LABELS: Record<UserRole, string> = {
    PASTOR: 'Pastor',
    DISCIPULADOR: 'Discipulador',
    LEADER: 'Líder',
    MEMBER: 'Membro',
}

// ============================================
// Post Status
// ============================================

export type PostStatus = 'pending' | 'approved' | 'rejected'

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
    pending: 'Aguardando aprovação',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
}

// ============================================
// Feed Settings
// ============================================

export interface FeedSettings {
    id: string
    church_id: string
    min_role_to_post: UserRole
    require_approval: boolean
    allow_comments: boolean
    allow_reactions: boolean
    allow_media: boolean
    max_media_per_post: number
    created_at: string
    updated_at: string
}

// ============================================
// Post Media
// ============================================

export type MediaType = 'image' | 'video'

export interface FeedPostMedia {
    id: string
    church_id: string
    post_id: string
    media_type: MediaType
    storage_path: string
    media_url: string
    file_name: string | null
    file_size: number | null
    mime_type: string | null
    width: number | null
    height: number | null
    duration_seconds: number | null
    thumbnail_url: string | null
    sort_order: number
    created_at: string
}

// ============================================
// Post Reaction
// ============================================

export interface FeedPostReaction {
    id: string
    church_id: string
    post_id: string
    user_id: string
    reaction: ReactionType
    created_at: string
    user?: {
        full_name: string
        photo_url: string | null
    }
}

export interface ReactionGroup {
    reaction: ReactionType
    emoji: string
    count: number
    users: { id: string; full_name: string }[]
    hasReacted: boolean
}

// ============================================
// Post Comment
// ============================================

export interface FeedPostComment {
    id: string
    church_id: string
    post_id: string
    author_id: string
    content: string
    parent_id: string | null
    is_pinned: boolean
    created_at: string
    updated_at: string
    author: {
        id: string
        full_name: string
        photo_url: string | null
        role: UserRole
    }
    replies?: FeedPostComment[]
}

// ============================================
// Post Author
// ============================================

export interface PostAuthor {
    id: string
    full_name: string
    photo_url: string | null
    role: UserRole
}

// ============================================
// Feed Post
// ============================================

export interface FeedPost {
    id: string
    church_id: string
    author_id: string
    content: string
    status: PostStatus
    reviewed_by: string | null
    reviewed_at: string | null
    rejection_reason: string | null
    is_pinned: boolean
    pinned_at: string | null
    pinned_by: string | null
    reactions_count: number
    comments_count: number
    created_at: string
    updated_at: string
    author: PostAuthor
    media: FeedPostMedia[]
    reactions: FeedPostReaction[]
    user_reaction?: ReactionType | null
}

// ============================================
// Input Types
// ============================================

export interface CreatePostInput {
    content: string
}

export interface UpdatePostInput {
    id: string
    content: string
}

export interface CreateCommentInput {
    postId: string
    content: string
    parentId?: string
}

export interface UpdateFeedSettingsInput {
    min_role_to_post: UserRole
    require_approval: boolean
    allow_comments: boolean
    allow_reactions: boolean
    allow_media: boolean
    max_media_per_post: number
}

export interface RegisterMediaInput {
    postId: string
    mediaType: MediaType
    storagePath: string
    mediaUrl: string
    fileName?: string
    fileSize?: number
    mimeType?: string
    width?: number
    height?: number
    durationSeconds?: number
    thumbnailUrl?: string
    sortOrder?: number
}

// ============================================
// Response Types
// ============================================

export interface FeedPostsResponse {
    posts: FeedPost[]
    hasMore: boolean
    total: number
}

export interface ActionResponse<T = unknown> {
    success: boolean
    error?: string
    message?: string
    data?: T
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if user can post based on role hierarchy
 */
export function canUserPost(userRole: UserRole, minRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/**
 * Get roles that can post given the minimum role
 */
export function getRolesThatCanPost(minRole: UserRole): UserRole[] {
    const minLevel = ROLE_HIERARCHY[minRole]
    return (Object.keys(ROLE_HIERARCHY) as UserRole[])
        .filter(role => ROLE_HIERARCHY[role] >= minLevel)
}

/**
 * Group reactions by type with counts
 */
export function groupReactions(
    reactions: FeedPostReaction[],
    currentUserId: string
): ReactionGroup[] {
    const groups: Record<ReactionType, ReactionGroup> = {} as Record<ReactionType, ReactionGroup>

    for (const r of reactions) {
        if (!groups[r.reaction]) {
            groups[r.reaction] = {
                reaction: r.reaction,
                emoji: REACTION_EMOJIS[r.reaction],
                count: 0,
                users: [],
                hasReacted: false,
            }
        }
        groups[r.reaction].count++
        if (r.user) {
            groups[r.reaction].users.push({ id: r.user_id, full_name: r.user.full_name })
        }
        if (r.user_id === currentUserId) {
            groups[r.reaction].hasReacted = true
        }
    }

    return Object.values(groups).sort((a, b) => b.count - a.count)
}
