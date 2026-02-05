import { NextRequest, NextResponse } from 'next/server'
import { WebhookReceiver } from 'livekit-server-sdk'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('LiveKit webhook Supabase environment variables are missing.')
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// Initialize webhook receiver
function getWebhookReceiver() {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return null
  }

  return new WebhookReceiver(apiKey, apiSecret)
}

export async function POST(request: NextRequest) {
  try {
    const receiver = getWebhookReceiver()
    if (!receiver) {
      console.error('LiveKit webhook receiver not configured')
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    const body = await request.text()
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Verify and parse the webhook
    const event = await receiver.receive(body, authHeader)

    console.log('LiveKit webhook received:', event.event)

    switch (event.event) {
      case 'room_started':
        console.log('Room started:', event.room?.name)
        break

      case 'room_finished':
        console.log('Room finished:', event.room?.name)
        // Optionally update stream status when room ends
        if (event.room?.name) {
          await handleRoomFinished(event.room.name)
        }
        break

      case 'participant_joined':
        console.log('Participant joined:', event.participant?.identity)
        break

      case 'participant_left':
        console.log('Participant left:', event.participant?.identity)
        break

      case 'egress_started':
        console.log('Egress started:', event.egressInfo?.egressId)
        if (event.egressInfo?.roomName) {
          await handleEgressStarted(event.egressInfo.roomName, event.egressInfo.egressId)
        }
        break

      case 'egress_updated':
        console.log('Egress updated:', event.egressInfo?.egressId, event.egressInfo?.status)
        break

      case 'egress_ended':
        console.log('Egress ended:', event.egressInfo?.egressId)
        if (event.egressInfo?.roomName) {
          await handleEgressEnded(event.egressInfo.roomName)
        }
        break

      default:
        console.log('Unhandled LiveKit event:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing LiveKit webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Handle room finished - end the live stream
async function handleRoomFinished(roomName: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return
    }

    // Find stream by room name
    const { data: stream } = await supabase
      .from('live_streams')
      .select('id, status')
      .eq('livekit_room_name', roomName)
      .single()

    if (stream && stream.status === 'LIVE') {
      // Update stream status to ENDED
      await supabase
        .from('live_streams')
        .update({
          status: 'ENDED',
          actual_end: new Date().toISOString(),
          livekit_egress_id: null,
        })
        .eq('id', stream.id)

      console.log('Stream ended due to room finished:', stream.id)
    }
  } catch (error) {
    console.error('Error handling room finished:', error)
  }
}

// Handle egress started - update stream with egress ID
async function handleEgressStarted(roomName: string, egressId: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return
    }

    const { error } = await supabase
      .from('live_streams')
      .update({
        livekit_egress_id: egressId,
        status: 'LIVE',
        actual_start: new Date().toISOString(),
      })
      .eq('livekit_room_name', roomName)

    if (error) {
      console.error('Error updating stream on egress start:', error)
    } else {
      console.log('Stream updated with egress ID:', egressId)
    }
  } catch (error) {
    console.error('Error handling egress started:', error)
  }
}

// Handle egress ended - update stream status
async function handleEgressEnded(roomName: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return
    }

    // Find stream by room name
    const { data: stream } = await supabase
      .from('live_streams')
      .select('id, status')
      .eq('livekit_room_name', roomName)
      .single()

    if (stream && stream.status === 'LIVE') {
      // Update stream status to ENDED
      await supabase
        .from('live_streams')
        .update({
          status: 'ENDED',
          actual_end: new Date().toISOString(),
          livekit_egress_id: null,
        })
        .eq('id', stream.id)

      console.log('Stream ended due to egress ended:', stream.id)
    }
  } catch (error) {
    console.error('Error handling egress ended:', error)
  }
}
