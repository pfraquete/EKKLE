'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { EvolutionService } from '@/lib/evolution'

// =====================================================
// TYPES
// =====================================================

export type CommunicationChannel = 'email' | 'whatsapp' | 'both' | 'in_app'
export type CommunicationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'partially_sent' | 'failed'
export type TargetType = 'all_churches' | 'specific_churches' | 'specific_users' | 'by_plan' | 'by_status'
export type TemplateCategory = 'support' | 'billing' | 'notification' | 'marketing' | 'system'

export interface Communication {
    id: string
    created_by: string
    title: string
    subject: string | null
    content: string
    content_type: 'text' | 'html' | 'markdown'
    channel: CommunicationChannel
    target_type: TargetType
    target_filter: Record<string, unknown>
    target_ids: string[]
    status: CommunicationStatus
    scheduled_at: string | null
    sent_at: string | null
    total_recipients: number
    delivered_count: number
    failed_count: number
    opened_count: number
    delivery_details: Array<{
        recipient_id: string
        channel: string
        status: string
        sent_at: string
        error?: string
    }>
    created_at: string
    updated_at: string
    // Joined
    creator?: {
        id: string
        full_name: string
        email: string
    }
}

export interface CommunicationTemplate {
    id: string
    name: string
    slug: string | null
    description: string | null
    subject: string | null
    content: string
    content_type: 'text' | 'html' | 'markdown'
    channel: CommunicationChannel
    variables: Array<{
        name: string
        description: string
        default_value?: string
    }>
    category: TemplateCategory | null
    is_active: boolean
    is_system: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface CommunicationRecipient {
    id: string
    email: string
    phone: string | null
    full_name: string
    church_id: string | null
    church_name?: string
}

// =====================================================
// HELPERS
// =====================================================

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        throw new Error('RESEND_API_KEY not configured')
    }
    return new Resend(apiKey)
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
}

// =====================================================
// GET COMMUNICATIONS
// =====================================================

export async function getCommunications(filters: {
    status?: CommunicationStatus | 'all'
    channel?: CommunicationChannel | 'all'
    search?: string
    page?: number
    limit?: number
} = {}): Promise<{
    communications: Communication[]
    total: number
    page: number
    totalPages: number
}> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const {
        status = 'all',
        channel = 'all',
        search,
        page = 1,
        limit = 20
    } = filters

    let query = supabase
        .from('admin_communications')
        .select(`
            *,
            creator:profiles!admin_communications_created_by_fkey(id, full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

    if (status !== 'all') {
        query = query.eq('status', status)
    }

    if (channel !== 'all') {
        query = query.eq('channel', channel)
    }

    if (search) {
        query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching communications:', error)
        throw new Error('Falha ao buscar comunicacoes')
    }

    return {
        communications: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

// =====================================================
// GET SINGLE COMMUNICATION
// =====================================================

export async function getCommunication(id: string): Promise<Communication | null> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('admin_communications')
        .select(`
            *,
            creator:profiles!admin_communications_created_by_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching communication:', error)
        return null
    }

    return data
}

// =====================================================
// CREATE COMMUNICATION (DRAFT)
// =====================================================

export async function createCommunication(data: {
    title: string
    subject?: string
    content: string
    channel: CommunicationChannel
    targetType: TargetType
    targetFilter?: Record<string, unknown>
    targetIds?: string[]
    scheduledAt?: string
}): Promise<Communication> {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    const { data: communication, error } = await supabase
        .from('admin_communications')
        .insert({
            created_by: admin.id,
            title: data.title,
            subject: data.subject,
            content: data.content,
            channel: data.channel,
            target_type: data.targetType,
            target_filter: data.targetFilter || {},
            target_ids: data.targetIds || [],
            status: data.scheduledAt ? 'scheduled' : 'draft',
            scheduled_at: data.scheduledAt
        })
        .select(`
            *,
            creator:profiles!admin_communications_created_by_fkey(id, full_name, email)
        `)
        .single()

    if (error) {
        console.error('Error creating communication:', error)
        throw new Error('Falha ao criar comunicacao')
    }

    await logAdminAction({
        action: 'create',
        targetType: 'communication',
        targetId: communication.id,
        description: `Comunicacao criada: ${data.title}`,
        metadata: { channel: data.channel, target_type: data.targetType }
    })

    revalidatePath('/admin/support/communications')
    return communication
}

// =====================================================
// GET RECIPIENTS BY FILTER
// =====================================================

