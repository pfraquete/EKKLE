'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
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
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface WebBroadcasterProps {
  token: string
  wsUrl: string
  roomName: string
  onGoLive: () => Promise<void>
  onEndLive: () => Promise<void>
  isLive: boolean
  isStarting?: boolean
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
type PermissionStatus = 'pending' | 'granted' | 'denied' | 'not_found' | 'error'

export function WebBroadcaster({
  token,
  wsUrl,
  roomName,
  onGoLive,
  onEndLive,
  isLive,
  isStarting = false,
}: WebBroadcasterProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const roomRef = useRef<Room | null>(null)

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('pending')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [sourceType, setSourceType] = useState<'camera' | 'screen'>('camera')
  const [showSettings, setShowSettings] = useState(false)
  const [devices, setDevices] = useState<{
    videoDevices: MediaDeviceInfo[]
    audioDevices: MediaDeviceInfo[]
  }>({ videoDevices: [], audioDevices: [] })
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [hasPublished, setHasPublished] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  // Check if mediaDevices API is available
  const isMediaDevicesSupported = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    typeof navigator.mediaDevices.getUserMedia === 'function'

  // Request permissions and load devices
  const requestPermissionsAndLoadDevices = useCallback(async () => {
    if (!isMediaDevicesSupported) {
      setPermissionStatus('error')
      setPermissionError('Seu navegador não suporta acesso à câmera/microfone. Use Chrome, Firefox ou Safari.')
      return
    }

    setIsRequestingPermission(true)
    setPermissionError(null)

    try {
      // First, check current permission status using Permissions API if available
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          
          console.log('Camera permission:', cameraPermission.state)
          console.log('Microphone permission:', micPermission.state)
        } catch (e) {
          // Permissions API not fully supported, continue with getUserMedia
          console.log('Permissions API not available, using getUserMedia directly')
        }
      }

      // Request permission with constraints
      console.log('Requesting media permissions...')
      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      const tempStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Media stream obtained successfully')
      
      // Stop the temporary stream
      tempStream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label)
        track.stop()
      })

      // Now enumerate devices (labels should be available after permission)
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      console.log('All devices:', allDevices)
      
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
      const audioDevices = allDevices.filter(d => d.kind === 'audioinput')

      console.log('Video devices:', videoDevices)
      console.log('Audio devices:', audioDevices)

      if (videoDevices.length === 0 && audioDevices.length === 0) {
        setPermissionStatus('not_found')
        setPermissionError('Nenhuma câmera ou microfone encontrado no seu dispositivo.')
        return
      }

      setDevices({ videoDevices, audioDevices })

      if (videoDevices.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoDevices[0].deviceId)
      }
      if (audioDevices.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevices[0].deviceId)
      }

      setPermissionStatus('granted')
      setPermissionError(null)
      
    } catch (error) {
      console.error('Error requesting media permissions:', error)
      
      if (error instanceof Error) {
        const errorName = error.name
        const errorMessage = error.message
        
        console.log('Error name:', errorName)
        console.log('Error message:', errorMessage)
        
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setPermissionStatus('denied')
          setPermissionError(
            'Permissão de câmera/microfone negada. ' +
            'Clique no ícone de cadeado na barra de endereço do navegador, ' +
            'permita o acesso à câmera e microfone, e recarregue a página.'
          )
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setPermissionStatus('not_found')
          setPermissionError('Nenhuma câmera ou microfone encontrado no seu dispositivo.')
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setPermissionStatus('error')
          setPermissionError(
            'Não foi possível acessar a câmera/microfone. ' +
            'Verifique se outro aplicativo não está usando esses dispositivos.'
          )
        } else if (errorName === 'OverconstrainedError') {
          // Try again with simpler constraints
          try {
            const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            simpleStream.getTracks().forEach(track => track.stop())
            
            const allDevices = await navigator.mediaDevices.enumerateDevices()
            const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
            const audioDevices = allDevices.filter(d => d.kind === 'audioinput')
            
            setDevices({ videoDevices, audioDevices })
            if (videoDevices.length > 0) setSelectedVideoDevice(videoDevices[0].deviceId)
            if (audioDevices.length > 0) setSelectedAudioDevice(audioDevices[0].deviceId)
            
            setPermissionStatus('granted')
            setPermissionError(null)
            return
          } catch (retryError) {
            setPermissionStatus('error')
            setPermissionError('Erro ao acessar dispositivos: ' + errorMessage)
          }
        } else if (errorName === 'SecurityError') {
          setPermissionStatus('error')
          setPermissionError(
            'Erro de segurança. Verifique se está acessando via HTTPS.'
          )
        } else {
          setPermissionStatus('error')
          setPermissionError('Erro ao acessar dispositivos: ' + errorMessage)
        }
      } else {
        setPermissionStatus('error')
        setPermissionError('Erro desconhecido ao acessar dispositivos de mídia.')
      }
    } finally {
      setIsRequestingPermission(false)
    }
  }, [isMediaDevicesSupported, selectedVideoDevice, selectedAudioDevice])

  // Load devices on mount
  useEffect(() => {
    requestPermissionsAndLoadDevices()
  }, []) // Only run once on mount

  // Connect to LiveKit room
  useEffect(() => {
    if (!token || !wsUrl) return

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    })

    roomRef.current = room

    // Room event handlers
    room.on(RoomEvent.Connected, () => {
      console.log('Connected to LiveKit room')
      setConnectionStatus('connected')
    })

    room.on(RoomEvent.Disconnected, () => {
      console.log('Disconnected from LiveKit room')
      setConnectionStatus('disconnected')
    })

    room.on(RoomEvent.Reconnecting, () => {
      console.log('Reconnecting to LiveKit room')
      setConnectionStatus('reconnecting')
    })

    room.on(RoomEvent.Reconnected, () => {
      console.log('Reconnected to LiveKit room')
      setConnectionStatus('connected')
    })

    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      console.log('Local track published:', publication.trackSid)
    })

    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      console.log('Local track unpublished:', publication.trackSid)
    })

    // Connect to room
    setConnectionStatus('connecting')
    room.connect(wsUrl, token)
      .then(() => {
        console.log('Room connected successfully')
      })
      .catch((error) => {
        console.error('Error connecting to room:', error)
        setConnectionStatus('error')
        setPermissionError('Erro ao conectar à sala de transmissão')
      })

    return () => {
      room.disconnect()
      roomRef.current = null
    }
  }, [token, wsUrl])

  // Publish camera/microphone
  const publishCamera = useCallback(async () => {
    const room = roomRef.current
    if (!room || connectionStatus !== 'connected') {
      toast.error('Aguarde a conexão com o servidor')
      return
    }

    if (permissionStatus !== 'granted') {
      toast.error('Permita o acesso à câmera e microfone primeiro')
      await requestPermissionsAndLoadDevices()
      return
    }

    setIsPublishing(true)
    try {
      await room.localParticipant.setCameraEnabled(true, {
        deviceId: selectedVideoDevice || undefined,
        resolution: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
      })

      await room.localParticipant.setMicrophoneEnabled(true, {
        deviceId: selectedAudioDevice || undefined,
      })

      // Attach video to element
      const videoTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track
      if (videoTrack && videoRef.current) {
        videoTrack.attach(videoRef.current)
      }

      setSourceType('camera')
      setVideoEnabled(true)
      setAudioEnabled(true)
      setHasPublished(true)
      toast.success('Câmera e microfone ativados')
    } catch (error) {
      console.error('Error publishing camera:', error)
      if (error instanceof Error) {
        toast.error('Erro ao ativar câmera: ' + error.message)
      } else {
        toast.error('Erro ao ativar câmera')
      }
    } finally {
      setIsPublishing(false)
    }
  }, [connectionStatus, permissionStatus, selectedVideoDevice, selectedAudioDevice, requestPermissionsAndLoadDevices])

  // Publish screen share
  const publishScreen = useCallback(async () => {
    const room = roomRef.current
    if (!room || connectionStatus !== 'connected') return

    setIsPublishing(true)
    try {
      // Disable camera first
      await room.localParticipant.setCameraEnabled(false)

      // Enable screen share
      await room.localParticipant.setScreenShareEnabled(true, {
        audio: true,
        resolution: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
      })

      // Also enable microphone
      await room.localParticipant.setMicrophoneEnabled(true, {
        deviceId: selectedAudioDevice || undefined,
      })

      // Attach screen share to element
      const screenTrack = room.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track
      if (screenTrack && videoRef.current) {
        screenTrack.attach(videoRef.current)
      }

      setSourceType('screen')
      setVideoEnabled(true)
      setAudioEnabled(true)
      setHasPublished(true)
      toast.success('Compartilhamento de tela ativado')
    } catch (error) {
      console.error('Error publishing screen:', error)
      toast.error('Erro ao compartilhar tela')
      // Re-enable camera if screen share fails
      await publishCamera()
    } finally {
      setIsPublishing(false)
    }
  }, [connectionStatus, selectedAudioDevice, publishCamera])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const room = roomRef.current
    if (!room) return

    try {
      if (sourceType === 'camera') {
        await room.localParticipant.setCameraEnabled(!videoEnabled)
      } else {
        await room.localParticipant.setScreenShareEnabled(!videoEnabled)
      }
      setVideoEnabled(!videoEnabled)
    } catch (error) {
      console.error('Error toggling video:', error)
    }
  }, [videoEnabled, sourceType])

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    const room = roomRef.current
    if (!room) return

    try {
      await room.localParticipant.setMicrophoneEnabled(!audioEnabled)
      setAudioEnabled(!audioEnabled)
    } catch (error) {
      console.error('Error toggling audio:', error)
    }
  }, [audioEnabled])

  // Switch between camera and screen
  const switchSource = useCallback(async () => {
    if (sourceType === 'camera') {
      await publishScreen()
    } else {
      await publishCamera()
    }
  }, [sourceType, publishCamera, publishScreen])

  // Handle go live
  const handleGoLive = async () => {
    if (!roomRef.current || connectionStatus !== 'connected') {
      toast.error('Conecte sua câmera primeiro')
      return
    }

    // Check if publishing video
    const hasVideo = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.track ||
                     roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track

    if (!hasVideo) {
      toast.error('Ative sua câmera ou compartilhe sua tela primeiro')
      return
    }

    await onGoLive()
  }

  // Connection status indicator
  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: Wifi, color: 'text-green-500', text: 'Conectado' }
      case 'connecting':
        return { icon: Loader2, color: 'text-yellow-500 animate-spin', text: 'Conectando...' }
      case 'reconnecting':
        return { icon: RefreshCw, color: 'text-yellow-500 animate-spin', text: 'Reconectando...' }
      case 'error':
        return { icon: WifiOff, color: 'text-red-500', text: 'Erro de conexão' }
      default:
        return { icon: WifiOff, color: 'text-gray-400', text: 'Desconectado' }
    }
  }

  const statusInfo = getConnectionStatusInfo()
  const StatusIcon = statusInfo.icon

  // Get permission status info
  const getPermissionStatusInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return { color: 'text-green-500', text: 'Dispositivos prontos' }
      case 'denied':
        return { color: 'text-red-500', text: 'Permissão negada' }
      case 'not_found':
        return { color: 'text-yellow-500', text: 'Dispositivos não encontrados' }
      case 'error':
        return { color: 'text-red-500', text: 'Erro de acesso' }
      default:
        return { color: 'text-gray-400', text: 'Verificando...' }
    }
  }

  const permissionInfo = getPermissionStatusInfo()

  return (
    <div className="flex flex-col gap-4">
      {/* Permission Error */}
      {permissionError && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{permissionError}</p>
            {permissionStatus === 'denied' && (
              <p className="text-xs mt-2 text-red-400">
                Dica: No Chrome, clique no ícone de cadeado/câmera à esquerda da URL.
                No Safari, vá em Preferências → Sites → Câmera/Microfone.
              </p>
            )}
          </div>
          <button
            onClick={requestPermissionsAndLoadDevices}
            disabled={isRequestingPermission}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title="Tentar novamente"
          >
            {isRequestingPermission ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Permission Status (when pending) */}
      {permissionStatus === 'pending' && !permissionError && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Verificando permissões de câmera e microfone...</p>
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

        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold animate-pulse">
              <Radio className="w-4 h-4" />
              AO VIVO
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-sm font-medium">
              <Video className="w-4 h-4" />
              Preview
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-sm">
          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
          <span>{statusInfo.text}</span>
        </div>

        {/* Permission Status Badge */}
        {permissionStatus !== 'granted' && permissionStatus !== 'pending' && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-sm">
            <AlertCircle className={`w-4 h-4 ${permissionInfo.color}`} />
            <span className={permissionInfo.color}>{permissionInfo.text}</span>
          </div>
        )}

        {/* No Video Overlay */}
        {!hasPublished && connectionStatus === 'connected' && permissionStatus === 'granted' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-300 text-center">Clique em &quot;Ativar Câmera&quot; para começar</p>
          </div>
        )}

        {/* Permission Required Overlay */}
        {!hasPublished && permissionStatus !== 'granted' && permissionStatus !== 'pending' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
            <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
            <p className="text-gray-300 text-center mb-4">Permita o acesso à câmera e microfone</p>
            <Button
              onClick={requestPermissionsAndLoadDevices}
              disabled={isRequestingPermission}
              variant="default"
              className="rounded-xl"
            >
              {isRequestingPermission ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Camera className="w-5 h-5 mr-2" />
              )}
              Solicitar Permissão
            </Button>
          </div>
        )}

        {hasPublished && !videoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <VideoOff className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Media Controls */}
        <div className="flex items-center gap-2">
          {/* Start Camera Button - only show if not publishing and has permission */}
          {connectionStatus === 'connected' && !hasPublished && permissionStatus === 'granted' && (
            <Button
              onClick={publishCamera}
              disabled={isPublishing}
              variant="default"
              className="rounded-xl"
            >
              {isPublishing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Camera className="w-5 h-5 mr-2" />
              )}
              Ativar Câmera
            </Button>
          )}

          {/* Request Permission Button - show when permission not granted */}
          {connectionStatus === 'connected' && !hasPublished && permissionStatus !== 'granted' && permissionStatus !== 'pending' && (
            <Button
              onClick={requestPermissionsAndLoadDevices}
              disabled={isRequestingPermission}
              variant="outline"
              className="rounded-xl"
            >
              {isRequestingPermission ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-2" />
              )}
              Tentar Novamente
            </Button>
          )}

          {hasPublished && (
            <>
              <button
                onClick={toggleVideo}
                disabled={connectionStatus !== 'connected'}
                className={`p-3 rounded-xl transition-colors ${
                  videoEnabled
                    ? 'bg-muted hover:bg-muted/80 text-foreground'
                    : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={videoEnabled ? 'Desativar vídeo' : 'Ativar vídeo'}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleAudio}
                disabled={connectionStatus !== 'connected'}
                className={`p-3 rounded-xl transition-colors ${
                  audioEnabled
                    ? 'bg-muted hover:bg-muted/80 text-foreground'
                    : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={audioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <div className="w-px h-8 bg-border mx-2" />

              {/* Source Toggle */}
              <button
                onClick={switchSource}
                disabled={connectionStatus !== 'connected' || isPublishing}
                className={`p-3 rounded-xl transition-colors ${
                  sourceType === 'screen'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={sourceType === 'camera' ? 'Compartilhar tela' : 'Usar câmera'}
              >
                {sourceType === 'camera' ? <Monitor className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </button>
            </>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Go Live / End Live Button */}
        {isLive ? (
          <Button
            onClick={onEndLive}
            variant="destructive"
            size="lg"
            className="rounded-xl font-bold"
          >
            <Square className="w-5 h-5 mr-2" />
            Encerrar Live
          </Button>
        ) : (
          <Button
            onClick={handleGoLive}
            disabled={connectionStatus !== 'connected' || isStarting || !hasPublished}
            size="lg"
            className="rounded-xl font-bold bg-red-500 hover:bg-red-600"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Iniciando...
              </>
            ) : (
              <>
                <Radio className="w-5 h-5 mr-2" />
                Iniciar Live
              </>
            )}
          </Button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-muted/50 rounded-xl space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
            Configurações de Dispositivo
          </h3>

          {/* Device Status */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={permissionInfo.color}>{permissionInfo.text}</span>
            {permissionStatus !== 'granted' && (
              <button
                onClick={requestPermissionsAndLoadDevices}
                disabled={isRequestingPermission}
                className="ml-2 text-primary hover:underline text-xs"
              >
                {isRequestingPermission ? 'Verificando...' : 'Verificar novamente'}
              </button>
            )}
          </div>

          {/* Video Device */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Câmera</label>
            <select
              value={selectedVideoDevice}
              onChange={(e) => setSelectedVideoDevice(e.target.value)}
              disabled={devices.videoDevices.length === 0}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground disabled:opacity-50"
            >
              {devices.videoDevices.length === 0 ? (
                <option value="">Nenhuma câmera encontrada</option>
              ) : (
                devices.videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Câmera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Audio Device */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Microfone</label>
            <select
              value={selectedAudioDevice}
              onChange={(e) => setSelectedAudioDevice(e.target.value)}
              disabled={devices.audioDevices.length === 0}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground disabled:opacity-50"
            >
              {devices.audioDevices.length === 0 ? (
                <option value="">Nenhum microfone encontrado</option>
              ) : (
                devices.audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microfone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {/* Status Message */}
      {connectionStatus === 'connected' && hasPublished && !isLive && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            Tudo pronto! Clique em &quot;Iniciar Live&quot; para começar a transmissão.
          </span>
        </div>
      )}
    </div>
  )
}
