'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Clock,
  MessageSquare,
  Zap,
  Save,
  Loader2,
  Smile,
  User,
  Calendar,
  Gift,
  Bell,
  UserPlus,
  UserX,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  Church,
  Users,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import {
  updateAgentConfig,
  AgentConfig,
  AgentTone,
  AgentLanguageStyle,
  AgentEmojiUsage,
  ServiceTime,
  LeaderContact
} from '@/actions/agent-config'

interface AgentConfigPanelProps {
  initialConfig: AgentConfig | null
}

const TONE_OPTIONS: { value: AgentTone; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Linguagem profissional e respeitosa' },
  { value: 'casual', label: 'Casual', description: 'Linguagem descontraída e amigável' },
  { value: 'friendly', label: 'Acolhedor', description: 'Tom caloroso e empático' },
  { value: 'professional', label: 'Profissional', description: 'Direto ao ponto, eficiente' },
]

const LANGUAGE_STYLE_OPTIONS: { value: AgentLanguageStyle; label: string; description: string }[] = [
  { value: 'direct', label: 'Direto', description: 'Respostas concisas e objetivas' },
  { value: 'detailed', label: 'Detalhado', description: 'Explicações completas e abrangentes' },
  { value: 'encouraging', label: 'Encorajador', description: 'Mensagens motivadoras e positivas' },
]

const EMOJI_OPTIONS: { value: AgentEmojiUsage; label: string; example: string }[] = [
  { value: 'none', label: 'Nenhum', example: 'Olá, como posso ajudar?' },
  { value: 'minimal', label: 'Mínimo', example: 'Olá! Como posso ajudar?' },
  { value: 'moderate', label: 'Moderado', example: 'Olá! 👋 Como posso ajudar?' },
  { value: 'frequent', label: 'Frequente', example: 'Olá! 👋😊 Como posso ajudar? 🙏' },
]

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

