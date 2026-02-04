'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Check, BookOpen, Smile, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'
import { updateAgentConfig, AgentTone, AgentLanguageStyle, AgentEmojiUsage } from '@/actions/agent-config'
import { cn } from '@/lib/utils'

interface PersonalityOption {
  id: string
  name: string
  description: string
  example: string
  icon: React.ReactNode
  tone: AgentTone
  style: AgentLanguageStyle
  emoji: AgentEmojiUsage
}

const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'formal',
    name: 'Formal',
    description: 'Profissional e respeitoso',
    example: 'Bom dia! Como posso ajudá-lo hoje?',
    icon: <BookOpen className="h-6 w-6" />,
    tone: 'formal',
    style: 'direct',
    emoji: 'none'
  },
  {
    id: 'friendly',
    name: 'Amigável',
    description: 'Acolhedor e encorajador',
    example: 'Oi! Como posso te ajudar? 🙏',
    icon: <Smile className="h-6 w-6" />,
    tone: 'friendly',
    style: 'encouraging',
    emoji: 'moderate'
  },
  {
    id: 'casual',
    name: 'Descontraído',
    description: 'Casual e expressivo',
    example: 'E aí! Tudo bem? Como posso ajudar? 😄',
    icon: <PartyPopper className="h-6 w-6" />,
    tone: 'casual',
    style: 'detailed',
    emoji: 'frequent'
  }
]

interface PersonalitySelectorProps {
  currentTone?: AgentTone
  currentStyle?: AgentLanguageStyle
  currentEmoji?: AgentEmojiUsage
  onUpdate?: () => void
}

export function PersonalitySelector({ 
  currentTone = 'friendly',
  currentStyle = 'encouraging',
  currentEmoji = 'moderate',
  onUpdate
}: PersonalitySelectorProps) {
  // Determine current selection based on tone
  const getCurrentId = () => {
    if (currentTone === 'formal') return 'formal'
    if (currentTone === 'casual') return 'casual'
    return 'friendly'
  }

  const [selected, setSelected] = useState(getCurrentId())
  const [isPending, startTransition] = useTransition()

  const handleSelect = (option: PersonalityOption) => {
    if (option.id === selected) return

    startTransition(async () => {
      const result = await updateAgentConfig({
        tone: option.tone,
        language_style: option.style,
        emoji_usage: option.emoji
      })

      if (result.success) {
        setSelected(option.id)
        toast.success(`Personalidade alterada para "${option.name}"`)
        onUpdate?.()
      } else {
        toast.error(result.error || 'Erro ao alterar personalidade')
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Como você quer que seu assistente se comunique?</CardTitle>
        <CardDescription>
          Escolha o estilo de comunicação que melhor representa sua igreja
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PERSONALITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={isPending}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                "hover:border-primary/50 hover:bg-primary/5",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                selected === option.id
                  ? "border-primary bg-primary/5"
                  : "border-muted bg-background"
              )}
            >
              {/* Selection indicator */}
              {selected === option.id && (
                <div className="absolute top-3 right-3">
                  <div className="p-1 bg-primary rounded-full">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={cn(
                "p-3 rounded-xl w-fit mb-3",
                selected === option.id
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {option.icon}
              </div>

              {/* Content */}
              <h4 className="font-bold mb-1">{option.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">{option.description}</p>

              {/* Example message */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm italic">"{option.example}"</p>
              </div>

              {/* Loading state */}
              {isPending && selected !== option.id && (
                <div className="absolute inset-0 bg-background/50 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
