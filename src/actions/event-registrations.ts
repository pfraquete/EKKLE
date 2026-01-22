'use server'

import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/actions/auth'
import {
  sendCancellationConfirmation,
  sendRegistrationConfirmation,
  sendWaitlistPromotion,
} from '@/actions/event-notifications'

const ACTIVE_COUNT_STATUSES = ['CONFIRMED', 'PENDING', 'ATTENDED']

function toCents(value: number | null) {
  if (value === null || Number.isNaN(value)) return null
  return Math.round(value * 100)
}

async function getActiveRegistrationCount(eventId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ACTIVE_COUNT_STATUSES)

  return count ?? 0
}

export async function getMyEventRegistration(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { registration: null }
  }

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
    .single()

  return { registration }
}

export async function getEventRegistrationCount(eventId: string) {
  const count = await getActiveRegistrationCount(eventId)

  return { count }
}

export async function registerForEvent(eventId: string, guestCount = 0, guestNames: string[] = []) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Você precisa estar logado para se inscrever.' }
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, start_date, capacity, is_paid, price, church_id, is_published')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { success: false, error: 'Evento não encontrado.' }
  }

  if (!event.is_published) {
    return { success: false, error: 'Evento indisponível para inscrição.' }
  }

  const eventDate = new Date(event.start_date)
  if (eventDate < new Date()) {
    return { success: false, error: 'As inscrições para este evento foram encerradas.' }
  }

  const { data: existingRegistration } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('profile_id', user.id)
    .single()

  if (existingRegistration && existingRegistration.status !== 'CANCELLED') {
    return { success: false, error: 'Você já está inscrito neste evento.' }
  }

  const activeCount = await getActiveRegistrationCount(eventId)
  const isFull = event.capacity ? activeCount >= event.capacity : false
  const status = isFull ? 'WAITLIST' : 'CONFIRMED'

  const paymentAmountCents = toCents(event.is_paid ? event.price : null)
  const paymentRequired = Boolean(event.is_paid)
  const paymentStatus = paymentRequired && !isFull ? 'PENDING' : null

  const payload = {
    event_id: eventId,
    profile_id: user.id,
    church_id: event.church_id,
    status,
    guest_count: guestCount,
    guest_names: guestNames,
    registered_at: new Date().toISOString(),
    cancelled_at: null,
    cancellation_reason: null,
    payment_required: paymentRequired,
    payment_amount_cents: paymentAmountCents,
    payment_status: paymentStatus,
  }

  let registration
  if (existingRegistration) {
    const { data, error } = await supabase
      .from('event_registrations')
      .update(payload)
      .eq('id', existingRegistration.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating registration:', error)
      return { success: false, error: 'Erro ao atualizar sua inscrição.' }
    }

    registration = data
  } else {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error creating registration:', error)
      return { success: false, error: 'Erro ao realizar inscrição.' }
    }

    registration = data
  }

  await sendRegistrationConfirmation(registration.id)

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath('/membro/eventos')

  return {
    success: true,
    status,
    requiresPayment: paymentRequired && status !== 'WAITLIST',
    message: status === 'WAITLIST'
      ? 'Você entrou na lista de espera. Avisaremos se uma vaga abrir.'
      : 'Sua inscrição foi confirmada.'
  }
}

export async function cancelEventRegistration(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Você precisa estar logado para cancelar.' }
  }

  const { data: registration, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event:events(id, title, start_date, church_id)
    `)
    .eq('id', registrationId)
    .eq('profile_id', user.id)
    .single()

  if (error || !registration) {
    return { success: false, error: 'Inscrição não encontrada.' }
  }

  if (registration.status === 'CANCELLED') {
    return { success: true, message: 'Inscrição já estava cancelada.' }
  }

  const eventStart = new Date(registration.event.start_date)
  const now = new Date()
  const diffMs = eventStart.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 3) {
    return { success: false, error: 'Cancelamentos não são permitidos com menos de 3 dias do evento.' }
  }

  let refundMessage = ''
  let paymentStatus = registration.payment_status

  if (registration.payment_status === 'PAID') {
    if (diffDays >= 7) {
      refundMessage = 'Você receberá reembolso integral.'
      paymentStatus = 'REFUNDED'
    } else if (diffDays >= 3) {
      refundMessage = 'Você receberá reembolso parcial (50%).'
      paymentStatus = 'REFUNDED'
    }
  }

  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Cancelamento solicitado pelo usuário',
      payment_status: paymentStatus,
      refunded_at: paymentStatus === 'REFUNDED' ? new Date().toISOString() : null,
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error cancelling registration:', updateError)
    return { success: false, error: 'Erro ao cancelar inscrição.' }
  }

  await sendCancellationConfirmation(registrationId)
  await processWaitlistPromotion(registration.event.id)

  revalidatePath(`/eventos/${registration.event.id}`)
  revalidatePath('/membro/eventos')

  return {
    success: true,
    message: refundMessage || 'Sua inscrição foi cancelada com sucesso.'
  }
}

export async function getMyEventRegistrations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { upcoming: [], past: [] }
  }

  const { data: registrations, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event:events(*)
    `)
    .eq('profile_id', user.id)
    .order('registered_at', { ascending: false })

  if (error || !registrations) {
    console.error('Error fetching registrations:', error)
    return { upcoming: [], past: [] }
  }

  const now = new Date()
  const upcoming = registrations.filter((registration: any) => new Date(registration.event.start_date) >= now)
  const past = registrations.filter((registration: any) => new Date(registration.event.start_date) < now)

  return { upcoming, past }
}