const DAYS_OF_WEEK = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function AgentConfigPanel({ initialConfig }: AgentConfigPanelProps) {
  const [config, setConfig] = useState<AgentConfig | null>(initialConfig)
  const [isPending, startTransition] = useTransition()
  const [hasChanges, setHasChanges] = useState(false)

  if (!config) {
    return (
      <Card className="border-none shadow-xl">
        <CardContent className="py-10 text-center">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-bold text-lg mb-2">Configuração não disponível</h3>
          <p className="text-muted-foreground">
            Não foi possível carregar as configurações do agente.
          </p>
        </CardContent>
      </Card>
    )
  }

  const updateField = <K extends keyof AgentConfig>(field: K, value: AgentConfig[K]) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : null)
    setHasChanges(true)
  }

  const toggleWorkingDay = (day: number) => {
    const newDays = config.working_days.includes(day)
      ? config.working_days.filter(d => d !== day)
      : [...config.working_days, day].sort((a, b) => a - b)
    updateField('working_days', newDays)
  }

  // Service Times handlers
  const addServiceTime = () => {
    const newServiceTime: ServiceTime = { day: 'Domingo', time: '10:00', name: 'Culto' }
    updateField('service_times', [...(config.service_times || []), newServiceTime])
  }

  const updateServiceTime = (index: number, field: keyof ServiceTime, value: string) => {
    const updated = [...(config.service_times || [])]
    updated[index] = { ...updated[index], [field]: value }
    updateField('service_times', updated)
  }

  const removeServiceTime = (index: number) => {
    const updated = (config.service_times || []).filter((_, i) => i !== index)
    updateField('service_times', updated)
  }

  // Leader Contacts handlers
  const addLeaderContact = () => {
    const newLeader: LeaderContact = { name: '', role: 'Líder de Célula', phone: '', area: '' }
    updateField('leaders_contacts', [...(config.leaders_contacts || []), newLeader])
  }

  const updateLeaderContact = (index: number, field: keyof LeaderContact, value: string) => {
    const updated = [...(config.leaders_contacts || [])]
    updated[index] = { ...updated[index], [field]: value }
    updateField('leaders_contacts', updated)
  }

  const removeLeaderContact = (index: number) => {
    const updated = (config.leaders_contacts || []).filter((_, i) => i !== index)
    updateField('leaders_contacts', updated)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateAgentConfig({
        agent_name: config.agent_name,
        tone: config.tone,
        language_style: config.language_style,
        emoji_usage: config.emoji_usage,
        working_hours_enabled: config.working_hours_enabled,
        working_hours_start: config.working_hours_start,
        working_hours_end: config.working_hours_end,
        working_days: config.working_days,
        timezone: config.timezone,
        outside_hours_message: config.outside_hours_message,
        first_contact_message: config.first_contact_message,
        fallback_message: config.fallback_message,
        auto_birthday_enabled: config.auto_birthday_enabled,
        auto_birthday_time: config.auto_birthday_time,
        auto_event_reminder_enabled: config.auto_event_reminder_enabled,
        auto_event_reminder_hours: config.auto_event_reminder_hours,
        auto_welcome_enabled: config.auto_welcome_enabled,
        auto_absence_followup_enabled: config.auto_absence_followup_enabled,
        auto_absence_followup_days: config.auto_absence_followup_days,
        // Church Information
        church_address: config.church_address,
        church_address_complement: config.church_address_complement,
        church_city: config.church_city,
        church_state: config.church_state,
        church_zip_code: config.church_zip_code,
        church_google_maps_link: config.church_google_maps_link,
        church_phone: config.church_phone,
        church_email: config.church_email,
        service_times: config.service_times,
        leaders_contacts: config.leaders_contacts,
        custom_info: config.custom_info,
      })

      if (result.success) {
        toast.success('Configurações salvas com sucesso!')
        setHasChanges(false)
      } else {
        toast.error(result.error || 'Erro ao salvar configurações')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-500" />
                Configurações do Agente IA
              </CardTitle>
              <CardDescription>
                Personalize o comportamento do assistente virtual da sua igreja.
              </CardDescription>
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className="font-bold"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="church-info" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="church-info" className="flex items-center gap-2">
                <Church className="h-4 w-4" />
                <span className="hidden sm:inline">Igreja</span>
              </TabsTrigger>
              <TabsTrigger value="personality" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Personalidade</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Horários</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Mensagens</span>
              </TabsTrigger>
              <TabsTrigger value="automations" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Automações</span>
              </TabsTrigger>
            </TabsList>

            {/* Church Info Tab */}
            <TabsContent value="church-info" className="space-y-6">
              {/* Info Banner */}
              <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-700">Informações para o Agente IA</h4>
                    <p className="text-sm text-blue-600/80 mt-1">
                      Preencha estas informações para que o agente possa responder perguntas sobre localização, 
                      horários dos cultos e contato dos líderes quando as pessoas entrarem em contato pelo WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Endereço da Igreja</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="church_address">Endereço</Label>
                    <Input
                      id="church_address"
                      value={config.church_address || ''}
                      onChange={(e) => updateField('church_address', e.target.value)}
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="church_address_complement">Complemento</Label>
                    <Input
                      id="church_address_complement"
                      value={config.church_address_complement || ''}
                      onChange={(e) => updateField('church_address_complement', e.target.value)}
                      placeholder="Sala, andar, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="church_city">Cidade</Label>
                    <Input
                      id="church_city"
                      value={config.church_city || ''}
                      onChange={(e) => updateField('church_city', e.target.value)}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="church_state">Estado</Label>
                    <Select
                      value={config.church_state || ''}
                      onValueChange={(value) => updateField('church_state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="church_zip_code">CEP</Label>
                    <Input
                      id="church_zip_code"
                      value={config.church_zip_code || ''}
                      onChange={(e) => updateField('church_zip_code', e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="church_google_maps_link">Link do Google Maps</Label>
                    <Input
                      id="church_google_maps_link"
                      value={config.church_google_maps_link || ''}
                      onChange={(e) => updateField('church_google_maps_link', e.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Cole o link de compartilhamento do Google Maps para facilitar a localização.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Contato da Igreja</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="church_phone">Telefone</Label>
                    <Input
                      id="church_phone"
                      value={config.church_phone || ''}
                      onChange={(e) => updateField('church_phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="church_email">Email</Label>
                    <Input
                      id="church_email"
                      type="email"
                      value={config.church_email || ''}
                      onChange={(e) => updateField('church_email', e.target.value)}
                      placeholder="contato@igreja.com.br"
                    />
                  </div>
                </div>
              </div>

              {/* Service Times Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Horários dos Cultos</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addServiceTime}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {(!config.service_times || config.service_times.length === 0) ? (
                  <div className="p-6 border-2 border-dashed border-border rounded-xl text-center">
                    <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Nenhum horário cadastrado. Clique em "Adicionar" para incluir os horários dos cultos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {config.service_times.map((service, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <Input
                            value={service.name}
                            onChange={(e) => updateServiceTime(index, 'name', e.target.value)}
                            placeholder="Nome do culto"
                          />
                          <Select
                            value={service.day}
                            onValueChange={(value) => updateServiceTime(index, 'day', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="time"
                            value={service.time}
                            onChange={(e) => updateServiceTime(index, 'time', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeServiceTime(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leaders Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Contatos dos Líderes</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addLeaderContact}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {(!config.leaders_contacts || config.leaders_contacts.length === 0) ? (
                  <div className="p-6 border-2 border-dashed border-border rounded-xl text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Nenhum líder cadastrado. Adicione os líderes para que o agente possa direcionar as pessoas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {config.leaders_contacts.map((leader, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Input
                            value={leader.name}
                            onChange={(e) => updateLeaderContact(index, 'name', e.target.value)}
                            placeholder="Nome"
                          />
                          <Input
                            value={leader.role}
                            onChange={(e) => updateLeaderContact(index, 'role', e.target.value)}
                            placeholder="Função (ex: Líder de Célula)"
                          />
                          <Input
                            value={leader.phone}
                            onChange={(e) => updateLeaderContact(index, 'phone', e.target.value)}
                            placeholder="Telefone"
                          />
                          <Input
                            value={leader.area}
                            onChange={(e) => updateLeaderContact(index, 'area', e.target.value)}
                            placeholder="Área/Região (opcional)"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLeaderContact(index)}
                          className="text-destructive hover:text-destructive mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Informações Adicionais</h3>
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    value={config.custom_info || ''}
                    onChange={(e) => updateField('custom_info', e.target.value)}
                    placeholder="Adicione qualquer informação extra que o agente deve saber para responder às pessoas. Ex: Estacionamento gratuito, acessibilidade, ministérios disponíveis, etc."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Estas informações serão usadas pelo agente para responder perguntas gerais sobre a igreja.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Personality Tab */}
            <TabsContent value="personality" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agent_name">Nome do Assistente</Label>
                  <Input
                    id="agent_name"
                    value={config.agent_name}
                    onChange={(e) => updateField('agent_name', e.target.value)}
                    placeholder="Ex: Assistente Igreja XYZ"
                  />
                  <p className="text-sm text-muted-foreground">
                    Como o assistente se apresentará nas conversas.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tom de Comunicação</Label>
                  <Select
                    value={config.tone}
                    onValueChange={(value: AgentTone) => updateField('tone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estilo de Linguagem</Label>
                  <Select
                    value={config.language_style}
                    onValueChange={(value: AgentLanguageStyle) => updateField('language_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_STYLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Uso de Emojis</Label>
                  <Select
                    value={config.emoji_usage}
                    onValueChange={(value: AgentEmojiUsage) => updateField('emoji_usage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOJI_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.example}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <div className="flex items-start gap-3">
                  <Smile className="h-5 w-5 text-indigo-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-indigo-700">Preview</h4>
                    <p className="text-sm text-indigo-600/80 mt-1">
                      {config.emoji_usage === 'frequent' && '👋 '}
                      Olá! Sou {config.agent_name}.
                      {config.emoji_usage === 'moderate' && ' 😊'}
                      {config.emoji_usage === 'frequent' && ' 🙏'}
                      {' '}Como posso ajudá-lo hoje?
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Hours Tab */}
            <TabsContent value="hours" className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Horário de Atendimento</Label>
                  <p className="text-sm text-muted-foreground">
                    Definir horários específicos para o agente responder.
                  </p>
                </div>
                <Switch
                  checked={config.working_hours_enabled}
                  onCheckedChange={(checked) => updateField('working_hours_enabled', checked)}
                />
              </div>

              {config.working_hours_enabled && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Horário de Início</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={config.working_hours_start}
                        onChange={(e) => updateField('working_hours_start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Horário de Término</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={config.working_hours_end}
                        onChange={(e) => updateField('working_hours_end', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de Atendimento</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={config.working_days.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleWorkingDay(day.value)}
                          className="min-w-[50px]"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select
                      value={config.timezone}
                      onValueChange={(value) => updateField('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                        <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                        <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                        <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-700">Fora do Horário</h4>
                        <p className="text-sm text-amber-600/80 mt-1">
                          Quando alguém enviar mensagem fora do horário configurado,
                          o agente enviará automaticamente a mensagem definida na aba &quot;Mensagens&quot;.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="outside_hours">Mensagem Fora do Horário</Label>
                  <Textarea
                    id="outside_hours"
                    value={config.outside_hours_message}
                    onChange={(e) => updateField('outside_hours_message', e.target.value)}
                    placeholder="Mensagem enviada fora do horário de atendimento..."
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enviada automaticamente quando alguém entra em contato fora do horário.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_contact">Mensagem de Primeiro Contato</Label>
                  <Textarea
                    id="first_contact"
                    value={config.first_contact_message}
                    onChange={(e) => updateField('first_contact_message', e.target.value)}
                    placeholder="Mensagem de boas-vindas para novos contatos..."
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enviada na primeira interação com um novo contato.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fallback">Mensagem de Fallback</Label>
                  <Textarea
                    id="fallback"
                    value={config.fallback_message}
                    onChange={(e) => updateField('fallback_message', e.target.value)}
                    placeholder="Mensagem enviada quando ocorre um erro..."
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enviada quando o agente não consegue processar a mensagem.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Automations Tab */}
            <TabsContent value="automations" className="space-y-6">
              {/* Birthday Automation */}
              <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-pink-500" />
                    </div>
                    <div>
                      <Label className="text-base font-bold">Parabéns de Aniversário</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar mensagem automática no aniversário dos membros.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.auto_birthday_enabled}
                    onCheckedChange={(checked) => updateField('auto_birthday_enabled', checked)}
                  />
                </div>
                {config.auto_birthday_enabled && (
                  <div className="pl-13 space-y-2">
                    <Label htmlFor="birthday_time">Horário de Envio</Label>
                    <Input
                      id="birthday_time"
                      type="time"
                      value={config.auto_birthday_time}
                      onChange={(e) => updateField('auto_birthday_time', e.target.value)}
                      className="max-w-[150px]"
                    />
                  </div>
                )}
              </div>

              {/* Event Reminder Automation */}
              <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <Label className="text-base font-bold">Lembrete de Eventos</Label>
                      <p className="text-sm text-muted-foreground">
                        Lembrar membros sobre eventos e reuniões.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.auto_event_reminder_enabled}
                    onCheckedChange={(checked) => updateField('auto_event_reminder_enabled', checked)}
                  />
                </div>
                {config.auto_event_reminder_enabled && (
                  <div className="pl-13 space-y-2">
                    <Label htmlFor="reminder_hours">Horas antes do evento</Label>
                    <Select
                      value={String(config.auto_event_reminder_hours)}
                      onValueChange={(value) => updateField('auto_event_reminder_hours', parseInt(value))}
                    >
                      <SelectTrigger className="max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora antes</SelectItem>
                        <SelectItem value="2">2 horas antes</SelectItem>
                        <SelectItem value="6">6 horas antes</SelectItem>
                        <SelectItem value="12">12 horas antes</SelectItem>
                        <SelectItem value="24">24 horas antes</SelectItem>
                        <SelectItem value="48">48 horas antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Welcome Automation */}
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <Label className="text-base font-bold">Boas-vindas Automático</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar mensagem de boas-vindas para novos membros.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.auto_welcome_enabled}
                    onCheckedChange={(checked) => updateField('auto_welcome_enabled', checked)}
                  />
                </div>
              </div>

              {/* Absence Follow-up Automation */}
              <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <Label className="text-base font-bold">Acompanhamento de Ausência</Label>
                      <p className="text-sm text-muted-foreground">
                        Entrar em contato com membros ausentes.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.auto_absence_followup_enabled}
                    onCheckedChange={(checked) => updateField('auto_absence_followup_enabled', checked)}
                  />
                </div>
                {config.auto_absence_followup_enabled && (
                  <div className="pl-13 space-y-2">
                    <Label htmlFor="absence_days">Dias de ausência para acionar</Label>
                    <Select
                      value={String(config.auto_absence_followup_days)}
                      onValueChange={(value) => updateField('auto_absence_followup_days', parseInt(value))}
                    >
                      <SelectTrigger className="max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="14">14 dias</SelectItem>
                        <SelectItem value="21">21 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
