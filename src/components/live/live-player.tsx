'use client'

import { useState, useEffect, useRef } from 'react'
import { Radio, Users, Copy, Check, ExternalLink, Settings } from 'lucide-react'
import { LiveStream } from '@/actions/live-streams'
import { joinLiveStream, leaveLiveStream, getViewerCount } from '@/actions/live-streams'
import MuxPlayer from '@mux/mux-player-react'
import Hls from 'hls.js'

type LivePlayerProps = {
  stream: LiveStream
  isPastor?: boolean
  onViewerCountChange?: (count: number) => void
}

export function LivePlayer({ stream, isPastor = false, onViewerCountChange }: LivePlayerProps) {
  const [viewerCount, setViewerCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  // Register viewer when joining
  useEffect(() => {
    if (stream.status === 'LIVE') {
      joinLiveStream(stream.id)

      return () => {
        leaveLiveStream(stream.id)
      }
    }
  }, [stream.id, stream.status])

  // Poll viewer count
  useEffect(() => {
    if (stream.status !== 'LIVE') return

    const fetchViewerCount = async () => {
      const count = await getViewerCount(stream.id)
      setViewerCount(count)
      onViewerCountChange?.(count)
    }

    fetchViewerCount()
    const interval = setInterval(fetchViewerCount, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [stream.id, stream.status, onViewerCountChange])

  // Setup HLS for custom streams
  useEffect(() => {
    if (stream.provider === 'CUSTOM' && stream.custom_embed_url && videoRef.current) {
      const url = stream.custom_embed_url

      // Check if it's an HLS stream
      if (url.includes('.m3u8')) {
        if (Hls.isSupported()) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.loadSource(url)
          hls.attachMedia(videoRef.current)
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
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

  const copyStreamKey = async () => {
    if (stream.mux_stream_key) {
      await navigator.clipboard.writeText(stream.mux_stream_key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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

    // Custom Embed (HLS or other)
    if (stream.provider === 'CUSTOM' && stream.custom_embed_url) {
      const url = stream.custom_embed_url

      // Check if it's an iframe embed
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

      // HLS or direct video
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

    // Fallback - Waiting for stream
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/90">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Aguardando transmissao...</p>
          <p className="text-white/40 text-sm mt-1">A live vai comecar em breve</p>
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
              {viewerCount} {viewerCount === 1 ? 'assistindo' : 'assistindo'}
            </div>
          </div>
        )}

        {/* Scheduled Badge */}
        {stream.status === 'SCHEDULED' && stream.scheduled_start && (
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              <Radio className="w-3.5 h-3.5" />
              AGENDADA
            </div>
          </div>
        )}

        {/* Ended Badge */}
        {stream.status === 'ENDED' && (
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 bg-muted/90 text-muted-foreground px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              ENCERRADA
            </div>
          </div>
        )}
      </div>

      {/* Stream Info */}
      <div className="p-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-foreground tracking-tighter leading-tight mb-2">
              {stream.title}
            </h1>
            {stream.created_by_profile && (
              <p className="text-muted-foreground text-sm font-medium">
                Por {stream.created_by_profile.full_name}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            {stream.total_views > 0 && (
              <div className="bg-muted px-4 py-2 rounded-2xl border border-border/50">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                  {stream.total_views} visualizacoes
                </span>
              </div>
            )}
          </div>
        </div>

        {stream.description && (
          <p className="text-muted-foreground font-medium leading-[1.8] whitespace-pre-wrap max-w-4xl">
            {stream.description}
          </p>
        )}

        {/* RTMP Config for Pastor (MUX RTMP only) */}
        {isPastor && stream.provider === 'MUX' && stream.mux_stream_key && stream.broadcast_type === 'rtmp' && stream.status !== 'ENDED' && (
          <div className="mt-8 p-6 bg-muted/50 rounded-2xl border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">
                Configuracoes de Transmissao
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Servidor RTMP
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-4 py-2 rounded-xl text-sm font-mono text-foreground border border-border/50">
                    rtmps://global-live.mux.com:443/app
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText('rtmps://global-live.mux.com:443/app')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Copiar"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Chave de Transmissao
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-4 py-2 rounded-xl text-sm font-mono text-foreground border border-border/50 truncate">
                    {stream.mux_stream_key}
                  </code>
                  <button
                    onClick={copyStreamKey}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={copied ? 'Copiado!' : 'Copiar'}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Use estas configuracoes no OBS Studio, Streamlabs ou outro software de transmissao.
              </p>
            </div>
          </div>
        )}

        {/* YouTube URL for Pastor */}
        {isPastor && stream.provider === 'YOUTUBE' && stream.youtube_url && (
          <div className="mt-8 p-6 bg-muted/50 rounded-2xl border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-4 h-4 text-primary" />
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">
                Link do YouTube
              </h3>
            </div>
            <a
              href={stream.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              {stream.youtube_url}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper to extract YouTube video ID
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
