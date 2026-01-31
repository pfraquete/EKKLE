'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { ZoomService } from '@/lib/zoom'
import { DailyService } from '@/lib/daily'

// Types
export type VideoProvider = 'daily' | 'zoom' | 'none'

export interface PrayerRoom {
  id: string
  church_id: string
  name: string
  description: string | null
  // Zoom fields (legacy)
  zoom_meeting_id: string | null
  zoom_password: string | null
  zoom_join_url: string | null
  zoom_host_url: string | null
  // Daily.co fields (new - embedded video)
  daily_room_name: string | null
  daily_room_url: string | null
  video_provider: VideoProvider
  // Schedule
  scheduled_start: string | null
  scheduled_end: string | null
  is_recurring: boolean
  recurrence_pattern: Record<string, unknown> | null
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED'
  max_participants: number
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  creator?: {
    full_name: string
    photo_url: string | null
  }
  participant_count?: number
}

export interface CreatePrayerRoomInput {
  name: string
  description?: string
  scheduledStart?: string
  scheduledEnd?: string
  isRecurring?: boolean
  recurrencePattern?: Record<string, unknown>
  maxParticipants?: number
  isPublic?: boolean
  videoProvider?: VideoProvider // Default: 'daily'
}

// =====================================================
// HELPER: Determine which video provider to use
// =====================================================

function getPreferredVideoProvider(requested?: VideoProvider): VideoProvider {
  // If specifically requested 'none', respect that
  if (requested === 'none') return 'none'

  // Daily.co is preferred (embedded experience)
  if (DailyService.isConfigured()) {
    return requested === 'zoom' && ZoomService.isConfigured() ? 'zoom' : 'daily'
  }

  // Fallback to Zoom if Daily not configured
  if (ZoomService.isConfigured()) {
    return 'zoom'
  }

  return 'none'
}

// =====================================================
// PRAYER ROOM CRUD
// =====================================================

/**
 * Create a new prayer room with video call support
 * Uses Daily.co by default (embedded) or Zoom as fallback
 */
