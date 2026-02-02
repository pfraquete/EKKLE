'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export interface ConversationParticipant {
    id: string
    profile_id: string
    joined_at: string
    last_read_at: string | null
    is_muted: boolean
    profile: {
        id: string
        full_name: string
        nickname: string | null
        photo_url: string | null
    }
}

export interface Conversation {
    id: string
    created_at: string
    updated_at: string
    last_message_at: string
    last_message_preview: string | null
    participants: ConversationParticipant[]
    unread_count?: number
}

export interface DirectMessage {
    id: string
    conversation_id: string
    sender_id: string | null
    content: string
    is_deleted: boolean
    created_at: string
    updated_at: string
    sender?: {
        id: string
        full_name: string
        nickname: string | null
        photo_url: string | null
    }
}

export interface UserSearchResult {
    id: string
    full_name: string
    nickname: string | null
    photo_url: string | null
    church_name?: string
}

// Helper function to transform Supabase response to Conversation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformConversation(data: any): Conversation {
    return {
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_message_at: data.last_message_at,
        last_message_preview: data.last_message_preview,
        unread_count: data.unread_count || 0,
        participants: (data.participants || []).map((p: any) => ({
            id: p.id,
            profile_id: p.profile_id,
            joined_at: p.joined_at,
            last_read_at: p.last_read_at,
            is_muted: p.is_muted,
            profile: Array.isArray(p.profile) ? p.profile[0] : p.profile
        }))
    }
}

// Helper function to transform Supabase response to DirectMessage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformMessage(data: any): DirectMessage {
    return {
        id: data.id,
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        content: data.content,
        is_deleted: data.is_deleted,
        created_at: data.created_at,
        updated_at: data.updated_at,
        sender: Array.isArray(data.sender) ? data.sender[0] : data.sender
    }
}

// ============================================
// NICKNAME ACTIONS
// ============================================

/**
 * Check if a nickname is available
 */
export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
    if (!nickname || nickname.length < 3) return false

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Normalize nickname (lowercase, no spaces)
    const normalizedNickname = nickname.toLowerCase().trim().replace(/\s+/g, '')

    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('nickname', normalizedNickname)
        .neq('id', user.id)
        .limit(1)

    if (error) {
        console.error('Error checking nickname:', error)
        return false
    }

    return data.length === 0
}

/**
 * Set or update user's nickname
 */
export async function setNickname(nickname: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Não autenticado' }
    }

    // Validate nickname format
    const normalizedNickname = nickname.toLowerCase().trim().replace(/\s+/g, '')

    if (normalizedNickname.length < 3) {
        return { success: false, error: 'Nickname deve ter pelo menos 3 caracteres' }
    }

    if (normalizedNickname.length > 20) {
        return { success: false, error: 'Nickname deve ter no máximo 20 caracteres' }
    }

    if (!/^[a-z0-9_]+$/.test(normalizedNickname)) {
        return { success: false, error: 'Nickname deve conter apenas letras, números e underscore' }
    }

    // Check availability
    const isAvailable = await checkNicknameAvailable(normalizedNickname)
    if (!isAvailable) {
        return { success: false, error: 'Este nickname já está em uso' }
    }

    // Update profile
    const { error } = await supabase
        .from('profiles')
        .update({ nickname: normalizedNickname })
        .eq('id', user.id)

    if (error) {
        console.error('Error setting nickname:', error)
        return { success: false, error: 'Erro ao salvar nickname' }
    }

    revalidatePath('/membro')
    revalidatePath('/ekkle/membro')

    return { success: true }
}

// ============================================
// USER SEARCH ACTIONS
// ============================================

/**
 * Search users by nickname or name
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
    if (!query || query.length < 2) return []

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const searchTerm = `%${query.toLowerCase()}%`

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            nickname,
            photo_url,
            church:churches!profiles_church_id_fkey(name)
        `)
        .or(`nickname.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .neq('id', user.id)
        .eq('is_active', true)
        .limit(20)

    if (error) {
        console.error('Error searching users:', error)
        return []
    }

    return data.map(profile => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const church = profile.church as any
        return {
            id: profile.id,
            full_name: profile.full_name,
            nickname: profile.nickname,
            photo_url: profile.photo_url,
            church_name: church?.name || null
        }
    })
}

// ============================================
// CONVERSATION ACTIONS
// ============================================

/**
 * Get or create a 1-on-1 conversation with another user
 */