export async function getRecipientsByFilter(
    targetType: TargetType,
    targetFilter: Record<string, unknown> = {},
    targetIds: string[] = []
): Promise<CommunicationRecipient[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    let recipients: CommunicationRecipient[] = []

    switch (targetType) {
        case 'all_churches': {
            // Get all pastors
            const { data } = await supabase
                .from('profiles')
                .select(`
                    id, email, phone, full_name, church_id,
                    church:churches!profiles_church_id_fkey(name)
                `)
                .eq('role', 'PASTOR')

            recipients = (data || []).map(p => ({
                id: p.id,
                email: p.email,
                phone: p.phone,
                full_name: p.full_name,
                church_id: p.church_id,
                church_name: p.church?.name
            }))
            break
        }

        case 'specific_churches': {
            const churchIds = targetIds.length > 0 ? targetIds : (targetFilter.church_ids as string[]) || []
            if (churchIds.length === 0) break

            const { data } = await supabase
                .from('profiles')
                .select(`
                    id, email, phone, full_name, church_id,
                    church:churches!profiles_church_id_fkey(name)
                `)
                .eq('role', 'PASTOR')
                .in('church_id', churchIds)

            recipients = (data || []).map(p => ({
                id: p.id,
                email: p.email,
                phone: p.phone,
                full_name: p.full_name,
                church_id: p.church_id,
                church_name: p.church?.name
            }))
            break
        }

        case 'specific_users': {
            const userIds = targetIds.length > 0 ? targetIds : (targetFilter.user_ids as string[]) || []
            if (userIds.length === 0) break

            const { data } = await supabase
                .from('profiles')
                .select(`
                    id, email, phone, full_name, church_id,
                    church:churches!profiles_church_id_fkey(name)
                `)
                .in('id', userIds)

            recipients = (data || []).map(p => ({
                id: p.id,
                email: p.email,
                phone: p.phone,
                full_name: p.full_name,
                church_id: p.church_id,
                church_name: p.church?.name
            }))
            break
        }

        case 'by_plan': {
            const planId = targetFilter.plan_id as string
            if (!planId) break

            // Get churches with this plan, then their pastors
            const { data: subscriptions } = await supabase
                .from('subscriptions')
                .select('church_id')
                .eq('plan_id', planId)
                .eq('status', 'active')

            if (subscriptions && subscriptions.length > 0) {
                const churchIds = subscriptions.map(s => s.church_id)

                const { data } = await supabase
                    .from('profiles')
                    .select(`
                        id, email, phone, full_name, church_id,
                        church:churches!profiles_church_id_fkey(name)
                    `)
                    .eq('role', 'PASTOR')
                    .in('church_id', churchIds)

                recipients = (data || []).map(p => ({
                    id: p.id,
                    email: p.email,
                    phone: p.phone,
                    full_name: p.full_name,
                    church_id: p.church_id,
                    church_name: p.church?.name
                }))
            }
            break
        }

        case 'by_status': {
            const churchStatus = targetFilter.status as string
            if (!churchStatus) break

            const { data: churches } = await supabase
                .from('churches')
                .select('id')
                .eq('status', churchStatus)

            if (churches && churches.length > 0) {
                const churchIds = churches.map(c => c.id)

                const { data } = await supabase
                    .from('profiles')
                    .select(`
                        id, email, phone, full_name, church_id,
                        church:churches!profiles_church_id_fkey(name)
                    `)
                    .eq('role', 'PASTOR')
                    .in('church_id', churchIds)

                recipients = (data || []).map(p => ({
                    id: p.id,
                    email: p.email,
                    phone: p.phone,
                    full_name: p.full_name,
                    church_id: p.church_id,
                    church_name: p.church?.name
                }))
            }
            break
        }
    }

    return recipients
}

// =====================================================
// SEND COMMUNICATION
// =====================================================

