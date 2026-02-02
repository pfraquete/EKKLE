'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  Square,
  Settings,
  Monitor,
  Camera,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Info,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface WebBroadcasterProps {
  streamKey: string
  liveStreamId: string
  onStatusChange?: (status: 'idle' | 'connecting' | 'live' | 'error') => void
}

export function WebBroadcaster({
  streamKey,
  liveStreamId,
  onStatusChange
}: WebBroadcasterProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [devices, setDevices] = useState<{
    videoDevices: MediaDeviceInfo[]
    audioDevices: MediaDeviceInfo[]
  }>({ videoDevices: [], audioDevices: [] })
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [sourceType, setSourceType] = useState<'camera' | 'screen'>('camera')
  const [permissionError, setPermissionError] = useState<string | null>(null)

  // Update parent status
  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])

  // Load available devices
  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permission first to get device labels
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        tempStream.getTracks().forEach(track => track.stop())

        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
        const audioDevices = allDevices.filter(d => d.kind === 'audioinput')

        setDevices({ videoDevices, audioDevices })

        if (videoDevices.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(videoDevices[0].deviceId)
        }
        if (audioDevices.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audioDevices[0].deviceId)
        }

        setPermissionError(null)
      } catch (error) {
        console.error('Error loading devices:', error)
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setPermissionError('Permissão de câmera/microfone negada. Por favor, permita o acesso nas configurações do navegador.')
          } else if (error.name === 'NotFoundError') {
            setPermissionError('Nenhuma câmera ou microfone encontrado.')
          } else {
            setPermissionError('Erro ao acessar dispositivos: ' + error.message)
          }
        }
      }
    }

    loadDevices()
  }, [])

  // Start preview
  const startPreview = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      let stream: MediaStream

      if (sourceType === 'screen') {
        // Screen capture
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        })

        // Get microphone audio separately if screen audio not available
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true
          })

          // Combine screen video with microphone audio
          const audioTrack = audioStream.getAudioTracks()[0]
          if (audioTrack) {
            screenStream.addTrack(audioTrack)
          }
        } catch (e) {
          console.log('Could not add microphone audio:', e)
        }

        stream = screenStream
      } else {
        // Camera capture
        stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoDevice
            ? {
                deviceId: selectedVideoDevice,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
              }
            : {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
              },
          audio: selectedAudioDevice
            ? { deviceId: selectedAudioDevice }
            : true
        })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Apply initial mute states
      stream.getVideoTracks().forEach(track => {
        track.enabled = videoEnabled
      })
      stream.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled
      })

      setPermissionError(null)
    } catch (error) {
      console.error('Error starting preview:', error)
      if (error instanceof Error) {
        setPermissionError('Erro ao iniciar preview: ' + error.message)
      }
    }
  }, [sourceType, selectedVideoDevice, selectedAudioDevice, videoEnabled, audioEnabled])

  // Start preview when devices change
  useEffect(() => {
    if (selectedVideoDevice || selectedAudioDevice) {
      startPreview()
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [selectedVideoDevice, selectedAudioDevice, sourceType])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled
      })
    }
    setVideoEnabled(!videoEnabled)
  }, [videoEnabled])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled
      })
    }
    setAudioEnabled(!audioEnabled)
  }, [audioEnabled])

  return (
    <div className="flex flex-col gap-4">
      {/* Info Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Preview da Câmera</p>
          <p className="text-blue-600/80 dark:text-blue-400/80">
            Use este preview para testar sua câmera e microfone. Para transmitir, você precisa usar
            um software como <strong>OBS Studio</strong> (gratuito) com as configurações RTMP abaixo.
          </p>
          <a
            href="https://obsproject.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Baixar OBS Studio
          </a>
        </div>
      </div>

      {/* Permission Error */}
      {permissionError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{permissionError}</p>
          <button
            onClick={startPreview}
            className="ml-auto p-2 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Video Preview */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Preview Label */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-sm font-medium">
          <Video className="w-4 h-4" />
          Preview
        </div>

        {/* No Video Overlay */}
        {!videoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <VideoOff className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Media Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-xl transition-colors ${
              videoEnabled
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            }`}
            title={videoEnabled ? 'Desativar vídeo' : 'Ativar vídeo'}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-3 rounded-xl transition-colors ${
              audioEnabled
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            }`}
            title={audioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <div className="w-px h-8 bg-border mx-2" />

          {/* Source Toggle */}
          <button
            onClick={() => setSourceType(sourceType === 'camera' ? 'screen' : 'camera')}
            className={`p-3 rounded-xl transition-colors ${
              sourceType === 'screen'
                ? 'bg-primary/20 text-primary'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title={sourceType === 'camera' ? 'Compartilhar tela' : 'Usar câmera'}
          >
            {sourceType === 'camera' ? <Camera className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
          <div className={`w-2 h-2 rounded-full ${streamRef.current ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-muted-foreground">
            {streamRef.current ? 'Câmera ativa' : 'Câmera inativa'}
          </span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-muted/50 rounded-xl space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
            Configurações de Dispositivo
          </h3>

          {/* Video Device */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Câmera</label>
            <select
              value={selectedVideoDevice}
              onChange={(e) => setSelectedVideoDevice(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              {devices.videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Câmera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Device */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Microfone</label>
            <select
              value={selectedAudioDevice}
              onChange={(e) => setSelectedAudioDevice(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              {devices.audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microfone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Audio Level Indicator */}
      {streamRef.current && audioEnabled && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            Sua câmera e microfone estão funcionando! Use o OBS para iniciar a transmissão.
          </span>
        </div>
      )}
    </div>
  )
}
