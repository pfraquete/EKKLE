'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
            .select('email, full_name')
            .eq('cell_id', meeting.cell_id)
            .eq('is_active', true)
            .not('email', 'is', null)

        const { data: congregationMembers } = await supabase
            .from('members')
            .select('email, full_name')
            .eq('cell_id', meeting.cell_id)
            .eq('is_active', true)
            .not('email', 'is', null)

        const allEmails = [
            ...(members || []),
            ...(congregationMembers || [])
        ]

        for (const recipient of allEmails) {
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

    return { success: true, sent: sentCount }
}
