'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import {
    FeedPost,
    FeedSettings,
    FeedPostComment,
    ReactionType,
    PostStatus,
    UserRole,
    canUserPost,
    FeedPostsResponse,
    UpdateFeedSettingsInput,
} from '@/types/feed'

// ============================================
// Feed Settings
// ============================================

export async function getFeedSettings(): Promise<FeedSettings | null> {
    try {
        const profile = await getProfile()
        if (!profile) return null

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('feed_settings')
            .select('*')
            .eq('church_id', profile.church_id)
            .single()

        if (error) {
            // If no settings exist, create default
            if (error.code === 'PGRST116') {
                const { data: newSettings, error: insertError } = await supabase
                    .from('feed_settings')
                    .insert({ church_id: profile.church_id })
                    .select()
                    .single()

                if (insertError) {
                    console.error('Error creating feed settings:', insertError)
                    return null
                }
                return newSettings
            }
            console.error('Error fetching feed settings:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Error in getFeedSettings:', error)
        return null
    }
}

export async function updateFeedSettings(input: UpdateFeedSettingsInput) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }
        if (profile.role !== 'PASTOR') return { success: false, error: 'Sem permissão' }

        const supabase = await createClient()

        const { error } = await supabase
            .from('feed_settings')
            .update({
                min_role_to_post: input.min_role_to_post,
                require_approval: input.require_approval,
                allow_comments: input.allow_comments,
                allow_reactions: input.allow_reactions,
                allow_media: input.allow_media,
                max_media_per_post: input.max_media_per_post,
            })
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath('/feed')
        revalidatePath('/configuracoes/feed')
        return { success: true }
    } catch (error) {
        console.error('Error updating feed settings:', error)
        return { success: false, error: 'Erro ao atualizar configurações' }
    }
}

// ============================================
// Feed Posts
// ============================================

export async function getFeedPosts(options?: {
    page?: number
    limit?: number
    status?: PostStatus
}): Promise<FeedPostsResponse> {
    try {
        const profile = await getProfile()
        if (!profile) return { posts: [], hasMore: false, total: 0 }

        const page = options?.page || 1
        const limit = options?.limit || 20
        const offset = (page - 1) * limit

        const supabase = await createClient()

        // Build base query
        let query = supabase
            .from('feed_posts')
            .select(`
                *,
                author:profiles!author_id(id, full_name, photo_url, role),
                media:feed_post_media(
                    id, media_type, media_url, storage_path, file_name,
                    file_size, width, height, duration_seconds, thumbnail_url, sort_order
                ),
                reactions:feed_post_reactions(id, user_id, reaction)
            `, { count: 'exact' })
            .eq('church_id', profile.church_id)

        // If user is pastor, show all or filter by status
        // Otherwise only approved posts + own posts
        if (profile.role !== 'PASTOR') {
            query = query.or(`status.eq.approved,author_id.eq.${profile.id}`)
        } else if (options?.status) {
            query = query.eq('status', options.status)
        }

        const { data: posts, count, error } = await query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching feed posts:', error)
            return { posts: [], hasMore: false, total: 0 }
        }

        // Add user's reaction to each post
        const postsWithUserReaction = (posts || []).map(post => {
            const userReaction = post.reactions?.find(
                (r: { user_id: string; reaction: ReactionType }) => r.user_id === profile.id
            )
            return {
                ...post,
                user_reaction: userReaction?.reaction || null,
            }
        })

        const total = count || 0
        const hasMore = offset + (posts?.length || 0) < total

        return { posts: postsWithUserReaction as FeedPost[], hasMore, total }
    } catch (error) {
        console.error('Error in getFeedPosts:', error)
        return { posts: [], hasMore: false, total: 0 }
    }
}

export async function getPostById(postId: string): Promise<FeedPost | null> {
    try {
        const profile = await getProfile()
        if (!profile) return null

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('feed_posts')
            .select(`
                *,
                author:profiles!author_id(id, full_name, photo_url, role),
                media:feed_post_media(
                    id, media_type, media_url, storage_path, file_name,
                    file_size, width, height, duration_seconds, thumbnail_url, sort_order
                ),
                reactions:feed_post_reactions(id, user_id, reaction)
            `)
            .eq('id', postId)
            .eq('church_id', profile.church_id)
            .single()

        if (error) {
            console.error('Error fetching post:', error)
            return null
        }

        const userReaction = data.reactions?.find(
            (r: { user_id: string; reaction: ReactionType }) => r.user_id === profile.id
        )

        return {
            ...data,
            user_reaction: userReaction?.reaction || null,
        } as FeedPost
    } catch (error) {
        console.error('Error in getPostById:', error)
        return null
    }
}

