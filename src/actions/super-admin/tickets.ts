'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES
// =====================================================

export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug' | 'account' | 'other'

export interface Ticket {
    id: string
    ticket_number: number
    requester_id: string | null
    requester_email: string | null
    requester_name: string | null
    church_id: string | null
    assigned_to: string | null
    subject: string
    description: string | null
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory | null
    tags: string[]
    first_response_at: string | null
    resolved_at: string | null
    closed_at: string | null
    source: string
    created_at: string
    updated_at: string
    // Joined data
    requester?: {
        id: string
        full_name: string
        email: string
        avatar_url: string | null
    }
    church?: {
        id: string
        name: string
        slug: string
    }
    assigned_admin?: {
        id: string
        full_name: string
        email: string
    }
    message_count?: number
    last_message_at?: string
}

export interface TicketMessage {
    id: string
    ticket_id: string
    sender_id: string | null
    sender_type: 'admin' | 'user' | 'system'
    sender_name: string | null
    content: string
    content_type: 'text' | 'html' | 'markdown'
    attachments: Array<{
        name: string
        url: string
        size: number
        type: string
    }>
    is_internal: boolean
    is_first_response: boolean
    created_at: string
    // Joined
    sender?: {
        id: string
        full_name: string
        email: string
        avatar_url: string | null
    }
}

export interface TicketFilters {
    status?: TicketStatus | 'all'
    priority?: TicketPriority | 'all'
    category?: TicketCategory | 'all'
    assignedTo?: string | 'unassigned' | 'all'
    churchId?: string
    search?: string
    page?: number
    limit?: number
}

export interface TicketStats {
    total: number
    open: number
    in_progress: number
    waiting_response: number
    resolved: number
    urgent: number
    high_priority: number
    avg_first_response_hours: number | null
    avg_resolution_hours: number | null
    tickets_last_24h: number
    tickets_last_7d: number
}

// =====================================================
// GET TICKETS
// =====================================================

export async function getTickets(filters: TicketFilters = {}): Promise<{
    tickets: Ticket[]
    total: number
    page: number
    totalPages: number
}> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const {
        status = 'all',
        priority = 'all',
        category = 'all',
        assignedTo = 'all',
        churchId,
        search,
        page = 1,
        limit = 20
    } = filters

    let query = supabase
        .from('support_tickets')
        .select(`
            *,
            requester:profiles!support_tickets_requester_id_fkey(id, full_name, email, avatar_url),
            church:churches!support_tickets_church_id_fkey(id, name, slug),
            assigned_admin:profiles!support_tickets_assigned_to_fkey(id, full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

    // Apply filters
    if (status !== 'all') {
        query = query.eq('status', status)
    }

    if (priority !== 'all') {
        query = query.eq('priority', priority)
    }

    if (category !== 'all') {
        query = query.eq('category', category)
    }

    if (assignedTo === 'unassigned') {
        query = query.is('assigned_to', null)
    } else if (assignedTo !== 'all') {
        query = query.eq('assigned_to', assignedTo)
    }

    if (churchId) {
        query = query.eq('church_id', churchId)
    }

    if (search) {
        query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%,requester_email.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching tickets:', error)
        throw new Error('Falha ao buscar tickets')
    }

    // Get message counts
    const ticketIds = data?.map(t => t.id) || []
    let messageCounts: Record<string, { count: number; last_at: string | null }> = {}

    if (ticketIds.length > 0) {
        const { data: messages } = await supabase
            .from('ticket_messages')
            .select('ticket_id, created_at')
            .in('ticket_id', ticketIds)

        if (messages) {
            messageCounts = messages.reduce((acc, msg) => {
                if (!msg.ticket_id) {
                    return acc
                }

                if (!acc[msg.ticket_id]) {
                    acc[msg.ticket_id] = { count: 0, last_at: null }
                }

                acc[msg.ticket_id].count++

                const lastAt = acc[msg.ticket_id].last_at
                const createdAt = msg.created_at ?? null

                if (!lastAt) {
                    acc[msg.ticket_id].last_at = createdAt
                } else if (createdAt && createdAt > lastAt) {
                    acc[msg.ticket_id].last_at = createdAt
                }

                return acc
            }, {} as Record<string, { count: number; last_at: string | null }>)
        }
    }

    const tickets = (data || []).map(ticket => ({
        ...ticket,
        message_count: messageCounts[ticket.id]?.count || 0,
        last_message_at: messageCounts[ticket.id]?.last_at || null
    }))

    return {
        tickets,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

// =====================================================
// GET SINGLE TICKET
// =====================================================

export async function getTicket(ticketId: string): Promise<Ticket | null> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('support_tickets')
        .select(`
            *,
            requester:profiles!support_tickets_requester_id_fkey(id, full_name, email, avatar_url),
            church:churches!support_tickets_church_id_fkey(id, name, slug),
            assigned_admin:profiles!support_tickets_assigned_to_fkey(id, full_name, email)
        `)
        .eq('id', ticketId)
        .single()

    if (error) {
        console.error('Error fetching ticket:', error)
        return null
    }

    return data
}

// =====================================================
// GET TICKET MESSAGES
// =====================================================

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
            *,
            sender:profiles!ticket_messages_sender_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching ticket messages:', error)
        throw new Error('Falha ao buscar mensagens')
    }

    return data || []
}

// =====================================================
// CREATE TICKET
// =====================================================

export async function createTicket(data: {
    subject: string
    description?: string
    priority?: TicketPriority
    category?: TicketCategory
    churchId?: string
    requesterId?: string
    requesterEmail?: string
    requesterName?: string
    tags?: string[]
}): Promise<Ticket> {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
            subject: data.subject,
            description: data.description,
            priority: data.priority || 'medium',
            category: data.category,
            church_id: data.churchId,
            requester_id: data.requesterId,
            requester_email: data.requesterEmail,
            requester_name: data.requesterName,
            tags: data.tags || [],
            source: 'admin_panel'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating ticket:', error)
        throw new Error('Falha ao criar ticket')
    }

    await logAdminAction('ticket.create', 'ticket', {
        targetId: ticket.id,
        reason: `Ticket #${ticket.ticket_number} criado: ${data.subject}`
    })

    revalidatePath('/admin/support')
    return ticket
}

