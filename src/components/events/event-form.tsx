'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EventData, createEvent, updateEvent } from '@/actions/events'
import { toast } from 'sonner'
import { Loader2, Calendar, MapPin, DollarSign, Users, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'

const eventSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_time: z.string().optional(),
  category: z.enum(['EVENT', 'COURSE', 'PRAYER_CAMPAIGN', 'SERVICE', 'COMMUNITY', 'OTHER']),
  requires_registration: z.boolean().default(false),
  is_paid: z.boolean().default(false),
  price: z.preprocess((val) => Number(val), z.number().min(0).optional()),
  capacity: z.preprocess((val) => val ? Number(val) : null, z.number().min(1).nullable().optional()),
  is_online: z.boolean().default(false),
  online_url: z.string().url('URL inválida').optional().or(z.literal('')),
  registration_link: z.string().url('URL inválida').optional().or(z.literal('')),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

type EventFormValues = z.infer<typeof eventSchema>

interface EventFormProps {
  initialData?: EventData
}

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const extractTime = (dateStr?: string | null) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toISOString().slice(11, 16)
    } catch {
      return ''
    }
  }

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      location: initialData?.location || '',
      start_date: initialData ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
      end_time: initialData?.end_time || extractTime(initialData?.end_date),
      category: initialData?.category || 'EVENT',
      requires_registration: initialData?.requires_registration || false,
      is_paid: initialData?.is_paid || false,
      price: initialData?.price || 0,
      capacity: initialData?.capacity || null,
      is_online: initialData?.is_online || false,
      online_url: initialData?.online_url || '',
      registration_link: initialData?.registration_link || '',
      image_url: initialData?.image_url || '',
    }
  })

  const category = form.watch('category')
  const isPaid = form.watch('is_paid')
  const isOnline = form.watch('is_online')
  const requiresRegistration = form.watch('requires_registration')

  const onSubmit = async (values: EventFormValues) => {
    setLoading(true)
    try {
      const payload = {
        ...values,
        price: values.is_paid ? values.price || 0 : 0,
        capacity: values.capacity || null,
        online_url: values.is_online ? values.online_url || null : null,
        registration_link: values.registration_link || null,
        description: values.description || null,
        location: values.location || null,
        end_time: values.end_time || null,
        image_url: values.image_url || null,
        recurrence_pattern: null, // Default
      }

      if (initialData) {
        await updateEvent(initialData.id, payload as any)
        toast.success('Atualizado com sucesso!')
      } else {
        await createEvent(payload as any)
        toast.success('Criado com sucesso!')
      }
      router.push('/dashboard/eventos')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Título do Evento</Label>
                <Input
                  {...form.register('title')}
                  placeholder="Ex: Culto da Família, Curso de Liderança..."
                  className="h-16 bg-muted/30 border-border/40 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 text-base text-foreground"
                />
                {form.formState.errors.title && <p className="text-red-500 text-xs font-bold uppercase tracking-wider ml-2">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Descrição</Label>
                <Textarea
                  {...form.register('description')}
                  placeholder="Detalhes sobre o evento..."
                  className="min-h-[150px] bg-muted/30 border-border/40 rounded-2xl p-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 text-base resize-none text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Data e Hora de Início</Label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <Input
                      {...form.register('start_date')}
                      type="datetime-local"
                      className="pl-14 h-16 bg-muted/30 border-border/40 rounded-2xl font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all block text-foreground"
                    />
                  </div>
                  {form.formState.errors.start_date && <p className="text-red-500 text-xs font-bold uppercase tracking-wider ml-2">{form.formState.errors.start_date.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Hora de Término (Opcional)</Label>
                  <Input
                    {...form.register('end_time')}
                    type="time"
                    className="h-16 bg-muted/30 border-border/40 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all block text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5" />
                Localização
              </h3>

              <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                <Switch
                  checked={isOnline}
                  onCheckedChange={(c) => form.setValue('is_online', c)}
                  className="data-[state=checked]:bg-primary"
                />
                <Label className="text-xs font-black uppercase tracking-widest cursor-pointer select-none">Este é um evento online?</Label>
              </div>

              {isOnline ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Link da Transmissão/Reunião</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <Input
                      {...form.register('online_url')}
                      placeholder="https://zoom.us/..."
                      className="pl-14 h-16 bg-muted/30 border-border/40 rounded-2xl font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Endereço / Local</Label>
                  <Input
                    {...form.register('location')}
                    placeholder="Ex: Auditório Principal"
                    className="h-16 bg-muted/30 border-border/40 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-6">
          <Card className="border-border/40 shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Categoria</Label>
                <Select value={category} onValueChange={(v) => form.setValue('category', v as EventFormValues['category'])}>
                  <SelectTrigger className="h-16 bg-muted/30 border-border/40 rounded-2xl px-6 font-bold transition-all text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40 rounded-2xl shadow-2xl">
                    <SelectItem value="EVENT" className="py-3 font-bold">Evento Geral</SelectItem>
                    <SelectItem value="COURSE" className="py-3 font-bold">Curso</SelectItem>
                    <SelectItem value="PRAYER_CAMPAIGN" className="py-3 font-bold">Campanha de Oração</SelectItem>
                    <SelectItem value="SERVICE" className="py-3 font-bold">Culto</SelectItem>
                    <SelectItem value="COMMUNITY" className="py-3 font-bold">Comunhão</SelectItem>
                    <SelectItem value="OTHER" className="py-3 font-bold">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <ImageUpload
                  value={form.watch('image_url') || ''}
                  onChange={(url) => form.setValue('image_url', url)}
                  bucket="event-images"
                  label="Imagem de Capa"
                  aspectRatio="video"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                <Users className="h-5 w-5" />
                Inscrição
              </h3>

              <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                <Switch
                  checked={requiresRegistration}
                  onCheckedChange={(c) => form.setValue('requires_registration', c)}
                  className="data-[state=checked]:bg-primary"
                />
                <Label className="text-xs font-black uppercase tracking-widest cursor-pointer select-none">Requer Inscrição?</Label>
              </div>

              {requiresRegistration && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Capacidade (Opcional)</Label>
                    <Input
                      {...form.register('capacity')}
                      type="number"
                      placeholder="Ilimitado"
                      className="h-14 bg-muted/30 border-border/40 rounded-xl px-4 font-bold transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Link Externo (Opcional)</Label>
                    <Input
                      {...form.register('registration_link')}
                      placeholder="Se vazio, usa inscrição interna"
                      className="h-14 bg-muted/30 border-border/40 rounded-xl px-4 font-bold transition-all text-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                    <Switch
                      checked={isPaid}
                      onCheckedChange={(c) => form.setValue('is_paid', c)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Label className="text-xs font-black uppercase tracking-widest cursor-pointer select-none">Possui Custo?</Label>
                  </div>

                  {isPaid && (
                    <div className="space-y-3 pl-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Valor (R$)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                        <Input
                          {...form.register('price')}
                          type="number"
                          step="0.01"
                          className="pl-12 h-14 bg-muted/30 border-border/40 rounded-xl font-bold transition-all text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-20 text-xs font-black uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : null}
            {initialData ? 'Salvar Alterações' : 'Criar Evento'}
          </Button>
        </div>
      </div>
    </form>
  )
}
