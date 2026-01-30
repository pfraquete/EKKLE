'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Square, Loader2, Play, Pause, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void
  maxDuration?: number // in seconds, default 10 minutes
  disabled?: boolean
}

export function AudioRecorder({
  onRecordingComplete,
  maxDuration = 600,
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setPermissionDenied(false)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      setPermissionDenied(true)
    }
  }

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return

    if (isPaused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    setIsPaused(!isPaused)
  }

  // Play/Pause audio preview
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Reset recording
  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  // Confirm recording
  const confirmRecording = () => {
    if (audioBlob && recordingTime > 0) {
      onRecordingComplete(audioBlob, recordingTime)
    }
  }

  // Handle audio ended
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false)
    }
  }, [audioUrl])

  // Auto-stop when max duration reached
  useEffect(() => {
    if (recordingTime >= maxDuration) {
      stopRecording()
    }
  }, [recordingTime, maxDuration, stopRecording])

  if (permissionDenied) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <Mic className="w-12 h-12 mx-auto mb-4 text-destructive/50" />
          <h3 className="font-bold text-destructive mb-2">Permissao Negada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Precisamos de acesso ao microfone para gravar suas oracoes.
            Por favor, permita o acesso nas configuracoes do navegador.
          </p>
          <Button
            variant="outline"
            onClick={() => setPermissionDenied(false)}
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6">
        {/* Timer Display */}
        <div className="text-center mb-6">
          <div
            className={cn(
              'text-5xl font-black tracking-tight transition-colors',
              isRecording && !isPaused ? 'text-primary animate-pulse' : 'text-foreground'
            )}
          >
            {formatTime(recordingTime)}
          </div>
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">
            {isRecording
              ? isPaused
                ? 'Pausado'
                : 'Gravando...'
              : audioBlob
              ? 'Gravacao Finalizada'
              : `Maximo ${Math.floor(maxDuration / 60)} minutos`}
          </p>
        </div>

        {/* Recording Visualization */}
        {isRecording && !isPaused && (
          <div className="flex justify-center items-center gap-1 h-12 mb-6">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Audio Preview */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} className="hidden" />
        )}

        {/* Controls */}
        <div className="flex justify-center items-center gap-4">
          {!isRecording && !audioBlob && (
            <Button
              size="lg"
              onClick={startRecording}
              disabled={disabled}
              className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
            >
              <Mic className="w-8 h-8" />
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                size="lg"
                variant="outline"
                onClick={togglePause}
                className="rounded-full w-14 h-14"
              >
                {isPaused ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <Pause className="w-6 h-6" />
                )}
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="rounded-full w-20 h-20 shadow-lg"
              >
                <Square className="w-8 h-8" />
              </Button>
            </>
          )}

          {audioBlob && (
            <>
              <Button
                size="lg"
                variant="outline"
                onClick={togglePlayback}
                className="rounded-full w-14 h-14"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={resetRecording}
                className="rounded-full w-14 h-14 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-6 h-6" />
              </Button>
              <Button
                size="lg"
                onClick={confirmRecording}
                disabled={disabled}
                className="rounded-full w-20 h-20 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
              >
                {disabled ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Check className="w-8 h-8" />
                )}
              </Button>
            </>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {!isRecording && !audioBlob && 'Toque para comecar a gravar sua oracao'}
          {isRecording && 'Fale sua oracao. Pause ou pare quando terminar.'}
          {audioBlob && 'Ouca sua gravacao ou confirme para salvar'}
        </p>
      </CardContent>
    </Card>
  )
}