export async function getEventRegistrants(eventId: string) {
  const profile = await getProfile()

  if (!profile || (profile.role !== 'PASTOR' && profile.role !== 'LEADER')) {
    return { registrants: [], stats: { total: 0, confirmed: 0, waitlist: 0, attended: 0, revenue: 0 } }
  }

  const supabase = await createClient()
  const { data: registrations, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      profile:profiles(full_name, email, phone)
    `)
    .eq('event_id', eventId)
    .eq('church_id', profile.church_id)
    .order('registered_at', { ascending: true })

  if (error || !registrations) {
    console.error('Error fetching registrants:', error)
    return { registrants: [], stats: { total: 0, confirmed: 0, waitlist: 0, attended: 0, revenue: 0 } }
  }

  const stats = registrations.reduce(
    (acc: any, reg: any) => {
      acc.total += 1
      if (reg.status === 'CONFIRMED') acc.confirmed += 1
      if (reg.status === 'WAITLIST') acc.waitlist += 1
      if (reg.status === 'ATTENDED') acc.attended += 1
      if (reg.payment_status === 'PAID' && reg.payment_amount_cents) {
        acc.revenue += reg.payment_amount_cents
      }
      return acc
    },
    { total: 0, confirmed: 0, waitlist: 0, attended: 0, revenue: 0 }
  )

  return { registrants: registrations, stats }
}

export async function checkInAttendee(registrationId: string) {
  const profile = await getProfile()

  if (!profile || (profile.role !== 'PASTOR' && profile.role !== 'LEADER')) {
    return { success: false, error: 'Acesso não autorizado.' }
  }

  const supabase = await createClient()
  const { data: registration, error } = await supabase
    .from('event_registrations')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: profile.id,
      status: 'ATTENDED',
    })
    .eq('id', registrationId)
    .select('event_id')
    .single()

  if (error || !registration) {
    console.error('Error checking in attendee:', error)
    return { success: false, error: 'Erro ao registrar presença.' }
  }

  revalidatePath(`/dashboard/eventos/${registration.event_id}/inscricoes`)

  return { success: true }
}

export async function processWaitlistPromotion(eventId: string) {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, capacity')
    .eq('id', eventId)
    .single()

  if (!event) {
    return { success: false, error: 'Evento não encontrado.' }
  }

  const activeCount = await getActiveRegistrationCount(eventId)
  const hasCapacity = event.capacity ? activeCount < event.capacity : true

  if (!hasCapacity) {
    return { success: true, promoted: false }
  }

  const { data: waitlistRegistration } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'WAITLIST')
    .order('registered_at', { ascending: true })
    .limit(1)
    .single()

  if (!waitlistRegistration) {
    return { success: true, promoted: false }
  }

  const paymentStatus = waitlistRegistration.payment_required ? 'PENDING' : null

  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({
      status: 'CONFIRMED',
      payment_status: paymentStatus,
    })
    .eq('id', waitlistRegistration.id)

  if (updateError) {
    console.error('Error promoting waitlist registration:', updateError)
    return { success: false, error: 'Erro ao promover inscrição.' }
  }

  await sendWaitlistPromotion(waitlistRegistration.id)

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath(`/dashboard/eventos/${eventId}/inscricoes`)

  return { success: true, promoted: true }
}

export async function exportRegistrantsToCsv(eventId: string) {
  const profile = await getProfile()

  if (!profile || profile.role !== 'PASTOR') {
    return { success: false, error: 'Acesso não autorizado.' }
  }

  const { registrants } = await getEventRegistrants(eventId)

  if (!registrants.length) {
    return { success: false }
  }

  const header = ['Nome', 'Email', 'Telefone', 'Status', 'Data de inscrição', 'Pagamento', 'Convidados']

  const rows = registrants.map((reg: any) => {
    const payment = reg.payment_status || '-'
    const guests = reg.guest_count ? String(reg.guest_count) : '0'
    return [
      reg.profile?.full_name ?? '-',
      reg.profile?.email ?? '-',
      reg.profile?.phone ?? '-',
      reg.status,
      format(new Date(reg.registered_at), 'dd/MM/yyyy'),
      payment,
      guests,
    ]
  })

  const csvContent = [header, ...rows]
    .map(row => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return { success: true, csv: csvContent }
}
