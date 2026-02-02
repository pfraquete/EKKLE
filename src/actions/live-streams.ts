'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from './auth'
import Mux from '@mux/mux-node'

// Types
export type LiveStreamStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
export type LiveStreamProvider = 'MUX' | 'YOUTUBE' | 'CUSTOM'

export type BroadcastType = 'rtmp' | 'browser'

export type LiveStream = {
  id: string
  church_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: LiveStreamStatus
  scheduled_start: string | null
  actual_start: string | null
  actual_end: string | null
  provider: LiveStreamProvider
  broadcast_type: BroadcastType
  mux_stream_key: string | null
  mux_playback_id: string | null
  mux_live_stream_id: string | null
  livekit_room_name: string | null
  livekit_egress_id: string | null
  youtube_url: string | null
  custom_embed_url: string | null
  chat_enabled: boolean
  is_public: boolean
  is_recording: boolean
  recording_url: string | null
  peak_viewers: number
  total_views: number
  created_by: string
  created_at: string
  updated_at: string
  created_by_profile?: {
    id: string
    full_name: string
    photo_url: string | null
  }
}

export type LiveChatMessage = {
  id: string
  church_id: string
  live_stream_id: string
  profile_id: string
  message: string
  is_deleted: boolean
  deleted_by: string | null
  is_pinned: boolean
  created_at: string
  profile?: {
    id: string
    full_name: string
    photo_url: string | null
    role: string
  }
}

// Initialize Mux client (only if credentials exist)
function getMuxClient() {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET

  if (!tokenId || !tokenSecret) {
    return null
  }

  return new Mux({
    tokenId,
    tokenSecret,
  })
}

/**
 * Create a new live stream
 */
export async function createLiveStream(input: {
  title: string
  description?: string
  provider: LiveStreamProvider
  broadcast_type?: BroadcastType
  scheduled_start?: string
  youtube_url?: string
  custom_embed_url?: string
  chat_enabled?: boolean
  is_public?: boolean
}) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem criar transmissões')
    }

    const supabase = await createClient()

    let muxStreamKey: string | null = null
    let muxPlaybackId: string | null = null
    let muxLiveStreamId: string | null = null
    let livekitRoomName: string | null = null

    const broadcastType = input.broadcast_type || 'rtmp'

    // If using Mux, create a live stream
    if (input.provider === 'MUX') {
      const mux = getMuxClient()
      if (!mux) {
        throw new Error('Credenciais do Mux não configuradas. Configure MUX_TOKEN_ID e MUX_TOKEN_SECRET.')
      }

      const liveStream = await mux.video.liveStreams.create({
        playback_policy: ['public'],
        new_asset_settings: {
          playback_policy: ['public'],
        },
        max_continuous_duration: 43200, // 12 hours max
      })

      muxStreamKey = liveStream.stream_key || null
      muxPlaybackId = liveStream.playback_ids?.[0]?.id || null
      muxLiveStreamId = liveStream.id
    }

    const { data, error } = await supabase
      .from('live_streams')
      .insert({
        church_id: profile.church_id,
        title: input.title,
        description: input.description || null,
        provider: input.provider,
        broadcast_type: broadcastType,
        scheduled_start: input.scheduled_start || null,
        youtube_url: input.youtube_url || null,
        custom_embed_url: input.custom_embed_url || null,
        chat_enabled: input.chat_enabled ?? true,
        is_public: input.is_public ?? false,
        mux_stream_key: muxStreamKey,
        mux_playback_id: muxPlaybackId,
        mux_live_stream_id: muxLiveStreamId,
        livekit_room_name: livekitRoomName,
        created_by: profile.id,
        status: input.scheduled_start ? 'SCHEDULED' : 'SCHEDULED',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating live stream:', error)
      throw new Error('Erro ao criar transmissão')
    }

    // If browser broadcast, prepare the LiveKit room
    if (broadcastType === 'browser' && data) {
      const { createRoom } = await import('@/lib/livekit')
      const roomName = `live-${data.id}`
      const created = await createRoom(roomName)

      if (created) {
        await supabase
          .from('live_streams')
          .update({ livekit_room_name: roomName })
          .eq('id', data.id)

        data.livekit_room_name = roomName
      }
    }

    revalidatePath('/pastor/lives')
    revalidatePath('/membro/lives')
    revalidatePath('/lider/lives')
    revalidatePath('/dashboard/lives')

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error creating live stream:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Update a live stream
 */
export async function updateLiveStream(
  streamId: string,
  input: {
    title?: string
    description?: string
    scheduled_start?: string
    youtube_url?: string
    custom_embed_url?: string
    chat_enabled?: boolean
    thumbnail_url?: string
  }
) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem editar transmissões')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('live_streams')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao atualizar transmissão')
    }

    revalidatePath('/pastor/lives')
    revalidatePath(`/pastor/lives/${streamId}`)
    revalidatePath('/membro/lives')
    revalidatePath('/lider/lives')

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error updating live stream:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Start a live stream (change status to LIVE)
 */