export async function createPost(content: string) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        if (!content.trim()) return { success: false, error: 'O conteúdo não pode ser vazio' }

        const supabase = await createClient()

        // Get feed settings
        const settings = await getFeedSettings()
        if (!settings) return { success: false, error: 'Configurações não encontradas' }

        // Check permission
        if (!canUserPost(profile.role as UserRole, settings.min_role_to_post)) {
            return { success: false, error: 'Você não tem permissão para criar posts' }
        }

        // Determine status based on settings
        const status: PostStatus = settings.require_approval && profile.role !== 'PASTOR'
            ? 'pending'
            : 'approved'

        const { data, error } = await supabase
            .from('feed_posts')
            .insert({
                church_id: profile.church_id,
                author_id: profile.id,
                content: content.trim(),
                status,
            })
            .select(`
                *,
                author:profiles!author_id(id, full_name, photo_url, role)
            `)
            .single()

        if (error) throw error

        revalidatePath('/feed')
        return {
            success: true,
            post: { ...data, media: [], reactions: [], user_reaction: null } as FeedPost,
            message: status === 'pending'
                ? 'Post enviado para aprovação'
                : 'Post publicado com sucesso'
        }
    } catch (error) {
        console.error('Error creating post:', error)
        return { success: false, error: 'Erro ao criar post' }
    }
}

export async function updatePost(postId: string, content: string) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        if (!content.trim()) return { success: false, error: 'O conteúdo não pode ser vazio' }

        const supabase = await createClient()

        // Verify ownership
        const { data: post } = await supabase
            .from('feed_posts')
            .select('author_id')
            .eq('id', postId)
            .eq('church_id', profile.church_id)
            .single()

        if (!post) return { success: false, error: 'Post não encontrado' }
        if (post.author_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        const { error } = await supabase
            .from('feed_posts')
            .update({ content: content.trim() })
            .eq('id', postId)

        if (error) throw error

        revalidatePath('/feed')
        return { success: true }
    } catch (error) {
        console.error('Error updating post:', error)
        return { success: false, error: 'Erro ao atualizar post' }
    }
}

export async function deletePost(postId: string) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // Get post to check ownership and get media
        const { data: post } = await supabase
            .from('feed_posts')
            .select('author_id, media:feed_post_media(storage_path)')
            .eq('id', postId)
            .eq('church_id', profile.church_id)
            .single()

        if (!post) return { success: false, error: 'Post não encontrado' }

        // Check permission
        if (post.author_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        // Delete media from storage
        if (post.media && post.media.length > 0) {
            const paths = post.media.map((m: { storage_path: string }) => m.storage_path)
            await supabase.storage.from('feed-media').remove(paths)
        }

        // Delete post (cascades to media, reactions, comments)
        const { error } = await supabase
            .from('feed_posts')
            .delete()
            .eq('id', postId)

        if (error) throw error

        revalidatePath('/feed')
        return { success: true }
    } catch (error) {
        console.error('Error deleting post:', error)
        return { success: false, error: 'Erro ao excluir post' }
    }
}

// ============================================
// Post Moderation (Pastor only)
// ============================================

export async function getPendingPosts(): Promise<FeedPost[]> {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('feed_posts')
            .select(`
                *,
                author:profiles!author_id(id, full_name, photo_url, role),
                media:feed_post_media(
                    id, media_type, media_url, storage_path, file_name,
                    file_size, width, height, duration_seconds, thumbnail_url, sort_order
                )
            `)
            .eq('church_id', profile.church_id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching pending posts:', error)
            return []
        }

        return (data || []).map(post => ({
            ...post,
            reactions: [],
            user_reaction: null,
        })) as FeedPost[]
    } catch (error) {
        console.error('Error in getPendingPosts:', error)
        return []
    }
}

export async function getPendingPostsCount(): Promise<number> {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') return 0

        const supabase = await createClient()

        const { count, error } = await supabase
            .from('feed_posts')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .eq('status', 'pending')

        if (error) return 0
        return count || 0
    } catch {
        return 0
    }
}

export async function approvePost(postId: string) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('feed_posts')
            .update({
                status: 'approved',
                reviewed_by: profile.id,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', postId)
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath('/feed')
        revalidatePath('/configuracoes/feed')
        return { success: true }
    } catch (error) {
        console.error('Error approving post:', error)
        return { success: false, error: 'Erro ao aprovar post' }
    }
}

export async function rejectPost(postId: string, reason?: string) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('feed_posts')
            .update({
                status: 'rejected',
                reviewed_by: profile.id,
                reviewed_at: new Date().toISOString(),
                rejection_reason: reason || null,
            })
            .eq('id', postId)
            .eq('church_id', profile.church_id)

        if (error) throw error

        revalidatePath('/feed')
        revalidatePath('/configuracoes/feed')
        return { success: true }
    } catch (error) {
        console.error('Error rejecting post:', error)
        return { success: false, error: 'Erro ao rejeitar post' }
    }
}

