'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EvolutionService } from '@/lib/evolution'
import { getWhatsAppInstance } from './whatsapp'
import { getProfile } from './auth'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendTomorrowReminders() {
    const supabase = await createClient()

    // 1. Get meetings for tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: meetings, error: meetingsError } = await supabase
        .from('cell_meetings')
        .select(`
            *,
            cell:cells (
                name,
                address,
                meeting_time,
                church:churches (name)
            )
        `)
        .eq('date', tomorrowStr)

    if (meetingsError || !meetings) {
        console.error('[sendTomorrowReminders] Error fetching meetings:', meetingsError)
        return { success: false, sent: 0 }
    }

    let sentCount = 0

    for (const meeting of meetings) {
        // 2. Get members of this cell
        const { data: members } = await supabase
            .from('profiles')
            .select('email, full_name, phone')
            .eq('cell_id', meeting.cell_id)
            .eq('is_active', true)
            .not('email', 'is', null)

        const { data: congregationMembers } = await supabase
            .from('members')
            .select('email, full_name, phone')
            .eq('cell_id', meeting.cell_id)
            .eq('is_active', true)
            .not('email', 'is', null)

        const allEmails = [
            ...(members || []),
            ...(congregationMembers || [])
        ]

        const { data: whatsapp } = await getWhatsAppInstance()

        for (const recipient of allEmails) {
            // Priority: WhatsApp if connected, otherwise Email
            let sentViaWhatsapp = false

            if (whatsapp?.status === 'CONNECTED' && recipient.phone) {
                try {
                    const message = `🙏 *Lembrete: Reunião da ${meeting.cell.name} Amanhã!*\n\nOlá, ${recipient.full_name}! 👋\n\nPassando para lembrar da nossa reunião de célula amanhã.\n\n📍 *Local:* ${meeting.cell.address || 'Consultar com o líder'}\n⏰ *Horário:* ${meeting.cell.meeting_time || '19:30'}\n📅 *Data:* ${format(new Date(meeting.date), "EEEE, d 'de' MMMM", { locale: ptBR })}\n\nEsperamos por você! ❤️`

                    await EvolutionService.sendText(whatsapp.instance_name, recipient.phone, message)
                    sentViaWhatsapp = true
                    sentCount++
                } catch (err) {
                    console.error(`Failed to send WhatsApp to ${recipient.phone}:`, err)
                }
            }

            if (!sentViaWhatsapp && recipient.email) {
                try {
                    await resend.emails.send({
                        from: 'Ekkle <contato@ekkle.com.br>',
                        to: recipient.email,
                        subject: `🙏 Lembrete: Reunião da ${meeting.cell.name} Amanhã!`,
                        html: `
                            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 20px;">
                                <h2 style="color: #4f46e5;">Olá, ${recipient.full_name}!</h2>
                                <p>Passando para lembrar da nossa reunião de célula amanhã.</p>
                                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Célula:</strong> ${meeting.cell.name}</p>
                                    <p style="margin: 5px 0;"><strong>Data:</strong> ${format(new Date(meeting.date), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                                    <p style="margin: 5px 0;"><strong>Horário:</strong> ${meeting.cell.meeting_time || '19:30'}</p>
                                    <p style="margin: 5px 0;"><strong>Local:</strong> ${meeting.cell.address || 'Consultar com o líder'}</p>
                                </div>
                                <p>Esperamos por você!</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-size: 12px; color: #999; text-align: center;">${meeting.cell.church.name} • Ekkle</p>
                            </div>
                        `
                    })
                    sentCount++
                } catch (err) {
                    console.error(`Failed to send email to ${recipient.email}:`, err)
                }
            }
        }
    }

    return { success: true, sent: sentCount }
}

export async function sendBirthdayGreetings() {
    const supabase = await createClient()
    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1 // 1-indexed for SQL

    // 1. Get all churces with WhatsApp connected
    const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('status', 'CONNECTED')

    if (!instances || instances.length === 0) return { success: true, sent: 0 }

    let totalSent = 0

    for (const instance of instances) {
        // 2. Get custom birthday template or use default
        const { data: template } = await supabase
            .from('message_templates')
            .select('content')
            .eq('church_id', instance.church_id)
            .eq('category', 'BIRTHDAY')
            .eq('is_active', true)
            .single()

        const defaultTemplate = "Parabéns {nome}! 🎂 Que Deus te abençoe muito neste novo ano de vida! 🎉"
        const finalTemplate = template?.content || defaultTemplate

        // 3. Find profiles with birthday today
        const { data: profiles } = await supabase
            .from('profiles')
            .select('full_name, phone, birthday')
            .eq('church_id', instance.church_id)
            .not('phone', 'is', null)
            // Postgres month/day extraction
            .filter('birthday', 'not.is', null)

        // 4. Find members with birthday today
        const { data: members } = await supabase
            .from('members')
            .select('full_name, phone, birthday')
            .eq('church_id', instance.church_id)
            .not('phone', 'is', null)
            .filter('birthday', 'not.is', null)

        // Filter by day/month in JS (easier than complex SQL filters for cross-platform/mock compat)
        const birthdayPeople = [
            ...(profiles || []),
            ...(members || [])
        ].filter(person => {
            if (!person.birthday) return false
            const b = new Date(person.birthday)
            return b.getDate() === day && (b.getMonth() + 1) === month
        })

        for (const person of birthdayPeople) {
            try {
                const message = finalTemplate.replace('{nome}', person.full_name)
                await EvolutionService.sendText(instance.instance_name, person.phone, message)
                totalSent++
            } catch (err) {
                console.error(`Failed to send birthday greeting to ${person.full_name}:`, err)
            }
        }
    }

    return { success: true, sent: totalSent }
}