export async function startLiveStream(streamId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem iniciar transmissões')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('live_streams')
      .update({
        status: 'LIVE',
        actual_start: new Date().toISOString(),
      })
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao iniciar transmissão')
    }

    revalidatePath('/pastor/lives')
    revalidatePath(`/pastor/lives/${streamId}`)
    revalidatePath('/membro/lives')
    revalidatePath('/lider/lives')

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error starting live stream:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * End a live stream
 */
export async function endLiveStream(streamId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem encerrar transmissões')
    }

    const supabase = await createClient()

    // Get the stream first to check if it's using Mux
    const { data: stream } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .single()

    if (!stream) {
      throw new Error('Transmissão não encontrada')
    }

    // If using Mux, complete the stream
    if (stream.provider === 'MUX' && stream.mux_live_stream_id) {
      const mux = getMuxClient()
      if (mux) {
        try {
          await mux.video.liveStreams.complete(stream.mux_live_stream_id)
        } catch (muxError) {
          console.error('Error completing Mux stream:', muxError)
        }
      }
    }

    // If browser broadcast, stop LiveKit egress and delete room
    if (stream.broadcast_type === 'browser') {
      const { stopEgress, deleteRoom } = await import('@/lib/livekit')

      if (stream.livekit_egress_id) {
        try {
          await stopEgress(stream.livekit_egress_id)
        } catch (egressError) {
          console.error('Error stopping LiveKit egress:', egressError)
        }
      }

      if (stream.livekit_room_name) {
        try {
          await deleteRoom(stream.livekit_room_name)
        } catch (roomError) {
          console.error('Error deleting LiveKit room:', roomError)
        }
      }
    }

    const { data, error } = await supabase
      .from('live_streams')
      .update({
        status: 'ENDED',
        actual_end: new Date().toISOString(),
        livekit_egress_id: null,
      })
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao encerrar transmissão')
    }

    revalidatePath('/pastor/lives')
    revalidatePath(`/pastor/lives/${streamId}`)
    revalidatePath('/membro/lives')
    revalidatePath('/lider/lives')
    revalidatePath('/dashboard/lives')
    revalidatePath(`/dashboard/lives/${streamId}`)

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error ending live stream:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Delete a live stream
 */
export async function deleteLiveStream(streamId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem excluir transmissões')
    }

    const supabase = await createClient()

    // Get the stream first to check if it's using Mux
    const { data: stream } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .single()

    if (stream?.provider === 'MUX' && stream.mux_live_stream_id) {
      const mux = getMuxClient()
      if (mux) {
        try {
          await mux.video.liveStreams.delete(stream.mux_live_stream_id)
        } catch (muxError) {
          console.error('Error deleting Mux stream:', muxError)
        }
      }
    }

    const { error } = await supabase
      .from('live_streams')
      .delete()
      .eq('id', streamId)
      .eq('church_id', profile.church_id)

    if (error) {
      throw new Error('Erro ao excluir transmissão')
    }

    revalidatePath('/pastor/lives')
    revalidatePath('/membro/lives')
    revalidatePath('/lider/lives')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting live stream:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Get all live streams for the church
 */
export async function getLiveStreams(status?: LiveStreamStatus) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return []
    }

    const supabase = await createClient()

    let query = supabase
      .from('live_streams')
      .select(`
        *,
        created_by_profile:profiles!live_streams_created_by_fkey(id, full_name, photo_url)
      `)
      .eq('church_id', profile.church_id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error getting live streams:', error)
      return []
    }

    return data as LiveStream[]
  } catch (error) {
    console.error('Error getting live streams:', error)
    return []
  }
}

/**
 * Get current live stream (if any)
 */