export async function togglePinPost(postId: string) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        const supabase = await createClient()

        // Get current pin status
        const { data: post } = await supabase
            .from('feed_posts')
            .select('is_pinned')
            .eq('id', postId)
            .eq('church_id', profile.church_id)
            .single()

        if (!post) return { success: false, error: 'Post não encontrado' }

        const newPinned = !post.is_pinned

        const { error } = await supabase
            .from('feed_posts')
            .update({
                is_pinned: newPinned,
                pinned_at: newPinned ? new Date().toISOString() : null,
                pinned_by: newPinned ? profile.id : null,
            })
            .eq('id', postId)

        if (error) throw error

        revalidatePath('/feed')
        return { success: true, isPinned: newPinned }
    } catch (error) {
        console.error('Error toggling pin:', error)
        return { success: false, error: 'Erro ao fixar/desafixar post' }
    }
}

// ============================================
// Reactions
// ============================================

export async function toggleReaction(postId: string, reaction: ReactionType) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // Check if user already has a reaction on this post
        const { data: existingReactions } = await supabase
            .from('feed_post_reactions')
            .select('id, reaction')
            .eq('post_id', postId)
            .eq('user_id', profile.id)

        const existing = existingReactions?.find(r => r.reaction === reaction)

        if (existing) {
            // Remove the same reaction
            await supabase
                .from('feed_post_reactions')
                .delete()
                .eq('id', existing.id)
            return { success: true, action: 'removed', newReaction: null }
        } else {
            // Remove any other reaction first
            if (existingReactions && existingReactions.length > 0) {
                await supabase
                    .from('feed_post_reactions')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', profile.id)
            }

            // Add the new reaction
            await supabase
                .from('feed_post_reactions')
                .insert({
                    church_id: profile.church_id,
                    post_id: postId,
                    user_id: profile.id,
                    reaction,
                })

            return { success: true, action: 'added', newReaction: reaction }
        }
    } catch (error) {
        console.error('Error toggling reaction:', error)
        return { success: false, error: 'Erro ao reagir' }
    }
}

// ============================================
// Comments
// ============================================

export async function getPostComments(postId: string): Promise<FeedPostComment[]> {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('feed_post_comments')
            .select(`
                *,
                author:profiles!author_id(id, full_name, photo_url, role)
            `)
            .eq('post_id', postId)
            .eq('church_id', profile.church_id)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching comments:', error)
            return []
        }

        // Organize into threaded structure
        const comments = data as FeedPostComment[]
        const topLevel = comments.filter(c => !c.parent_id)
        const replies = comments.filter(c => c.parent_id)

        return topLevel.map(comment => ({
            ...comment,
            replies: replies.filter(r => r.parent_id === comment.id),
        }))
    } catch (error) {
        console.error('Error in getPostComments:', error)
        return []
    }
}

export async function createComment(
    postId: string,
    content: string,
    parentId?: string
) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        if (!content.trim()) return { success: false, error: 'O comentário não pode ser vazio' }

        // Check if comments are allowed
        const settings = await getFeedSettings()
        if (settings && !settings.allow_comments) {
            return { success: false, error: 'Comentários estão desativados' }
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('feed_post_comments')
            .insert({
                church_id: profile.church_id,
                post_id: postId,
                author_id: profile.id,
                content: content.trim(),
                parent_id: parentId || null,
            })
            .select(`
                *,
                author:profiles!author_id(id, full_name, photo_url, role)
            `)
            .single()

        if (error) throw error

        revalidatePath('/feed')
        return { success: true, comment: data as FeedPostComment }
    } catch (error) {
        console.error('Error creating comment:', error)
        return { success: false, error: 'Erro ao comentar' }
    }
}

export async function deleteComment(commentId: string) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // Check ownership or pastor role
        const { data: comment } = await supabase
            .from('feed_post_comments')
            .select('author_id')
            .eq('id', commentId)
            .eq('church_id', profile.church_id)
            .single()

        if (!comment) return { success: false, error: 'Comentário não encontrado' }

        if (comment.author_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        const { error } = await supabase
            .from('feed_post_comments')
            .delete()
            .eq('id', commentId)

        if (error) throw error

        revalidatePath('/feed')
        return { success: true }
    } catch (error) {
        console.error('Error deleting comment:', error)
        return { success: false, error: 'Erro ao excluir comentário' }
    }
}

export async function togglePinComment(commentId: string) {
    try {
        const profile = await getProfile()
        if (!profile || profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        const supabase = await createClient()

        const { data: comment } = await supabase
            .from('feed_post_comments')
            .select('is_pinned')
            .eq('id', commentId)
            .eq('church_id', profile.church_id)
            .single()

        if (!comment) return { success: false, error: 'Comentário não encontrado' }

        const { error } = await supabase
            .from('feed_post_comments')
            .update({ is_pinned: !comment.is_pinned })
            .eq('id', commentId)

        if (error) throw error

        revalidatePath('/feed')
        return { success: true, isPinned: !comment.is_pinned }
    } catch (error) {
        console.error('Error toggling pin comment:', error)
        return { success: false, error: 'Erro ao fixar comentário' }
    }
}
