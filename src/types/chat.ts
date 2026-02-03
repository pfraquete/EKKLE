/**
 * Chat Types
 *
 * Type definitions for the professional chat system including
 * reactions, attachments, presence, typing, and read receipts.
 */

// ============================================
// Reaction Types
// ============================================

export type ReactionType = 'like' | 'love' | 'laugh' | 'sad' | 'wow' | 'pray'

export interface Reaction {
    id: string
    message_id: string
    user_id: string
    reaction: ReactionType
    created_at: string
    user?: {
        id: string
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

export const REACTION_EMOJIS: Record<ReactionType, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    sad: '😢',
    wow: '😮',
    pray: '🙏',
}

// ============================================
// Attachment Types
// ============================================

export type AttachmentType = 'image' | 'document'

export interface Attachment {
    url: string
    type: AttachmentType
    name: string
    size: number
}

export interface AttachmentUpload {
    file: File
    preview?: string
    progress: number
    error?: string
}

// ============================================
// Pinned Message Types
// ============================================

export interface PinnedMessage {
    id: string
    conversation_id: string
    message_id: string
    pinned_by: string
    pinned_at: string
    message?: {
        id: string
        content: string
        sender_id: string
        created_at: string
        sender?: {
            id: string
            full_name: string
            photo_url: string | null
        }
    }
}

// ============================================
// Presence Types
// ============================================

export interface UserPresence {
    id: string
    is_online: boolean
    last_seen_at: string | null
}

export interface PresenceState {
    isOnline: boolean
    lastSeen: Date | null
}

// ============================================
// Typing Indicator Types
// ============================================

export interface TypingUser {
    id: string
    name: string
    started_at: string
}

export interface TypingIndicator {
    id: string
    conversation_id: string
    user_id: string
    started_at: string
    user?: {
        id: string
        full_name: string
    }
}

// ============================================
// Read Receipt Types
// ============================================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ReadReceipt {
    id: string
    message_id: string
    user_id: string
    read_at: string
}

export interface MessageReadStatus {
    messageId: string
    status: MessageStatus
    readBy: { userId: string; readAt: string }[]
}

// ============================================
// Link Preview Types
// ============================================

export interface LinkPreview {
    url: string
    title?: string
    description?: string
    image?: string
    siteName?: string
    favicon?: string
}

export interface LinkPreviewState {
    url: string
    loading: boolean
    data: LinkPreview | null
    error: string | null
}

// ============================================
// Enhanced Message Types
// ============================================

export interface EnhancedDirectMessage {
    id: string
    conversation_id: string
    sender_id: string | null
    content: string
    is_deleted: boolean
    created_at: string
    updated_at: string
    // New fields
    attachment_url: string | null
    attachment_type: AttachmentType | null
    attachment_name: string | null
    attachment_size: number | null
    reply_to_id: string | null
    // Relations
    sender?: {
        id: string
        full_name: string
        nickname: string | null
        photo_url: string | null
    }
    reply_to?: {
        id: string
        content: string
        sender_id: string | null
        sender?: {
            id: string
            full_name: string
        }
    }
    reactions?: Reaction[]
    read_receipts?: ReadReceipt[]
}

// ============================================
// Date Grouping Types
// ============================================

export interface MessageGroup {
    date: Date
    label: string // "Hoje", "Ontem", or formatted date
    messages: EnhancedDirectMessage[]
}

// ============================================
// Chat State Types
// ============================================

export interface ChatState {
    messages: EnhancedDirectMessage[]
    pinnedMessages: PinnedMessage[]
    typingUsers: TypingUser[]
    replyingTo: EnhancedDirectMessage | null
    attachment: AttachmentUpload | null
}

// ============================================
// Utility Types
// ============================================

export type ReactionAction = 'add' | 'remove'

export interface SendMessageOptions {
    content: string
    replyToId?: string
    attachment?: Attachment
}