export async function getCurrentLiveStream() {
  try {
    const profile = await getProfile()
    if (!profile) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        created_by_profile:profiles!live_streams_created_by_fkey(id, full_name, photo_url)
      `)
      .eq('church_id', profile.church_id)
      .eq('status', 'LIVE')
      .single()

    if (error) {
      return null
    }

    return data as LiveStream
  } catch (error) {
    console.error('Error getting current live stream:', error)
    return null
  }
}

/**
 * Get a specific live stream by ID
 */
export async function getLiveStream(streamId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        created_by_profile:profiles!live_streams_created_by_fkey(id, full_name, photo_url)
      `)
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .single()

    if (error) {
      return null
    }

    return data as LiveStream
  } catch (error) {
    console.error('Error getting live stream:', error)
    return null
  }
}

/**
 * Get public live streams for a church (no auth required)
 */
export async function getPublicLiveStreams(churchId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        created_by_profile:profiles!live_streams_created_by_fkey(id, full_name, photo_url)
      `)
      .eq('church_id', churchId)
      .eq('is_public', true)
      .in('status', ['SCHEDULED', 'LIVE'])
      .order('status', { ascending: false }) // LIVE first
      .order('scheduled_start', { ascending: true })

    if (error) {
      console.error('Error getting public live streams:', error)
      return []
    }

    return data as LiveStream[]
  } catch (error) {
    console.error('Error getting public live streams:', error)
    return []
  }
}

/**
 * Get a public live stream by ID (no auth required)
 */
export async function getPublicLiveStream(streamId: string, churchId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        created_by_profile:profiles!live_streams_created_by_fkey(id, full_name, photo_url)
      `)
      .eq('id', streamId)
      .eq('church_id', churchId)
      .eq('is_public', true)
      .single()

    if (error) {
      return null
    }

    return data as LiveStream
  } catch (error) {
    console.error('Error getting public live stream:', error)
    return null
  }
}

/**
 * Get public chat messages for a stream (no auth required, read-only)
 */
export async function getPublicChatMessages(streamId: string, churchId: string, limit = 100) {
  try {
    const supabase = await createClient()

    // First check if the stream is public
    const { data: stream } = await supabase
      .from('live_streams')
      .select('is_public')
      .eq('id', streamId)
      .eq('church_id', churchId)
      .single()

    if (!stream?.is_public) {
      return []
    }

    const { data, error } = await supabase
      .from('live_chat_messages')
      .select(`
        *,
        profile:profiles!live_chat_messages_profile_id_fkey(id, full_name, photo_url, role)
      `)
      .eq('live_stream_id', streamId)
      .eq('church_id', churchId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error getting public chat messages:', error)
      return []
    }

    return data as LiveChatMessage[]
  } catch (error) {
    console.error('Error getting public chat messages:', error)
    return []
  }
}

/**
 * Get viewer count for a stream
 */
export async function getViewerCount(streamId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .rpc('get_live_stream_viewer_count', { stream_id: streamId })

    if (error) {
      return 0
    }

    return data as number
  } catch (error) {
    console.error('Error getting viewer count:', error)
    return 0
  }
}

/**
 * Join a live stream (register as viewer)
 */
export async function joinLiveStream(streamId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    const supabase = await createClient()

    await supabase.rpc('update_viewer_presence', {
      p_stream_id: streamId,
      p_profile_id: profile.id,
      p_church_id: profile.church_id,
      p_is_active: true,
    })

    // Update total views counter (optional - function may not exist)
    try {
      await supabase
        .from('live_streams')
        .update({ total_views: (await supabase.from('live_streams').select('total_views').eq('id', streamId).single()).data?.total_views + 1 || 1 })
        .eq('id', streamId)
    } catch {
      // Ignore error if update fails
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('Error joining live stream:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Leave a live stream
 */
export async function leaveLiveStream(streamId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: true } // No need to throw error when leaving
    }

    const supabase = await createClient()

    await supabase.rpc('update_viewer_presence', {
      p_stream_id: streamId,
      p_profile_id: profile.id,
      p_church_id: profile.church_id,
      p_is_active: false,
    })

    return { success: true }
  } catch (error) {
    console.error('Error leaving live stream:', error)
    return { success: true } // Don't fail on leave
  }
}

// =====================================================
// CHAT FUNCTIONS
// =====================================================

/**
 * Send a chat message
 */