export async function sendCommunication(communicationId: string): Promise<{
    success: boolean
    delivered: number
    failed: number
    errors: string[]
}> {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    // Get communication
    const { data: communication, error } = await supabase
        .from('admin_communications')
        .select('*')
        .eq('id', communicationId)
        .single()

    if (error || !communication) {
        throw new Error('Comunicacao nao encontrada')
    }

    if (communication.status === 'sent' || communication.status === 'sending') {
        throw new Error('Comunicacao ja foi enviada ou esta em andamento')
    }

    // Get recipients
    const recipients = await getRecipientsByFilter(
        communication.target_type as TargetType,
        communication.target_filter as Record<string, unknown>,
        communication.target_ids || []
    )

    if (recipients.length === 0) {
        throw new Error('Nenhum destinatario encontrado')
    }

    // Update status to sending
    await supabase
        .from('admin_communications')
        .update({
            status: 'sending',
            total_recipients: recipients.length
        })
        .eq('id', communicationId)

    const deliveryDetails: Array<{
        recipient_id: string
        channel: string
        status: string
        sent_at: string
        error?: string
    }> = []

    let delivered = 0
    let failed = 0
    const errors: string[] = []

    // Send to each recipient
    for (const recipient of recipients) {
        const variables: Record<string, string> = {
            nome: recipient.full_name?.split(' ')[0] || 'Pastor',
            pastor_name: recipient.full_name || 'Pastor',
            church_name: recipient.church_name || 'sua igreja',
            email: recipient.email,
            app_url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.ekkle.com.br'
        }

        const personalizedContent = replaceVariables(communication.content, variables)
        const personalizedSubject = communication.subject
            ? replaceVariables(communication.subject, variables)
            : communication.title

        const channel = communication.channel as CommunicationChannel

        // Send via email
        if (channel === 'email' || channel === 'both') {
            try {
                const resend = getResendClient()
                await resend.emails.send({
                    from: process.env.FROM_EMAIL || 'EKKLE <suporte@ekkle.com.br>',
                    to: recipient.email,
                    subject: personalizedSubject,
                    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        ${communication.content_type === 'html' ? personalizedContent : `<p>${escapeHtml(personalizedContent).replace(/\n/g, '<br>')}</p>`}
                        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            Esta mensagem foi enviada pela equipe EKKLE.
                        </p>
                    </div>`
                })

                deliveryDetails.push({
                    recipient_id: recipient.id,
                    channel: 'email',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                })
                delivered++
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
                deliveryDetails.push({
                    recipient_id: recipient.id,
                    channel: 'email',
                    status: 'failed',
                    sent_at: new Date().toISOString(),
                    error: errorMsg
                })
                errors.push(`Email para ${recipient.email}: ${errorMsg}`)
                failed++
            }
        }

        // Send via WhatsApp
        if ((channel === 'whatsapp' || channel === 'both') && recipient.phone) {
            try {
                // Get EKKLE's WhatsApp instance (admin instance)
                const { data: instance } = await supabase
                    .from('whatsapp_instances')
                    .select('instance_name, status')
                    .eq('status', 'CONNECTED')
                    .limit(1)
                    .single()

                if (instance) {
                    // Format phone number
                    const phone = recipient.phone.replace(/\D/g, '')
                    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`

                    await EvolutionService.sendText(
                        instance.instance_name,
                        formattedPhone,
                        personalizedContent
                    )

                    deliveryDetails.push({
                        recipient_id: recipient.id,
                        channel: 'whatsapp',
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    delivered++
                } else {
                    deliveryDetails.push({
                        recipient_id: recipient.id,
                        channel: 'whatsapp',
                        status: 'failed',
                        sent_at: new Date().toISOString(),
                        error: 'Nenhuma instancia WhatsApp conectada'
                    })
                    errors.push(`WhatsApp para ${recipient.phone}: Nenhuma instancia conectada`)
                    failed++
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
                deliveryDetails.push({
                    recipient_id: recipient.id,
                    channel: 'whatsapp',
                    status: 'failed',
                    sent_at: new Date().toISOString(),
                    error: errorMsg
                })
                errors.push(`WhatsApp para ${recipient.phone}: ${errorMsg}`)
                failed++
            }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Update communication with results
    const finalStatus = failed === 0 ? 'sent' : (delivered > 0 ? 'partially_sent' : 'failed')

    await supabase
        .from('admin_communications')
        .update({
            status: finalStatus,
            sent_at: new Date().toISOString(),
            delivered_count: delivered,
            failed_count: failed,
            delivery_details: deliveryDetails
        })
        .eq('id', communicationId)

    await logAdminAction({
        action: 'send',
        targetType: 'communication',
        targetId: communicationId,
        description: `Comunicacao enviada: ${delivered} entregues, ${failed} falharam`,
        metadata: { delivered, failed, total: recipients.length }
    })

    revalidatePath('/admin/support/communications')
    revalidatePath(`/admin/support/communications/${communicationId}`)

    return {
        success: failed === 0,
        delivered,
        failed,
        errors
    }
}

// =====================================================
// DELETE COMMUNICATION
// =====================================================

export async function deleteCommunication(id: string): Promise<void> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: communication } = await supabase
        .from('admin_communications')
        .select('title, status')
        .eq('id', id)
        .single()

    if (communication?.status === 'sending') {
        throw new Error('Nao e possivel deletar uma comunicacao em andamento')
    }

    const { error } = await supabase
        .from('admin_communications')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting communication:', error)
        throw new Error('Falha ao deletar comunicacao')
    }

    await logAdminAction({
        action: 'delete',
        targetType: 'communication',
        targetId: id,
        description: `Comunicacao deletada: ${communication?.title}`
    })

    revalidatePath('/admin/support/communications')
}

// =====================================================
// TEMPLATES
// =====================================================

export async function getTemplates(filters: {
    channel?: CommunicationChannel | 'all'
    category?: TemplateCategory | 'all'
    activeOnly?: boolean
} = {}): Promise<CommunicationTemplate[]> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { channel = 'all', category = 'all', activeOnly = true } = filters

    let query = supabase
        .from('communication_templates')
        .select('*')
        .order('name')

    if (channel !== 'all') {
        query = query.or(`channel.eq.${channel},channel.eq.both`)
    }

    if (category !== 'all') {
        query = query.eq('category', category)
    }

    if (activeOnly) {
        query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching templates:', error)
        throw new Error('Falha ao buscar templates')
    }

    return data || []
}

export async function getTemplate(id: string): Promise<CommunicationTemplate | null> {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching template:', error)
        return null
    }

    return data
}

export async function createTemplate(data: {
    name: string
    slug?: string
    description?: string
    subject?: string
    content: string
    channel: CommunicationChannel
    category?: TemplateCategory
    variables?: Array<{ name: string; description: string; default_value?: string }>
}): Promise<CommunicationTemplate> {
    const admin = await requireSuperAdmin()
    const supabase = await createClient()

    const { data: template, error } = await supabase
        .from('communication_templates')
        .insert({
            name: data.name,
            slug: data.slug,
            description: data.description,
            subject: data.subject,
            content: data.content,
            channel: data.channel,
            category: data.category,
            variables: data.variables || [],
            created_by: admin.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating template:', error)
        throw new Error('Falha ao criar template')
    }

    await logAdminAction({
        action: 'create',
        targetType: 'template',
        targetId: template.id,
        description: `Template criado: ${data.name}`
    })

    revalidatePath('/admin/support/communications/templates')
    return template
}

export async function updateTemplate(
    id: string,
    data: {
        name?: string
        description?: string
        subject?: string
        content?: string
        channel?: CommunicationChannel
        category?: TemplateCategory
        variables?: Array<{ name: string; description: string; default_value?: string }>
        is_active?: boolean
    }
): Promise<void> {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Check if it's a system template
    const { data: template } = await supabase
        .from('communication_templates')
        .select('is_system, name')
        .eq('id', id)
        .single()

    if (template?.is_system) {
        throw new Error('Templates do sistema nao podem ser editados')
    }

    const { error } = await supabase
        .from('communication_templates')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Error updating template:', error)
        throw new Error('Falha ao atualizar template')
    }

    await logAdminAction({
        action: 'update',
        targetType: 'template',
        targetId: id,
        description: `Template atualizado: ${template?.name}`
    })

    revalidatePath('/admin/support/communications/templates')
}

export async function deleteTemplate(id: string): Promise<void> {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Check if it's a system template
    const { data: template } = await supabase
        .from('communication_templates')
        .select('is_system, name')
        .eq('id', id)
        .single()

    if (template?.is_system) {
        throw new Error('Templates do sistema nao podem ser deletados')
    }

    const { error } = await supabase
        .from('communication_templates')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting template:', error)
        throw new Error('Falha ao deletar template')
    }

    await logAdminAction({
        action: 'delete',
        targetType: 'template',
        targetId: id,
        description: `Template deletado: ${template?.name}`
    })

    revalidatePath('/admin/support/communications/templates')
}

// =====================================================
// QUICK SEND (for simple messages)
// =====================================================

export async function quickSendEmail(
    to: string,
    subject: string,
    content: string
): Promise<{ success: boolean; error?: string }> {
    await requireSuperAdmin()

    try {
        const resend = getResendClient()
        await resend.emails.send({
            from: process.env.FROM_EMAIL || 'EKKLE <suporte@ekkle.com.br>',
            to,
            subject,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>
                <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                    Esta mensagem foi enviada pela equipe EKKLE.
                </p>
            </div>`
        })

        return { success: true }
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
        return { success: false, error: errorMsg }
    }
}

export async function quickSendWhatsApp(
    phone: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    await requireSuperAdmin()
    const supabase = await createClient()

    try {
        // Get EKKLE's WhatsApp instance
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('instance_name, status')
            .eq('status', 'CONNECTED')
            .limit(1)
            .single()

        if (!instance) {
            return { success: false, error: 'Nenhuma instancia WhatsApp conectada' }
        }

        // Format phone
        const formattedPhone = phone.replace(/\D/g, '')
        const fullPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`

        await EvolutionService.sendText(
            instance.instance_name,
            fullPhone,
            message
        )

        return { success: true }
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
        return { success: false, error: errorMsg }
    }
}
