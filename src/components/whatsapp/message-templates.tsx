'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, Check, MessageSquare, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { updateAgentConfig } from '@/actions/agent-config'
import { cn } from '@/lib/utils'

interface MessageTemplate {
  id: string
  label: string
  message: string
}

interface MessageTemplatesProps {
  fieldName: 'first_contact_message' | 'outside_hours_message' | 'fallback_message'
  title: string
  description: string
  currentValue: string
  churchName?: string
  onUpdate?: () => void
}

const FIRST_CONTACT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'formal',
    label: 'Formal',
    message: 'Olá! Sou o assistente virtual da [IGREJA]. Como posso ajudá-lo hoje?'
  },
  {
    id: 'friendly',
    label: 'Amigável',
    message: 'Paz do Senhor! 🙏 Bem-vindo ao atendimento da [IGREJA]. Como posso te ajudar?'
  },
  {
    id: 'casual',
    label: 'Descontraído',
    message: 'Oi! Tudo bem? 😊 Sou o assistente da [IGREJA]. Me conta, como posso ajudar você hoje?'
  },
  {
    id: 'custom',
    label: 'Personalizada',
    message: ''
  }
]

const OUTSIDE_HOURS_TEMPLATES: MessageTemplate[] = [
  {
    id: 'simple',
    label: 'Simples',
    message: 'Olá! No momento estamos fora do horário de atendimento. Deixe sua mensagem que responderemos assim que possível.'
  },
  {
    id: 'detailed',
    label: 'Detalhada',
    message: 'Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. Deixe sua mensagem que responderemos assim que possível. Que Deus abençoe! 🙏'
  },
  {
    id: 'emergency',
    label: 'Com emergência',
    message: 'Olá! Estamos fora do horário de atendimento. Para emergências pastorais, ligue para [TELEFONE]. Caso contrário, deixe sua mensagem que responderemos em breve.'
  },
  {
    id: 'custom',
    label: 'Personalizada',
    message: ''
  }
]

const FALLBACK_TEMPLATES: MessageTemplate[] = [
  {
    id: 'simple',
    label: 'Simples',
    message: 'Desculpe, não consegui entender sua mensagem. Pode reformular?'
  },
  {
    id: 'helpful',
    label: 'Prestativa',
    message: 'Desculpe, não consegui processar sua mensagem. Tente perguntar sobre horários dos cultos, endereço ou como participar da igreja.'
  },
  {
    id: 'redirect',
    label: 'Com redirecionamento',
    message: 'Não consegui entender sua solicitação. Para falar diretamente com alguém da igreja, envie "ATENDENTE" que encaminharemos sua mensagem.'
  },
  {
    id: 'custom',
    label: 'Personalizada',
    message: ''
  }
]

export function MessageTemplates({
  fieldName,
  title,
  description,
  currentValue,
  churchName = 'Igreja',
  onUpdate
}: MessageTemplatesProps) {
  const templates = fieldName === 'first_contact_message' 
    ? FIRST_CONTACT_TEMPLATES 
    : fieldName === 'outside_hours_message'
      ? OUTSIDE_HOURS_TEMPLATES
      : FALLBACK_TEMPLATES

  // Find current template or set to custom
  const findCurrentTemplate = () => {
    const normalizedCurrent = currentValue.replace(/\[IGREJA\]/g, churchName)
    const match = templates.find(t => 
      t.id !== 'custom' && 
      t.message.replace(/\[IGREJA\]/g, churchName) === normalizedCurrent
    )
    return match?.id || 'custom'
  }

  const [selected, setSelected] = useState(findCurrentTemplate())
  const [customMessage, setCustomMessage] = useState(
    findCurrentTemplate() === 'custom' ? currentValue : ''
  )
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)

  const handleSelect = (templateId: string) => {
    setSelected(templateId)
    
    if (templateId === 'custom') {
      setIsEditing(true)
      return
    }

    const template = templates.find(t => t.id === templateId)
    if (!template) return

    const message = template.message.replace(/\[IGREJA\]/g, churchName)
    
    startTransition(async () => {
      const result = await updateAgentConfig({
        [fieldName]: message
      })

      if (result.success) {
        toast.success('Mensagem atualizada!')
        onUpdate?.()
      } else {
        toast.error(result.error || 'Erro ao atualizar mensagem')
      }
    })
  }

  const handleSaveCustom = () => {
    if (!customMessage.trim()) {
      toast.error('Digite uma mensagem personalizada')
      return
    }

    startTransition(async () => {
      const result = await updateAgentConfig({
        [fieldName]: customMessage
      })

      if (result.success) {
        toast.success('Mensagem personalizada salva!')
        setIsEditing(false)
        onUpdate?.()
      } else {
        toast.error(result.error || 'Erro ao salvar mensagem')
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selected} onValueChange={handleSelect} className="space-y-2">
          {templates.map((template) => (
            <div key={template.id} className="relative">
              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  selected === template.id
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                )}
              >
                <RadioGroupItem value={template.id} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{template.label}</span>
                  {template.id !== 'custom' && (
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      "{template.message.replace(/\[IGREJA\]/g, churchName)}"
                    </p>
                  )}
                </div>
                {selected === template.id && template.id !== 'custom' && (
                  <Check className="h-4 w-4 text-primary mt-1" />
                )}
              </label>
            </div>
          ))}
        </RadioGroup>

        {/* Custom message editor */}
        {selected === 'custom' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Digite sua mensagem personalizada..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(findCurrentTemplate())
                  setIsEditing(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCustom}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        )}

        {isPending && selected !== 'custom' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