export async function getOrCreateConversation(otherUserId: string): Promise<{ id: string } | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Use the database function
    const { data, error } = await supabase
        .rpc('get_or_create_dm_conversation', { other_user_id: otherUserId })

    if (error) {
        console.error('Error getting/creating conversation:', error)
        return null
    }

    return { id: data }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get conversations where user is a participant
    const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', user.id)

    if (partError || !participations) {
        console.error('Error fetching participations:', partError)
        return []
    }

    const conversationIds = participations.map(p => p.conversation_id)

    if (conversationIds.length === 0) return []

    // Get conversations with all participants
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
            id,
            created_at,
            updated_at,
            last_message_at,
            last_message_preview,
            participants:conversation_participants(
                id,
                profile_id,
                joined_at,
                last_read_at,
                is_muted,
                profile:profiles(
                    id,
                    full_name,
                    nickname,
                    photo_url
                )
            )
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false })

    if (error) {
        console.error('Error fetching conversations:', error)
        return []
    }

    // Calculate unread counts and transform data
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
            const transformed = transformConversation(conv)
            const myParticipation = transformed.participants.find(
                p => p.profile_id === user.id
            )

            if (!myParticipation) {
                return { ...transformed, unread_count: 0 }
            }

            // Count unread messages
            const { count } = await supabase
                .from('direct_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .neq('sender_id', user.id)
                .eq('is_deleted', false)
                .gt('created_at', myParticipation.last_read_at || '1970-01-01')

            return { ...transformed, unread_count: count || 0 }
        })
    )

    return conversationsWithUnread
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from('conversations')
        .select(`
            id,
            created_at,
            updated_at,
            last_message_at,
            last_message_preview,
            participants:conversation_participants(
                id,
                profile_id,
                joined_at,
                last_read_at,
                is_muted,
                profile:profiles(
                    id,
                    full_name,
                    nickname,
                    photo_url
                )
            )
        `)
        .eq('id', conversationId)
        .single()

    if (error) {
        console.error('Error fetching conversation:', error)
        return null
    }

    return transformConversation(data)
}

// ============================================
// MESSAGE ACTIONS
// ============================================

/**
 * Get messages for a conversation
 */
export async function getMessages(
    conversationId: string,
    limit = 50,
    offset = 0
): Promise<DirectMessage[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('direct_messages')
        .select(`
            id,
            conversation_id,
            sender_id,
            content,
            is_deleted,
            created_at,
            updated_at,
            sender:profiles!direct_messages_sender_id_fkey(
                id,
                full_name,
                nickname,
                photo_url
            )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    // Reverse to get chronological order and transform
    return data.map(transformMessage).reverse()
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
    conversationId: string,
    content: string
): Promise<DirectMessage | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const trimmedContent = content.trim()
    if (!trimmedContent) return null

    const { data, error } = await supabase
        .from('direct_messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: trimmedContent
        })
        .select(`
            id,
            conversation_id,
            sender_id,
            content,
            is_deleted,
            created_at,
            updated_at,
            sender:profiles!direct_messages_sender_id_fkey(
                id,
                full_name,
                nickname,
                photo_url
            )
        `)
        .single()

    if (error) {
        console.error('Error sending message:', error)
        return null
    }

    return transformMessage(data)
}

/**
 * Mark a conversation as read
 */
export async function markConversationAsRead(conversationId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('profile_id', user.id)

    if (error) {
        console.error('Error marking as read:', error)
        return false
    }

    return true
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await supabase
        .from('direct_messages')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', user.id)

    if (error) {
        console.error('Error deleting message:', error)
        return false
    }

    return true
}

/**
 * Get total unread messages count
 */
export async function getUnreadCount(): Promise<number> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { data, error } = await supabase
        .rpc('get_unread_messages_count', { user_id: user.id })

    if (error) {
        console.error('Error getting unread count:', error)
        return 0
    }

    return data || 0
}

/**
 * Toggle mute for a conversation
 */
export async function toggleMuteConversation(
    conversationId: string,
    muted: boolean
): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await supabase
        .from('conversation_participants')
        .update({ is_muted: muted })
        .eq('conversation_id', conversationId)
        .eq('profile_id', user.id)

    if (error) {
        console.error('Error toggling mute:', error)
        return false
    }

    return true
}
