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
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface WebBroadcasterProps {
  streamKey: string
  rtmpUrl?: string
  onStatusChange?: (status: 'idle' | 'connecting' | 'live' | 'error') => void
}

export function WebBroadcaster({
  streamKey,
  rtmpUrl = 'rtmps://global-live.mux.com:443/app',
  onStatusChange
}: WebBroadcasterProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

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
  const [connectionAttempt, setConnectionAttempt] = useState(0)

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

  // Start broadcasting via WHIP (WebRTC-HTTP Ingestion Protocol)
  const startBroadcast = useCallback(async () => {
    if (!streamRef.current) {
      toast.error('Nenhum stream de vídeo disponível')
      return
    }

    setStatus('connecting')
    setConnectionAttempt(prev => prev + 1)

    try {
      // Close existing connection if any
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }

      // Create peer connection with multiple STUN/TURN servers for better connectivity
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
      })
      pcRef.current = pc

      // Add tracks from our stream
      streamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, streamRef.current!)
      })

      // Create offer with specific options
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      })
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering to complete with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve() // Continue even if not all candidates gathered
        }, 5000)

        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout)
          resolve()
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              clearTimeout(timeout)
              resolve()
            }
          }
        }
      })

      // Try Mux WHIP endpoint
      const whipUrl = `https://global-live.mux.com/v1/whip/${streamKey}`

      console.log('Attempting WHIP connection to:', whipUrl)

      const response = await fetch(whipUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription?.sdp,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('WHIP response error:', response.status, errorText)

        // Check for common errors
        if (response.status === 404 || response.status === 405) {
          throw new Error('O Mux não suporta transmissão pelo navegador (WHIP) para Live Streams. Use a opção "Software Externo (OBS)" para transmitir.')
        }
        throw new Error(`Erro de conexão: ${response.status}`)
      }

      const answerSdp = await response.text()
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          setStatus('live')
          toast.success('Transmissão ao vivo iniciada!')
        } else if (pc.connectionState === 'failed') {
          setStatus('error')
          toast.error('Falha na conexão. Tente usar Software Externo (OBS).')
        } else if (pc.connectionState === 'disconnected') {
          // Try to reconnect
          setTimeout(() => {
            if (pc.connectionState === 'disconnected') {
              setStatus('error')
              toast.error('Conexão perdida')
            }
          }, 3000)
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState)
      }

    } catch (error) {
      console.error('Error starting broadcast:', error)
      setStatus('error')

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      // Show helpful error message
      if (errorMessage.includes('WHIP') || errorMessage.includes('Software Externo')) {
        toast.error(errorMessage, { duration: 8000 })
      } else {
        toast.error('Erro ao conectar. Recomendamos usar a opção "Software Externo (OBS)" para transmitir.', { duration: 6000 })
      }
    }
  }, [streamKey])

  // Stop broadcasting
  const stopBroadcast = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    setStatus('idle')
    toast.info('Transmissão encerrada')
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Beta Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Recurso em desenvolvimento</p>
          <p className="text-amber-600/80 dark:text-amber-400/80">
            A transmissão pelo navegador pode não funcionar em todos os casos.
            Se tiver problemas, use a opção <strong>"Software Externo (OBS)"</strong> que é mais estável.
          </p>
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
        <canvas ref={canvasRef} className="hidden" />

        {/* Status Badge */}
        {status === 'live' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            AO VIVO
          </div>
        )}

        {status === 'connecting' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            Conectando...
          </div>
        )}

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
            disabled={status === 'live'}
            className={`p-3 rounded-xl transition-colors ${
              sourceType === 'screen'
                ? 'bg-primary/20 text-primary'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={sourceType === 'camera' ? 'Compartilhar tela' : 'Usar câmera'}
          >
            {sourceType === 'camera' ? <Camera className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            disabled={status === 'live'}
            className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Broadcast Controls */}
        <div className="flex items-center gap-2">
          {status === 'idle' || status === 'error' ? (
            <button
              onClick={startBroadcast}
              disabled={!streamRef.current || !!permissionError}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Radio className="w-5 h-5" />
              Iniciar Transmissão
            </button>
          ) : status === 'connecting' ? (
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-xl font-bold opacity-80 cursor-not-allowed"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Conectando...
            </button>
          ) : (
            <button
              onClick={stopBroadcast}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              <Square className="w-5 h-5" />
              Encerrar Transmissão
            </button>
          )}
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
              disabled={status === 'live'}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50"
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
              disabled={status === 'live'}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50"
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
    </div>
  )
}
