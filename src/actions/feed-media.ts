'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { getFeedSettings } from './feed'
import { FeedPostMedia, RegisterMediaInput } from '@/types/feed'

/**
 * Register media after uploading to storage
 */
export async function registerPostMedia(input: RegisterMediaInput) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // Verify post belongs to user
        const { data: post } = await supabase
            .from('feed_posts')
            .select('id, author_id')
            .eq('id', input.postId)
            .eq('church_id', profile.church_id)
            .single()

        if (!post) return { success: false, error: 'Post não encontrado' }

        if (post.author_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        // Check feed settings for media
        const settings = await getFeedSettings()
        if (settings && !settings.allow_media) {
            return { success: false, error: 'Mídia não permitida' }
        }

        // Count existing media
        const { count } = await supabase
            .from('feed_post_media')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', input.postId)

        if (settings && (count || 0) >= settings.max_media_per_post) {
            return { success: false, error: `Máximo de ${settings.max_media_per_post} arquivos por post` }
        }

        const { data: media, error } = await supabase
            .from('feed_post_media')
            .insert({
                church_id: profile.church_id,
                post_id: input.postId,
                media_type: input.mediaType,
                storage_path: input.storagePath,
                media_url: input.mediaUrl,
                file_name: input.fileName || null,
                file_size: input.fileSize || null,
                mime_type: input.mimeType || null,
                width: input.width || null,
                height: input.height || null,
                duration_seconds: input.durationSeconds || null,
                thumbnail_url: input.thumbnailUrl || null,
                sort_order: input.sortOrder || 0,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/feed')
        return { success: true, media: media as FeedPostMedia }
    } catch (error) {
        console.error('Error registering post media:', error)
        return { success: false, error: 'Erro ao registrar mídia' }
    }
}

/**
 * Delete media from post
 */
export async function deletePostMedia(mediaId: string) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // Get media with post info
        const { data: media } = await supabase
            .from('feed_post_media')
            .select('id, storage_path, post_id')
            .eq('id', mediaId)
            .eq('church_id', profile.church_id)
            .single()

        if (!media) return { success: false, error: 'Mídia não encontrada' }

        // Verify post ownership
        const { data: post } = await supabase
            .from('feed_posts')
            .select('author_id')
            .eq('id', media.post_id)
            .single()

        if (!post) return { success: false, error: 'Post não encontrado' }

        // Check ownership
        if (post.author_id !== profile.id && profile.role !== 'PASTOR') {
            return { success: false, error: 'Sem permissão' }
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from('feed-media')
            .remove([media.storage_path])

        if (storageError) {
            console.error('Error deleting from storage:', storageError)
            // Continue anyway to delete the database record
        }

        // Delete from database
        const { error } = await supabase
            .from('feed_post_media')
            .delete()
            .eq('id', mediaId)

        if (error) throw error

        revalidatePath('/feed')
        return { success: true }
    } catch (error) {
        console.error('Error deleting post media:', error)
        return { success: false, error: 'Erro ao excluir mídia' }
    }
}

/**
 * Get upload URL for media
 */
export async function getMediaUploadUrl(
    postId: string,
    fileName: string,
    contentType: string
) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // Verify post belongs to user
        const { data: post } = await supabase
            .from('feed_posts')
            .select('id, author_id')
            .eq('id', postId)
            .eq('church_id', profile.church_id)
            .single()

        if (!post) return { success: false, error: 'Post não encontrado' }

        if (post.author_id !== profile.id) {
            return { success: false, error: 'Sem permissão' }
        }

        // Check feed settings for media
        const settings = await getFeedSettings()
        if (settings && !settings.allow_media) {
            return { success: false, error: 'Mídia não permitida' }
        }

        // Generate unique file path
        const timestamp = Date.now()
        const uniqueId = crypto.randomUUID()
        const extension = fileName.split('.').pop() || ''
        const storagePath = `${profile.church_id}/${postId}/${uniqueId}-${timestamp}.${extension}`

        // Create signed upload URL
        const { data: signedUrl, error } = await supabase.storage
            .from('feed-media')
            .createSignedUploadUrl(storagePath)

        if (error) throw error

        // Get public URL
        const { data: publicUrl } = supabase.storage
            .from('feed-media')
            .getPublicUrl(storagePath)

        return {
            success: true,
            signedUrl: signedUrl.signedUrl,
            storagePath,
            publicUrl: publicUrl.publicUrl,
        }
    } catch (error) {
        console.error('Error getting upload URL:', error)
        return { success: false, error: 'Erro ao gerar URL de upload' }
    }
}

/**
 * Reorder media in a post
 */
export async function reorderPostMedia(postId: string, mediaIds: string[]) {
    try {
        const profile = await getProfile()
        if (!profile) return { success: false, error: 'Não autenticado' }

        const supabase = await createClient()

        // Verify post ownership
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

        // Update sort order for each media
        const updates = mediaIds.map((mediaId, index) =>
            supabase
                .from('feed_post_media')
                .update({ sort_order: index })
                .eq('id', mediaId)
                .eq('post_id', postId)
        )

        await Promise.all(updates)

        revalidatePath('/feed')
        return { success: true }
    } catch (error) {
        console.error('Error reordering media:', error)
        return { success: false, error: 'Erro ao reordenar mídia' }
    }
}
