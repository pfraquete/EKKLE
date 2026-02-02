'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import {
  generateBroadcasterToken,
  createRoom,
  deleteRoom,
  startRtmpEgress,
  stopEgress,
  MUX_RTMP_URL,
  LIVEKIT_WS_URL,
} from '@/lib/livekit'

// =====================================================
// GET LIVEKIT TOKEN FOR BROADCASTER
// =====================================================

export async function getLiveKitBroadcasterToken(liveStreamId: string): Promise<{
  success: boolean
  token?: string
  wsUrl?: string
  roomName?: string
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile) {
      return { success: false, error: 'Não autenticado' }
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem transmitir' }
    }

    // Check LiveKit config first
    const livekitUrl = process.env.LIVEKIT_URL
    const livekitApiKey = process.env.LIVEKIT_API_KEY
    const livekitApiSecret = process.env.LIVEKIT_API_SECRET

    console.log('LiveKit Config Check:', {
      hasUrl: !!livekitUrl,
      hasApiKey: !!livekitApiKey,
      hasApiSecret: !!livekitApiSecret,
      url: livekitUrl?.substring(0, 20) + '...',
    })

    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return {
        success: false,
        error: 'LiveKit não configurado. Configure LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET.'
      }
    }

    const supabase = await createClient()

    // Get live stream
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', liveStreamId)
      .eq('church_id', profile.church_id)
      .single()

    if (streamError || !stream) {
      return { success: false, error: 'Live não encontrada' }
    }

    if (stream.broadcast_type !== 'browser') {
      return { success: false, error: 'Esta live não é do tipo browser' }
    }

    // If room not created yet, create it now
    let roomName = stream.livekit_room_name
    if (!roomName) {
      roomName = `live-${liveStreamId}`
      const created = await createRoom(roomName)

      if (!created) {
        return { success: false, error: 'Erro ao criar sala no LiveKit. Verifique as credenciais.' }
      }

      // Save room name to database
      await supabase
        .from('live_streams')
        .update({ livekit_room_name: roomName })
        .eq('id', liveStreamId)
    }

    // Generate token
    const token = await generateBroadcasterToken(
      roomName,
      profile.id,
      profile.full_name || 'Broadcaster'
    )

    if (!token) {
      return { success: false, error: 'Erro ao gerar token. Verifique as configurações do LiveKit.' }
    }

    return {
      success: true,
      token,
      wsUrl: livekitUrl,
      roomName,
    }
  } catch (error) {
    console.error('Error getting LiveKit token:', error)
    return { success: false, error: 'Erro ao obter token: ' + (error instanceof Error ? error.message : 'Erro desconhecido') }
  }
}

// =====================================================
// START BROWSER BROADCAST (EGRESS TO MUX)
// =====================================================

export async function startBrowserBroadcast(liveStreamId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' }
    }

    const supabase = await createClient()

    // Get live stream
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', liveStreamId)
      .eq('church_id', profile.church_id)
      .single()

    if (streamError || !stream) {
      return { success: false, error: 'Live não encontrada' }
    }

    if (stream.broadcast_type !== 'browser') {
      return { success: false, error: 'Esta live não é do tipo browser' }
    }

    if (!stream.livekit_room_name || !stream.mux_stream_key) {
      return { success: false, error: 'Configuração incompleta' }
    }

    if (stream.status === 'LIVE') {
      return { success: false, error: 'A live já está ao vivo' }
    }

    // Start RTMP egress from LiveKit to Mux
    const egressId = await startRtmpEgress({
      roomName: stream.livekit_room_name,
      rtmpUrl: MUX_RTMP_URL,
      streamKey: stream.mux_stream_key,
    })

    if (!egressId) {
      return { success: false, error: 'Erro ao iniciar transmissão. Verifique se há vídeo sendo transmitido.' }
    }

    // Update stream status
    const { error: updateError } = await supabase
      .from('live_streams')
      .update({
        status: 'LIVE',
        livekit_egress_id: egressId,
        actual_start: new Date().toISOString(),
      })
      .eq('id', liveStreamId)

    if (updateError) {
      // Try to stop egress if db update failed
      await stopEgress(egressId)
      return { success: false, error: 'Erro ao atualizar status' }
    }

    revalidatePath('/dashboard/lives')
    revalidatePath(`/dashboard/lives/${liveStreamId}`)

    return { success: true }
  } catch (error) {
    console.error('Error starting browser broadcast:', error)
    return { success: false, error: 'Erro ao iniciar transmissão' }
  }
}

// =====================================================
// STOP BROWSER BROADCAST
// =====================================================

export async function stopBrowserBroadcast(liveStreamId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' }
    }

    const supabase = await createClient()

    // Get live stream
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', liveStreamId)
      .eq('church_id', profile.church_id)
      .single()

    if (streamError || !stream) {
      return { success: false, error: 'Live não encontrada' }
    }

    // Stop egress if exists
    if (stream.livekit_egress_id) {
      await stopEgress(stream.livekit_egress_id)
    }

    // Update stream status
    const { error: updateError } = await supabase
      .from('live_streams')
      .update({
        status: 'ENDED',
        livekit_egress_id: null,
        actual_end: new Date().toISOString(),
      })
      .eq('id', liveStreamId)

    if (updateError) {
      return { success: false, error: 'Erro ao atualizar status' }
    }

    // Delete LiveKit room
    if (stream.livekit_room_name) {
      await deleteRoom(stream.livekit_room_name)
    }

    revalidatePath('/dashboard/lives')
    revalidatePath(`/dashboard/lives/${liveStreamId}`)

    return { success: true }
  } catch (error) {
    console.error('Error stopping browser broadcast:', error)
    return { success: false, error: 'Erro ao encerrar transmissão' }
  }
}

// =====================================================
// PREPARE BROWSER LIVE (CREATE ROOM)
// =====================================================

export async function prepareBrowserLive(liveStreamId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' }
    }

    const supabase = await createClient()

    // Get live stream
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', liveStreamId)
      .eq('church_id', profile.church_id)
      .single()

    if (streamError || !stream) {
      return { success: false, error: 'Live não encontrada' }
    }

    if (stream.broadcast_type !== 'browser') {
      return { success: false, error: 'Esta live não é do tipo browser' }
    }

    // Create room if not exists
    if (!stream.livekit_room_name) {
      const roomName = `live-${liveStreamId}`
      const created = await createRoom(roomName)

      if (!created) {
        return { success: false, error: 'Erro ao criar sala. Verifique as configurações do LiveKit.' }
      }

      // Update stream with room name
      const { error: updateError } = await supabase
        .from('live_streams')
        .update({ livekit_room_name: roomName })
        .eq('id', liveStreamId)

      if (updateError) {
        return { success: false, error: 'Erro ao salvar room' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error preparing browser live:', error)
    return { success: false, error: 'Erro ao preparar transmissão' }
  }
}

// =====================================================
// CHECK LIVEKIT CONFIGURATION
// =====================================================

export async function checkLiveKitConfig(): Promise<{
  configured: boolean
  wsUrl?: string
}> {
  const configured = !!(
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET &&
    process.env.LIVEKIT_URL
  )

  return {
    configured,
    wsUrl: configured ? LIVEKIT_WS_URL : undefined,
  }
}