export async function createPrayerRoom(input: CreatePrayerRoomInput) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Nao autenticado' }
    }

    // Only leaders and pastors can create rooms
    if (!['PASTOR', 'LEADER'].includes(profile.role)) {
      return { success: false, error: 'Apenas lideres podem criar salas de oracao' }
    }

    const supabase = await createClient()

    // Determine video provider
    const videoProvider = getPreferredVideoProvider(input.videoProvider)

    // Video call data
    let dailyRoom = null
    let zoomMeeting = null

    // Try Daily.co first (preferred - embedded experience)
    if (videoProvider === 'daily' && DailyService.isConfigured()) {
      try {
        const roomName = DailyService.generateRoomName('oracao')
        const expiresAt = input.scheduledEnd
          ? new Date(input.scheduledEnd)
          : new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours default

        dailyRoom = await DailyService.createRoom({
          name: roomName,
          maxParticipants: input.maxParticipants || 100,
          enableChat: true,
          enableScreenshare: false, // Prayer rooms don't need screen share
          enableRecording: false,
          isPrivate: !input.isPublic,
          startsAt: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
          expiresAt,
        })
      } catch (dailyError) {
        console.error('Daily.co room creation failed:', dailyError)
        // Will fallback to Zoom or none
      }
    }

    // Fallback to Zoom if Daily failed or Zoom was requested
    if (!dailyRoom && videoProvider === 'zoom' && ZoomService.isConfigured()) {
      try {
        zoomMeeting = await ZoomService.createMeeting({
          topic: `Sala de Oracao: ${input.name}`,
          duration: 120, // 2 hours default
          startTime: input.scheduledStart,
          password: ZoomService.generatePassword(),
        })
      } catch (zoomError) {
        console.error('Zoom meeting creation failed:', zoomError)
      }
    }

    // Determine final provider
    const finalProvider: VideoProvider = dailyRoom ? 'daily' : zoomMeeting ? 'zoom' : 'none'

    // Create prayer room
    const { data: room, error: createError } = await supabase
      .from('prayer_rooms')
      .insert({
        church_id: profile.church_id,
        name: input.name,
        description: input.description || null,
        // Daily.co fields
        daily_room_name: dailyRoom?.name || null,
        daily_room_url: dailyRoom?.url || null,
        video_provider: finalProvider,
        // Zoom fields (legacy)
        zoom_meeting_id: zoomMeeting?.id?.toString() || null,
        zoom_password: zoomMeeting?.password || null,
        zoom_join_url: zoomMeeting?.join_url || null,
        zoom_host_url: zoomMeeting?.start_url || null,
        // Schedule
        scheduled_start: input.scheduledStart || null,
        scheduled_end: input.scheduledEnd || null,
        is_recurring: input.isRecurring || false,
        recurrence_pattern: input.recurrencePattern || null,
        max_participants: input.maxParticipants || 100,
        is_public: input.isPublic ?? true,
        status: input.scheduledStart ? 'SCHEDULED' : 'ACTIVE',
        created_by: profile.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating prayer room:', createError)
      return { success: false, error: 'Erro ao criar sala de oracao' }
    }

    revalidatePath('/membro/biblia-oracao/oracao/salas')

    return { success: true, room: room as PrayerRoom }
  } catch (error) {
    console.error('Error in createPrayerRoom:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get all prayer rooms for the church
 */
export async function getPrayerRooms() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Nao autenticado' }
    }

    const supabase = await createClient()

    const { data: rooms, error } = await supabase
      .from('prayer_rooms')
      .select(`
        *,
        creator:profiles!prayer_rooms_created_by_fkey(full_name, photo_url)
      `)
      .eq('church_id', profile.church_id)
      .in('status', ['SCHEDULED', 'ACTIVE'])
      .or(`is_public.eq.true,created_by.eq.${profile.id}`)
      .order('scheduled_start', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching prayer rooms:', error)
      return { success: false, error: 'Erro ao buscar salas' }
    }

    // Get participant counts
    const roomIds = rooms.map((r) => r.id)
    const { data: counts } = await supabase
      .from('prayer_room_participants')
      .select('prayer_room_id')
      .in('prayer_room_id', roomIds)
      .is('left_at', null)

    const countMap: Record<string, number> = {}
    counts?.forEach((c) => {
      countMap[c.prayer_room_id] = (countMap[c.prayer_room_id] || 0) + 1
    })

    const roomsWithCounts = rooms.map((room) => ({
      ...room,
      participant_count: countMap[room.id] || 0,
    }))

    return { success: true, rooms: roomsWithCounts as PrayerRoom[] }
  } catch (error) {
    console.error('Error in getPrayerRooms:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Get prayer room detail with video call info
 */
export async function getPrayerRoomDetail(roomId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Nao autenticado' }
    }

    const supabase = await createClient()

    const { data: room, error } = await supabase
      .from('prayer_rooms')
      .select(`
        *,
        creator:profiles!prayer_rooms_created_by_fkey(full_name, photo_url)
      `)
      .eq('id', roomId)
      .single()

    if (error) {
      console.error('Error fetching prayer room:', error)
      return { success: false, error: 'Sala nao encontrada' }
    }

    // Check access
    if (!room.is_public && room.created_by !== profile.id) {
      return { success: false, error: 'Acesso negado' }
    }

    // Get participants
    const { data: participants } = await supabase
      .from('prayer_room_participants')
      .select(`
        *,
        profile:profiles(full_name, photo_url)
      `)
      .eq('prayer_room_id', roomId)
      .is('left_at', null)

    // Generate Daily.co token if using Daily
    let dailyToken = null
    if (room.video_provider === 'daily' && room.daily_room_name && DailyService.isConfigured()) {
      try {
        dailyToken = await DailyService.createMeetingToken({
          roomName: room.daily_room_name,
          userName: profile.full_name,
          odUserId: profile.id,
          isOwner: room.created_by === profile.id || profile.role === 'PASTOR',
        })
      } catch (tokenError) {
        console.error('Error creating Daily token:', tokenError)
      }
    }

    return {
      success: true,
      room: room as PrayerRoom,
      participants: participants || [],
      dailyToken,
    }
  } catch (error) {
    console.error('Error in getPrayerRoomDetail:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Join a prayer room
 */
export async function joinPrayerRoom(roomId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Nao autenticado' }
    }

    const supabase = await createClient()

    // Check if room exists and is active
    const { data: room, error: roomError } = await supabase
      .from('prayer_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return { success: false, error: 'Sala nao encontrada' }
    }

    if (room.status !== 'ACTIVE' && room.status !== 'SCHEDULED') {
      return { success: false, error: 'Sala nao esta disponivel' }
    }

    // Upsert participant record
    const { error: joinError } = await supabase
      .from('prayer_room_participants')
      .upsert({
        church_id: profile.church_id,
        prayer_room_id: roomId,
        profile_id: profile.id,
        joined_at: new Date().toISOString(),
        left_at: null,
      }, {
        onConflict: 'prayer_room_id,profile_id',
      })

    if (joinError) {
      console.error('Error joining room:', joinError)
      return { success: false, error: 'Erro ao entrar na sala' }
    }

    revalidatePath(`/membro/biblia-oracao/oracao/salas/${roomId}`)

    // Return appropriate video call info based on provider
    if (room.video_provider === 'daily' && room.daily_room_url) {
      // Generate token for Daily.co
      let dailyToken = null
      if (DailyService.isConfigured() && room.daily_room_name) {
        try {
          dailyToken = await DailyService.createMeetingToken({
            roomName: room.daily_room_name,
            userName: profile.full_name,
            odUserId: profile.id,
            isOwner: room.created_by === profile.id || profile.role === 'PASTOR',
          })
        } catch (tokenError) {
          console.error('Error creating Daily token:', tokenError)
        }
      }

      return {
        success: true,
        videoProvider: 'daily' as VideoProvider,
        dailyRoomUrl: room.daily_room_url,
        dailyToken,
      }
    }

    // Fallback to Zoom
    return {
      success: true,
      videoProvider: (room.video_provider || 'zoom') as VideoProvider,
      joinUrl: room.zoom_join_url,
      password: room.zoom_password,
    }
  } catch (error) {
    console.error('Error in joinPrayerRoom:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Leave a prayer room
 */
export async function leavePrayerRoom(roomId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Nao autenticado' }
    }

    const supabase = await createClient()

    // Get participant record
    const { data: participant } = await supabase
      .from('prayer_room_participants')
      .select('*')
      .eq('prayer_room_id', roomId)
      .eq('profile_id', profile.id)
      .is('left_at', null)
      .single()

    if (participant) {
      const joinedAt = new Date(participant.joined_at)
      const now = new Date()
      const durationSeconds = Math.round((now.getTime() - joinedAt.getTime()) / 1000)

      // Update with leave time and duration
      await supabase
        .from('prayer_room_participants')
        .update({
          left_at: now.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', participant.id)
    }

    revalidatePath(`/membro/biblia-oracao/oracao/salas/${roomId}`)

    return { success: true }
  } catch (error) {
    console.error('Error in leavePrayerRoom:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * End a prayer room (creator/pastor only)
 */
export async function endPrayerRoom(roomId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Nao autenticado' }
    }

    const supabase = await createClient()

    // Get room
    const { data: room, error: roomError } = await supabase
      .from('prayer_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return { success: false, error: 'Sala nao encontrada' }
    }

    // Check permission
    if (room.created_by !== profile.id && profile.role !== 'PASTOR') {
      return { success: false, error: 'Permissao negada' }
    }

    // End video call based on provider
    if (room.video_provider === 'daily' && room.daily_room_name && DailyService.isConfigured()) {
      try {
        await DailyService.deleteRoom(room.daily_room_name)
      } catch (dailyError) {
        console.error('Error deleting Daily room:', dailyError)
      }
    } else if (room.zoom_meeting_id && ZoomService.isConfigured()) {
      try {
        await ZoomService.endMeeting(room.zoom_meeting_id)
      } catch (zoomError) {
        console.error('Error ending Zoom meeting:', zoomError)
      }
    }

    // Update room status
    await supabase
      .from('prayer_rooms')
      .update({ status: 'ENDED' })
      .eq('id', roomId)

    // Mark all participants as left
    await supabase
      .from('prayer_room_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('prayer_room_id', roomId)
      .is('left_at', null)

    revalidatePath('/membro/biblia-oracao/oracao/salas')

    return { success: true }
  } catch (error) {
    console.error('Error in endPrayerRoom:', error)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Cancel a prayer room (creator/pastor only)
 */
export async function cancelPrayerRoom(roomId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Nao autenticado' }
    }

    const supabase = await createClient()

    // Get room
    const { data: room, error: roomError } = await supabase
      .from('prayer_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return { success: false, error: 'Sala nao encontrada' }
    }

    // Check permission
    if (room.created_by !== profile.id && profile.role !== 'PASTOR') {
      return { success: false, error: 'Permissao negada' }
    }

    // Delete video call based on provider
    if (room.video_provider === 'daily' && room.daily_room_name && DailyService.isConfigured()) {
      try {
        await DailyService.deleteRoom(room.daily_room_name)
      } catch (dailyError) {
        console.error('Error deleting Daily room:', dailyError)
      }
    } else if (room.zoom_meeting_id && ZoomService.isConfigured()) {
      try {
        await ZoomService.deleteMeeting(room.zoom_meeting_id)
      } catch (zoomError) {
        console.error('Error deleting Zoom meeting:', zoomError)
      }
    }

    // Update room status
    await supabase
      .from('prayer_rooms')
      .update({ status: 'CANCELLED' })
      .eq('id', roomId)

    revalidatePath('/membro/biblia-oracao/oracao/salas')

    return { success: true }
  } catch (error) {
    console.error('Error in cancelPrayerRoom:', error)
    return { success: false, error: 'Erro interno' }
  }
}
