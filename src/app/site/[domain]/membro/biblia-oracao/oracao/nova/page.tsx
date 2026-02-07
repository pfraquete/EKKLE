'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AudioRecorder } from '@/components/prayers/audio-recorder'
import { createPrayerRecord, confirmAudioUpload } from '@/actions/prayers'
import { Card, CardContent } from '@/components/ui/card'

export default function NovaOracaoPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRecordingComplete = async (blob: Blob, durationSeconds: number) => {
    setIsUploading(true)
    setError(null)

    try {
      // Step 1: Create prayer record and get upload URL
      const createResult = await createPrayerRecord(durationSeconds)

      if (!createResult.success || !createResult.uploadUrl || !createResult.prayerId) {
        setError(createResult.error || 'Erro ao criar registro')
        setIsUploading(false)
        return
      }

      // Step 2: Upload audio to Supabase Storage
      const uploadResponse = await fetch(createResult.uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'audio/webm',
        },
      })

      if (!uploadResponse.ok) {
        setError('Erro ao fazer upload do audio')
        setIsUploading(false)
        return
      }

      // Step 3: Confirm upload and start transcription
      const confirmResult = await confirmAudioUpload(
        createResult.prayerId,
        createResult.uploadPath!
      )

      if (!confirmResult.success) {
        setError(confirmResult.error || 'Erro ao confirmar upload')
        setIsUploading(false)
        return
      }

      // Redirect to prayer detail page
      router.push(`/membro/biblia-oracao/oracao/${createResult.prayerId}`)
    } catch (err) {
      console.error('Error uploading prayer:', err)
      setError('Erro inesperado. Tente novamente.')
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/membro/biblia-oracao/oracao"
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Nova Oração
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Grave sua oração para registrar e analisar
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h3 className="font-bold text-foreground mb-2">Como funciona:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. Toque no botão para começar a gravar</li>
            <li>2. Fale sua oração naturalmente</li>
            <li>3. Pause ou pare quando terminar</li>
            <li>4. Confirme para salvar e transcrever</li>
          </ul>
          <p className="text-xs text-primary mt-3 font-medium">
            A IA irá transcrever e extrair os pontos importantes da sua oração automaticamente.
          </p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Audio Recorder */}
      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        maxDuration={600} // 10 minutes max
        disabled={isUploading}
      />

      {/* Uploading State */}
      {isUploading && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
            <h3 className="font-bold text-foreground mb-1">Salvando sua oração...</h3>
            <p className="text-sm text-muted-foreground">
              Isso pode levar alguns segundos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
        <p>Dica: Fale claramente e em um ambiente silencioso para melhor transcrição.</p>
        <p>Suas orações são privadas e apenas você pode ver.</p>
      </div>
    </div>
  )
}
