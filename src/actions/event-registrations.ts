'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.FROM_EMAIL || 'Ekkle <eventos@resend.dev>'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.up.railway.app'

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmation(registrationId: string) {
    try {
        const supabase = await createClient()

        // Get registration with event and profile data
        const { data: registration, error } = await supabase
            .from('event_registrations')
            .select(`
                *,
                event:events(*),
                profile:profiles(full_name, email),
                church:churches(name)
            `)
            .eq('id', registrationId)
            .single()

        if (error || !registration) {
            console.error('Error fetching registration:', error)
            return { success: false, error: 'Registration not found' }
        }

        const event = registration.event
        const profile = registration.profile
        const church = registration.church

        // Format date and time
        const eventDate = format(new Date(event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        const eventTime = format(new Date(event.start_date), 'HH:mm', { locale: ptBR })

        // Determine location
        const location = event.is_online
            ? `Online: ${event.online_url || 'Link será enviado'}`
            : event.location || 'Local não especificado'

        // Build email content based on registration status
        let statusMessage = ''
        let actionButton = ''

        if (registration.status === 'WAITLIST') {
            statusMessage = `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">⏳ Você está na lista de espera</p>
                    <p style="margin: 8px 0 0 0; color: #92400e;">
                        O evento está com lotação máxima. Você será notificado por email se uma vaga abrir.
                    </p>
                </div>
            `
        } else if (registration.payment_required && registration.payment_status === 'PENDING') {
            statusMessage = `
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #991b1b; font-weight: bold;">⚠️ Pagamento Pendente</p>
                    <p style="margin: 8px 0 0 0; color: #991b1b;">
                        Sua inscrição será confirmada após o pagamento de R$ ${((registration.payment_amount_cents || 0) / 100).toFixed(2)}.
                    </p>
                </div>
            `
            actionButton = `
                <a href="${appUrl}/site/${event.church_id}/eventos/${event.id}/checkout"
                   style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                    Realizar Pagamento
                </a>
            `
        } else {
            statusMessage = `
                <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #065f46; font-weight: bold;">✓ Inscrição Confirmada!</p>
                    <p style="margin: 8px 0 0 0; color: #065f46;">
                        Sua presença está garantida no evento.
                    </p>
                </div>
            `
            actionButton = `
                <a href="${appUrl}/site/${event.church_id}/membro/eventos"
                   style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                    Ver Meus Eventos
                </a>
            `
        }

        // Guest information
        const guestInfo = registration.guest_count > 0
            ? `<p style="margin: 5px 0 0 0;"><strong>Convidados:</strong> ${registration.guest_count} pessoa(s)</p>`
            : ''

        const { error: emailError } = await resend.emails.send({
            from: fromEmail,
            to: profile.email,
            subject: `Inscrição no Evento: ${event.title}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%);">
                        <h1 style="color: white; margin: 0;">${church.name}</h1>
                        <p style="color: #fecdd3; margin: 5px 0 0 0;">Sistema de Eventos</p>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="color: #e11d48; margin-top: 0;">Inscrição Recebida!</h2>
                        <p>Olá, <strong>${profile.full_name}</strong>!</p>
                        <p>Recebemos sua inscrição para o evento:</p>

                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1f2937;">${event.title}</h3>
                            ${event.description ? `<p style="color: #6b7280;">${event.description}</p>` : ''}
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
                            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${eventDate}</p>
                            <p style="margin: 5px 0;"><strong>🕐 Horário:</strong> ${eventTime}</p>
                            <p style="margin: 5px 0;"><strong>📍 Local:</strong> ${location}</p>
                            ${guestInfo}
                        </div>

                        ${statusMessage}

                        ${actionButton}

                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Se você deseja cancelar sua inscrição, acesse sua área de membros.
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280;">© 2026 ${church.name}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
                            Powered by <a href="https://ekkle.com.br" style="color: #e11d48; text-decoration: none;">Ekkle</a>
                        </p>
                    </div>
                </div>
            `,
        })

        if (emailError) {
            console.error('Error sending registration confirmation:', emailError)
            return { success: false, error: emailError }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in sendRegistrationConfirmation:', error)
        return { success: false, error }
    }
}

/**
 * Send cancellation confirmation email
 */
export async function sendCancellationConfirmation(registrationId: string) {
    try {
        const supabase = await createClient()

        const { data: registration, error } = await supabase
            .from('event_registrations')
            .select(`
                *,
                event:events(*),
                profile:profiles(full_name, email),
                church:churches(name)
            `)
            .eq('id', registrationId)
            .single()

        if (error || !registration) {
            return { success: false, error: 'Registration not found' }
        }

        const event = registration.event
        const profile = registration.profile
        const church = registration.church

        const eventDate = format(new Date(event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

        // Refund information
        let refundInfo = ''
        if (registration.payment_status === 'REFUNDED') {
            refundInfo = `
                <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #065f46; font-weight: bold;">💰 Reembolso Processado</p>
                    <p style="margin: 8px 0 0 0; color: #065f46;">
                        O valor de R$ ${((registration.payment_amount_cents || 0) / 100).toFixed(2)} será estornado na sua conta em até 7 dias úteis.
                    </p>
                </div>
            `
        }

        const { error: emailError } = await resend.emails.send({
            from: fromEmail,
            to: profile.email,
            subject: `Cancelamento de Inscrição: ${event.title}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%);">
                        <h1 style="color: white; margin: 0;">${church.name}</h1>
                        <p style="color: #fecdd3; margin: 5px 0 0 0;">Sistema de Eventos</p>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="color: #dc2626; margin-top: 0;">Inscrição Cancelada</h2>
                        <p>Olá, <strong>${profile.full_name}</strong>!</p>
                        <p>Sua inscrição no evento <strong>${event.title}</strong> foi cancelada conforme solicitado.</p>

                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>📅 Data do Evento:</strong> ${eventDate}</p>
                            ${registration.cancellation_reason ? `<p style="margin: 15px 0 5px 0;"><strong>Motivo:</strong> ${registration.cancellation_reason}</p>` : ''}
                        </div>

                        ${refundInfo}

                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Sentiremos sua falta! Esperamos vê-lo(a) em nossos próximos eventos.
                        </p>

                        <a href="${appUrl}/site/${event.church_id}/eventos"
                           style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                            Ver Próximos Eventos
                        </a>
                    </div>

                    <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280;">© 2026 ${church.name}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
                            Powered by <a href="https://ekkle.com.br" style="color: #e11d48; text-decoration: none;">Ekkle</a>
                        </p>
                    </div>
                </div>
            `,
        })

        if (emailError) {
            console.error('Error sending cancellation confirmation:', emailError)
            return { success: false, error: emailError }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in sendCancellationConfirmation:', error)
        return { success: false, error }
    }
}

/**
 * Send waitlist promotion email
 */
export async function sendWaitlistPromotion(registrationId: string) {
    try {
        const supabase = await createClient()

        const { data: registration, error } = await supabase
            .from('event_registrations')
            .select(`
                *,
                event:events(*),
                profile:profiles(full_name, email),
                church:churches(name)
            `)
            .eq('id', registrationId)
            .single()

        if (error || !registration) {
            return { success: false, error: 'Registration not found' }
        }

        const event = registration.event
        const profile = registration.profile
        const church = registration.church

        const eventDate = format(new Date(event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        const eventTime = format(new Date(event.start_date), 'HH:mm', { locale: ptBR })

        const location = event.is_online
            ? `Online: ${event.online_url || 'Link será enviado'}`
            : event.location || 'Local não especificado'

        // Payment action if required
        let paymentSection = ''
        if (registration.payment_required && registration.payment_status === 'PENDING') {
            paymentSection = `
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #991b1b; font-weight: bold;">⚠️ Ação Necessária</p>
                    <p style="margin: 8px 0 0 0; color: #991b1b;">
                        Complete o pagamento de R$ ${((registration.payment_amount_cents || 0) / 100).toFixed(2)} nas próximas 48 horas para garantir sua vaga.
                    </p>
                </div>
                <a href="${appUrl}/site/${event.church_id}/eventos/${event.id}/checkout"
                   style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                    Realizar Pagamento
                </a>
            `
        } else {
            paymentSection = `
                <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #065f46; font-weight: bold;">✓ Vaga Confirmada!</p>
                    <p style="margin: 8px 0 0 0; color: #065f46;">
                        Sua presença está garantida no evento. Aguardamos você!
                    </p>
                </div>
            `
        }

        const { error: emailError } = await resend.emails.send({
            from: fromEmail,
            to: profile.email,
            subject: `🎉 Vaga Disponível: ${event.title}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                        <h1 style="color: white; margin: 0;">🎉 Boa Notícia!</h1>
                        <p style="color: #d1fae5; margin: 5px 0 0 0;">Uma vaga abriu para você</p>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="color: #059669; margin-top: 0;">Você saiu da lista de espera!</h2>
                        <p>Olá, <strong>${profile.full_name}</strong>!</p>
                        <p>Temos uma ótima notícia! Uma vaga abriu no evento <strong>${event.title}</strong> e sua inscrição foi confirmada.</p>

                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1f2937;">${event.title}</h3>
                            ${event.description ? `<p style="color: #6b7280;">${event.description}</p>` : ''}
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
                            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${eventDate}</p>
                            <p style="margin: 5px 0;"><strong>🕐 Horário:</strong> ${eventTime}</p>
                            <p style="margin: 5px 0;"><strong>📍 Local:</strong> ${location}</p>
                        </div>

                        ${paymentSection}

                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Não perca essa oportunidade! Aguardamos você.
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280;">© 2026 ${church.name}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
                            Powered by <a href="https://ekkle.com.br" style="color: #e11d48; text-decoration: none;">Ekkle</a>
                        </p>
                    </div>
                </div>
            `,
        })

        if (emailError) {
            console.error('Error sending waitlist promotion:', emailError)
            return { success: false, error: emailError }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in sendWaitlistPromotion:', error)
        return { success: false, error }
    }
}

/**
 * Send event reminder to all confirmed registrants
 */
export async function sendEventReminder(eventId: string) {
    try {
        const supabase = await createClient()

        // Get event
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*, church:churches(name)')
            .eq('id', eventId)
            .single()

        if (eventError || !event) {
            return { success: false, error: 'Event not found' }
        }

        // Get all confirmed registrations
        const { data: registrations, error: regError } = await supabase
            .from('event_registrations')
            .select(`
                *,
                profile:profiles(full_name, email)
            `)
            .eq('event_id', eventId)
            .eq('status', 'CONFIRMED')

        if (regError || !registrations || registrations.length === 0) {
            return { success: false, error: 'No confirmed registrations' }
        }

        const eventDate = format(new Date(event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        const eventTime = format(new Date(event.start_date), 'HH:mm', { locale: ptBR })

        const location = event.is_online
            ? `<strong>Link para o evento:</strong> <a href="${event.online_url}" style="color: #e11d48;">${event.online_url}</a>`
            : `<strong>Local:</strong> ${event.location}`

        let sentCount = 0

        // Send reminder to each registrant
        for (const registration of registrations) {
            const profile = registration.profile

            const { error: emailError } = await resend.emails.send({
                from: fromEmail,
                to: profile.email,
                subject: `⏰ Lembrete: ${event.title} é amanhã!`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%);">
                            <h1 style="color: white; margin: 0;">⏰ Lembrete de Evento</h1>
                        </div>

                        <div style="padding: 30px;">
                            <h2 style="color: #e11d48; margin-top: 0;">Não esqueça!</h2>
                            <p>Olá, <strong>${profile.full_name}</strong>!</p>
                            <p>Este é um lembrete de que o evento <strong>${event.title}</strong> acontecerá em breve.</p>

                            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #1f2937;">${event.title}</h3>
                                <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${eventDate}</p>
                                <p style="margin: 5px 0;"><strong>🕐 Horário:</strong> ${eventTime}</p>
                                <p style="margin: 5px 0;">${location}</p>
                            </div>

                            <p style="margin-top: 20px;">Aguardamos você!</p>

                            <a href="${appUrl}/site/${event.church_id}/membro/eventos"
                               style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                                Ver Meus Eventos
                            </a>
                        </div>

                        <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">© 2026 ${event.church.name}</p>
                        </div>
                    </div>
                `,
            })

            if (!emailError) {
                sentCount++
            }
        }

        return { success: true, sent: sentCount, total: registrations.length }
    } catch (error) {
        console.error('Error in sendEventReminder:', error)
        return { success: false, error }
    }
}