export async function sendChatMessage(streamId: string, message: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (!message.trim()) {
      throw new Error('Mensagem não pode ser vazia')
    }

    if (message.length > 500) {
      throw new Error('Mensagem muito longa (máximo 500 caracteres)')
    }

    const supabase = await createClient()

    // Check if chat is enabled for this stream
    const { data: stream } = await supabase
      .from('live_streams')
      .select('chat_enabled, status')
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .single()

    if (!stream) {
      throw new Error('Transmissão não encontrada')
    }

    if (!stream.chat_enabled) {
      throw new Error('Chat desabilitado para esta transmissão')
    }

    if (stream.status !== 'LIVE') {
      throw new Error('Chat disponível apenas durante transmissões ao vivo')
    }

    const { data, error } = await supabase
      .from('live_chat_messages')
      .insert({
        live_stream_id: streamId,
        church_id: profile.church_id,
        profile_id: profile.id,
        message: message.trim(),
      })
      .select(`
        *,
        profile:profiles!live_chat_messages_profile_id_fkey(id, full_name, photo_url, role)
      `)
      .single()

    if (error) {
      throw new Error('Erro ao enviar mensagem')
    }

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error sending chat message:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Get chat messages for a stream
 */
export async function getChatMessages(streamId: string, limit = 100) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return []
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('live_chat_messages')
      .select(`
        *,
        profile:profiles!live_chat_messages_profile_id_fkey(id, full_name, photo_url, role)
      `)
      .eq('live_stream_id', streamId)
      .eq('church_id', profile.church_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error getting chat messages:', error)
      return []
    }

    return data as LiveChatMessage[]
  } catch (error) {
    console.error('Error getting chat messages:', error)
    return []
  }
}

/**
 * Delete a chat message (soft delete)
 */
export async function deleteChatMessage(messageId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    const supabase = await createClient()

    // Get the message to check permissions
    const { data: message } = await supabase
      .from('live_chat_messages')
      .select('profile_id, church_id')
      .eq('id', messageId)
      .single()

    if (!message) {
      throw new Error('Mensagem não encontrada')
    }

    // Check if user can delete (own message or pastor)
    if (message.profile_id !== profile.id && profile.role !== 'PASTOR') {
      throw new Error('Sem permissão para excluir esta mensagem')
    }

    const { error } = await supabase
      .from('live_chat_messages')
      .update({
        is_deleted: true,
        deleted_by: profile.id,
      })
      .eq('id', messageId)

    if (error) {
      throw new Error('Erro ao excluir mensagem')
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting chat message:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Pin/unpin a chat message (pastor only)
 */
export async function togglePinMessage(messageId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem fixar mensagens')
    }

    const supabase = await createClient()

    // Get current pin status
    const { data: message } = await supabase
      .from('live_chat_messages')
      .select('is_pinned, church_id')
      .eq('id', messageId)
      .single()

    if (!message) {
      throw new Error('Mensagem não encontrada')
    }

    if (message.church_id !== profile.church_id) {
      throw new Error('Sem permissão para esta mensagem')
    }

    const { error } = await supabase
      .from('live_chat_messages')
      .update({ is_pinned: !message.is_pinned })
      .eq('id', messageId)

    if (error) {
      throw new Error('Erro ao fixar/desfixar mensagem')
    }

    return { success: true, isPinned: !message.is_pinned }
  } catch (error: unknown) {
    console.error('Error toggling pin message:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

/**
 * Toggle chat enabled/disabled for a stream (pastor only)
 */
export async function toggleStreamChat(streamId: string) {
  try {
    const profile = await getProfile()
    if (!profile) {
      throw new Error('Não autenticado')
    }

    if (profile.role !== 'PASTOR') {
      throw new Error('Apenas pastores podem alterar configurações do chat')
    }

    const supabase = await createClient()

    // Get current status
    const { data: stream } = await supabase
      .from('live_streams')
      .select('chat_enabled')
      .eq('id', streamId)
      .eq('church_id', profile.church_id)
      .single()

    if (!stream) {
      throw new Error('Transmissão não encontrada')
    }

    const { error } = await supabase
      .from('live_streams')
      .update({ chat_enabled: !stream.chat_enabled })
      .eq('id', streamId)

    if (error) {
      throw new Error('Erro ao alterar configuração do chat')
    }

    revalidatePath(`/pastor/lives/${streamId}`)

    return { success: true, chatEnabled: !stream.chat_enabled }
  } catch (error: unknown) {
    console.error('Error toggling stream chat:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}
