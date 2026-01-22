'use server'

import { createClient } from '@/lib/supabase/server'
import { EvolutionService } from '@/lib/evolution'
import { getWhatsAppInstance } from './whatsapp'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getProfile } from './auth'

export async function checkLateReports() {
    const profile = await getProfile()
    if (!profile) return { success: false, reminded: 0, error: 'Não autenticado' }
    const churchId = profile.church_id

    const supabase = await createClient()

    // 1. Get WhatsApp instance for the church
    const { data: whatsapp } = await getWhatsAppInstance()
    if (!whatsapp || whatsapp.status !== 'CONNECTED') {
        return { success: false, reminded: 0, error: 'WhatsApp não conectado' }
    }

    // 2. Find meetings started yesterday or before that have no reports
    const yesterday = subDays(new Date(), 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: lateMeetings, error } = await supabase
        .from('cell_meetings')
        .select(`
      *,
      cell:cells (
        name,
        church_id,
        leader:profiles (
          full_name,
          phone
        )
      )
    `)
        .eq('status', 'IN_PROGRESS')
        .lte('date', yesterdayStr)
        .eq('church_id', churchId) // Redundant with RLS but good for clarity

    if (error || !lateMeetings) {
        console.error('[checkLateReports] Error fetching late meetings:', error)
        return { success: false, reminded: 0 }
    }

    let remindedCount = 0

    for (const meeting of lateMeetings) {
        // Check if report exists
        const { data: report } = await supabase
            .from('cell_reports')
            .select('id')
            .eq('meeting_id', meeting.id)
            .single()

        if (!report && meeting.cell?.leader?.phone) {
            try {
                const message = `🚨 *Lembrete de Relatório: ${meeting.cell.name}*\n\nOlá, ${meeting.cell.leader.full_name}! 👋\n\nNotamos que a reunião do dia *${format(new Date(meeting.date), "dd/MM", { locale: ptBR })}* ainda está sem relatório.\n\nPor favor, reserve 1 minutinho para preencher os dados no Ekkle. Isso ajuda muito o acompanhamento da igreja! 🙏❤️`

                await EvolutionService.sendText(whatsapp.instance_name, meeting.cell.leader.phone, message)
                remindedCount++
            } catch (err) {
                console.error(`Failed to send late report reminder to ${meeting.cell.leader.phone}:`, err)
            }
        }
    }

    return { success: true, reminded: remindedCount }
}
