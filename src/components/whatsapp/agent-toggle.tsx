'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Bot, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { toggleAgentActive } from '@/actions/agent-config'
import { cn } from '@/lib/utils'

interface AgentToggleProps {
  initialIsActive: boolean
  churchName?: string
}

export function AgentToggle({ initialIsActive, churchName }: AgentToggleProps) {
  const [isActive, setIsActive] = useState(initialIsActive)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await toggleAgentActive(checked)
      
      if (result.success) {
        setIsActive(checked)
        toast.success(
          checked 
            ? 'Assistente ativado! Ele responderá automaticamente às mensagens.' 
            : 'Assistente desativado. As mensagens não serão respondidas automaticamente.'
        )
      } else {
        toast.error(result.error || 'Erro ao alterar status do assistente')
      }
    })
  }

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      isActive 
        ? "border-emerald-500/50 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" 
        : "border-muted bg-muted/20"
    )}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-emerald-500/10 text-emerald-600" 
                : "bg-muted text-muted-foreground"
            )}>
              {isActive ? (
                <Sparkles className="h-6 w-6" />
              ) : (
                <Bot className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                Assistente Virtual
                {isActive && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    ATIVO
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isActive 
                  ? "Respondendo automaticamente às mensagens do WhatsApp"
                  : "Clique para ativar as respostas automáticas"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className={cn(
                "data-[state=checked]:bg-emerald-500",
                "scale-125"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
