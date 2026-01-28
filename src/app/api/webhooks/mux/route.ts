import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Mux webhook signature verification
function verifyMuxSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split(',')
  let timestamp = ''
  let v1Signature = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v1') v1Signature = value
  }

  if (!timestamp || !v1Signature) return false

  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(v1Signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('mux-signature')
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      if (!verifyMuxSignature(body, signature, webhookSecret)) {
        console.error('Invalid Mux webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const { type, data } = event

    console.log('Mux webhook received:', type)

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Handle different event types
    switch (type) {
      case 'video.live_stream.active': {
        // Stream went live
        const liveStreamId = data.id

        await supabase
          .from('live_streams')
          .update({
            status: 'LIVE',
            actual_start: new Date().toISOString(),
          })
          .eq('mux_live_stream_id', liveStreamId)

        console.log('Stream went live:', liveStreamId)
        break
      }

      case 'video.live_stream.idle': {
        // Stream went idle (stopped streaming but not ended)
        const liveStreamId = data.id

        // Only update if currently live (not already ended manually)
        await supabase
          .from('live_streams')
          .update({
            status: 'ENDED',
            actual_end: new Date().toISOString(),
          })
          .eq('mux_live_stream_id', liveStreamId)
          .eq('status', 'LIVE')

        console.log('Stream went idle:', liveStreamId)
        break
      }

      case 'video.live_stream.disconnected': {
        // Stream disconnected
        const liveStreamId = data.id
        console.log('Stream disconnected:', liveStreamId)
        break
      }

      case 'video.live_stream.recording': {
        // Recording started
        const liveStreamId = data.id
        console.log('Recording started:', liveStreamId)
        break
      }

      case 'video.asset.ready': {
        // Recording asset is ready
        const assetId = data.id
        const playbackId = data.playback_ids?.[0]?.id
        const liveStreamId = data.live_stream_id

        if (liveStreamId && playbackId) {
          const recordingUrl = `https://stream.mux.com/${playbackId}.m3u8`

          await supabase
            .from('live_streams')
            .update({
              recording_url: recordingUrl,
              is_recording: true,
            })
            .eq('mux_live_stream_id', liveStreamId)

          console.log('Recording ready:', recordingUrl)
        }
        break
      }

      case 'video.live_stream.deleted': {
        // Stream was deleted from Mux
        const liveStreamId = data.id
        console.log('Stream deleted from Mux:', liveStreamId)
        break
      }

      default:
        console.log('Unhandled Mux event type:', type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Mux webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