// =====================================================
// UPDATE TICKET
// =====================================================

export async function updateTicket(
    ticketId: string,
    data: {
        status?: TicketStatus
        priority?: TicketPriority
        category?: TicketCategory
        assignedTo?: string | null
        tags?: string[]
    }
): Promise<void> {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    // Get current ticket for logging
    const { data: currentTicket } = await supabase
        .from('support_tickets')
        .select('ticket_number, status, priority, assigned_to')
        .eq('id', ticketId)
        .single()

    const updateData: Record<string, unknown> = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.category !== undefined) updateData.category = data.category
    if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo
    if (data.tags !== undefined) updateData.tags = data.tags

    const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)

    if (error) {
        console.error('Error updating ticket:', error)
        throw new Error('Falha ao atualizar ticket')
    }

    // Log specific changes
    const changes: string[] = []
    if (data.status && data.status !== currentTicket?.status) {
        changes.push(`status: ${currentTicket?.status} -> ${data.status}`)
    }
    if (data.priority && data.priority !== currentTicket?.priority) {
        changes.push(`prioridade: ${currentTicket?.priority} -> ${data.priority}`)
    }
    if (data.assignedTo !== undefined && data.assignedTo !== currentTicket?.assigned_to) {
        changes.push(`atribuido: ${data.assignedTo || 'ninguem'}`)
    }

    await logAdminAction('ticket.update', 'ticket', {
        targetId: ticketId,
        reason: `Ticket #${currentTicket?.ticket_number} atualizado: ${changes.join(', ')}`
    })

    revalidatePath('/admin/support')
    revalidatePath(`/admin/support/${ticketId}`)
}

// =====================================================
// ADD MESSAGE TO TICKET
// =====================================================

