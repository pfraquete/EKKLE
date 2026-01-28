'use client'

import { useState, useEffect, useRef } from 'react'
import { Radio, Users } from 'lucide-react'
import { LiveStream, getViewerCount } from '@/actions/live-streams'
import MuxPlayer from '@mux/mux-player-react'
import Hls from 'hls.js'

type PublicLivePlayerProps = {
  stream: LiveStream
}

export function PublicLivePlayer({ stream }: PublicLivePlayerProps) {
  const [viewerCount, setViewerCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  // Poll viewer count
  useEffect(() => {
    if (stream.status !== 'LIVE') return

    const fetchViewerCount = async () => {
      const count = await getViewerCount(stream.id)
      setViewerCount(count)
    }

    fetchViewerCount()
    const interval = setInterval(fetchViewerCount, 15000) // Every 15 seconds

    return () => clearInterval(interval)
  }, [stream.id, stream.status])

  // Setup HLS for custom streams
  useEffect(() => {
    if (stream.provider === 'CUSTOM' && stream.custom_embed_url && videoRef.current) {
      const url = stream.custom_embed_url

      if (url.includes('.m3u8')) {
        if (Hls.isSupported()) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.loadSource(url)
          hls.attachMedia(videoRef.current)
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = url
        }
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [stream.provider, stream.custom_embed_url])

  const renderPlayer = () => {
    // Mux Player
    if (stream.provider === 'MUX' && stream.mux_playback_id) {
      return (
        <MuxPlayer
          streamType="live"
          playbackId={stream.mux_playback_id}
          autoPlay="muted"
          className="w-full h-full"
          style={{ aspectRatio: '16/9' }}
          accentColor="#22c55e"
        />
      )
    }

    // YouTube Embed
    if (stream.provider === 'YOUTUBE' && stream.youtube_url) {
      const videoId = extractYouTubeId(stream.youtube_url)
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      }
    }

    // Custom Embed
    if (stream.provider === 'CUSTOM' && stream.custom_embed_url) {
      const url = stream.custom_embed_url

      if (url.includes('iframe') || url.includes('embed')) {
        return (
          <iframe
            src={url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      }

      return (
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay
          muted
        />
      )
    }

    // Fallback
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/90">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Aguardando transmissao...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-[2.5rem] border border-border/50 overflow-hidden shadow-2xl">
      {/* Video Player */}
      <div className="relative bg-black aspect-video group">
        {renderPlayer()}

        {/* Live Badge */}
        {stream.status === 'LIVE' && (
          <div className="absolute top-4 left-4 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              AO VIVO
            </div>
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
              <Users className="w-3.5 h-3.5" />
              {viewerCount} assistindo
            </div>
          </div>
        )}
      </div>

      {/* Stream Info */}
      <div className="p-10">
        <h1 className="text-3xl font-black text-foreground tracking-tighter leading-tight mb-2">
          {stream.title}
        </h1>
        {stream.created_by_profile && (
          <p className="text-muted-foreground text-sm mb-4">
            Por {stream.created_by_profile.full_name}
          </p>
        )}

        {stream.description && (
          <p className="text-muted-foreground font-medium leading-[1.8] whitespace-pre-wrap max-w-4xl">
            {stream.description}
          </p>
        )}
      </div>
    </div>
  )
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}
