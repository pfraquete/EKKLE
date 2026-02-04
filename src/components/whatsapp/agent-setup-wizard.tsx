'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Church,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  Phone,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'
import { updateAgentConfig, ServiceTime } from '@/actions/agent-config'
import { cn } from '@/lib/utils'

interface AgentSetupWizardProps {
  onComplete: () => void
  churchName?: string
}

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function AgentSetupWizard({ onComplete, churchName }: AgentSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  
  // Step 1: Church Info
  const [churchAddress, setChurchAddress] = useState('')
  const [churchCity, setChurchCity] = useState('')
  const [churchState, setChurchState] = useState('')
  const [churchPhone, setChurchPhone] = useState('')
  const [churchEmail, setChurchEmail] = useState('')
  
  // Step 2: Service Times
  const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([
    { day: 'Domingo', time: '10:00', name: 'Culto' }
  ])

  const addServiceTime = () => {
    setServiceTimes([...serviceTimes, { day: 'Domingo', time: '19:00', name: 'Culto' }])
  }

  const updateServiceTime = (index: number, field: keyof ServiceTime, value: string) => {
    const updated = [...serviceTimes]
    updated[index] = { ...updated[index], [field]: value }
    setServiceTimes(updated)
  }

  const removeServiceTime = (index: number) => {
    setServiceTimes(serviceTimes.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!churchAddress.trim()) {
        toast.error('Por favor, informe o endereço da igreja')
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleComplete = () => {
    startTransition(async () => {
      const result = await updateAgentConfig({
        church_address: churchAddress,
        church_city: churchCity,
        church_state: churchState,
        church_phone: churchPhone,
        church_email: churchEmail,
        service_times: serviceTimes,
        is_active: true,
        setup_completed: true,
        // Set friendly defaults
        tone: 'friendly',
        language_style: 'encouraging',
        emoji_usage: 'moderate',
        agent_name: `Assistente ${churchName || 'da Igreja'}`,
      })

      if (result.success) {
        toast.success('Configuração concluída! Seu assistente está pronto.')
        onComplete()
      } else {
        toast.error(result.error || 'Erro ao salvar configuração')
      }
    })
  }

  return (
    <Card className="border-2 border-primary/20 shadow-xl max-w-2xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                  step === s 
                    ? "bg-primary text-primary-foreground scale-110" 
                    : step > s 
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}>
                  {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "w-12 h-1 mx-1 rounded",
                    step > s ? "bg-emerald-500" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
        <CardTitle className="text-2xl font-black">
          {step === 1 && "Onde fica sua igreja?"}
          {step === 2 && "Quais são os horários dos cultos?"}
          {step === 3 && "Tudo pronto!"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Essas informações ajudam o assistente a responder perguntas sobre localização"}
          {step === 2 && "O assistente poderá informar os horários para quem perguntar"}
          {step === 3 && "Seu assistente está configurado e pronto para ajudar"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Step 1: Church Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Church className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold">Informações da Igreja</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={churchAddress}
                      onChange={(e) => setChurchAddress(e.target.value)}
                      placeholder="Rua, número, bairro"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={churchCity}
                      onChange={(e) => setChurchCity(e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={churchState}
                      onChange={(e) => setChurchState(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={churchPhone}
                        onChange={(e) => setChurchPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={churchEmail}
                        onChange={(e) => setChurchEmail(e.target.value)}
                        placeholder="contato@igreja.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Service Times */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold">Horários dos Cultos</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addServiceTime}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {serviceTimes.map((service, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <select
                      value={service.day}
                      onChange={(e) => updateServiceTime(index, 'day', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <Input
                      type="time"
                      value={service.time}
                      onChange={(e) => updateServiceTime(index, 'time', e.target.value)}
                      className="w-28"
                    />
                    <Input
                      value={service.name}
                      onChange={(e) => updateServiceTime(index, 'name', e.target.value)}
                      placeholder="Nome do culto"
                      className="flex-1"
                    />
                    {serviceTimes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeServiceTime(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Você pode adicionar mais horários ou editar depois nas configurações avançadas.
            </p>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300 text-center">
            <div className="flex justify-center">
              <div className="p-6 bg-emerald-500/10 rounded-full">
                <Sparkles className="h-16 w-16 text-emerald-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold">Seu assistente está configurado!</h3>
              <p className="text-muted-foreground">
                Ele já pode responder perguntas sobre localização, horários e informações da igreja.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-xl text-left space-y-2">
              <p className="font-medium text-sm">O assistente poderá responder:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ "Qual o endereço da igreja?"</li>
                <li>✓ "Que horas é o culto de domingo?"</li>
                <li>✓ "Como faço para participar?"</li>
                <li>✓ E muito mais...</li>
              </ul>
            </div>

            <Badge variant="secondary" className="text-sm">
              Você pode personalizar mais opções na aba "Agente IA"
            </Badge>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={handleNext}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={isPending}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Ativar Assistente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