export async function addTicketMessage(
    ticketId: string,
    content: string,
    options: {
        isInternal?: boolean
        attachments?: Array<{ name: string; url: string; size: number; type: string }>
    } = {}
): Promise<TicketMessage> {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    // Get admin profile for sender name
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', admin.id)
        .single()

    const { data: message, error } = await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: admin.id,
            sender_type: 'admin',
            sender_name: profile?.full_name || 'Admin',
            content,
            is_internal: options.isInternal || false,
            attachments: options.attachments || []
        })
        .select(`
            *,
            sender:profiles!ticket_messages_sender_id_fkey(id, full_name, email, avatar_url)
        `)
        .single()

    if (error) {
        console.error('Error adding message:', error)
        throw new Error('Falha ao enviar mensagem')
    }

    // If not internal and ticket was waiting_response, set to in_progress
    if (!options.isInternal) {
        const { data: ticket } = await supabase
            .from('support_tickets')
            .select('status, ticket_number')
            .eq('id', ticketId)
            .single()

        if (ticket?.status === 'waiting_response') {
            await supabase
                .from('support_tickets')
                .update({ status: 'in_progress' })
                .eq('id', ticketId)
        }

        await logAdminAction('ticket.reply', 'ticket', {
            targetId: ticketId,
            reason: `Resposta enviada no ticket #${ticket?.ticket_number}`
        })
    }

    revalidatePath(`/admin/support/${ticketId}`)
    return message
}

// =====================================================
// ASSIGN TICKET
// =====================================================

export async function assignTicket(ticketId: string, adminId: string | null): Promise<void> {
    await updateTicket(ticketId, { assignedTo: adminId })
}

// =====================================================
// CHANGE TICKET STATUS
// =====================================================

export async function changeTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    await updateTicket(ticketId, { status })
}

// =====================================================
// CHANGE TICKET PRIORITY
// =====================================================

export async function changeTicketPriority(ticketId: string, priority: TicketPriority): Promise<void> {
    await updateTicket(ticketId, { priority })
}

// =====================================================
// GET TICKET STATS
// =====================================================

export async function getTicketStats(): Promise<TicketStats> {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get counts by status
    const { data: tickets } = await supabase
        .from('support_tickets')
        .select('status, priority, first_response_at, resolved_at, created_at')

    if (!tickets) {
        return {
            total: 0,
            open: 0,
            in_progress: 0,
            waiting_response: 0,
            resolved: 0,
            urgent: 0,
            high_priority: 0,
            avg_first_response_hours: null,
            avg_resolution_hours: null,
            tickets_last_24h: 0,
            tickets_last_7d: 0
        }
    }

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Calculate averages
    const withFirstResponse = tickets.filter(t => t.first_response_at)
    const withResolution = tickets.filter(t => t.resolved_at)

    const avgFirstResponse = withFirstResponse.length > 0
        ? withFirstResponse.reduce((sum, t) => {
            const created = new Date(t.created_at).getTime()
            const responded = new Date(t.first_response_at!).getTime()
            return sum + (responded - created) / (1000 * 60 * 60)
        }, 0) / withFirstResponse.length
        : null

    const avgResolution = withResolution.length > 0
        ? withResolution.reduce((sum, t) => {
            const created = new Date(t.created_at).getTime()
            const resolved = new Date(t.resolved_at!).getTime()
            return sum + (resolved - created) / (1000 * 60 * 60)
        }, 0) / withResolution.length
        : null

    return {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        waiting_response: tickets.filter(t => t.status === 'waiting_response').length,
        resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        high_priority: tickets.filter(t => t.priority === 'high').length,
        avg_first_response_hours: avgFirstResponse ? Math.round(avgFirstResponse * 10) / 10 : null,
        avg_resolution_hours: avgResolution ? Math.round(avgResolution * 10) / 10 : null,
        tickets_last_24h: tickets.filter(t => new Date(t.created_at) > last24h).length,
        tickets_last_7d: tickets.filter(t => new Date(t.created_at) > last7d).length
    }
}

// =====================================================
// GET ADMINS FOR ASSIGNMENT
// =====================================================

export async function getAdminsForAssignment(): Promise<Array<{ id: string; full_name: string; email: string }>> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'SUPER_ADMIN')
        .order('full_name')

    if (error) {
        console.error('Error fetching admins:', error)
        return []
    }

    return data || []
}
