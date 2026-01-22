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

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      location: initialData?.location || '',
      start_date: initialData ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
      end_time: initialData?.end_time || '',
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
      }

      if (initialData) {
        await updateEvent(initialData.id, payload)
        toast.success('Atualizado com sucesso!')
      } else {
        await createEvent(payload)
        toast.success('Criado com sucesso!')
      }
      router.push('/dashboard/eventos')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input {...form.register('title')} placeholder="Ex: Culto da Família, Curso de Liderança..." className="h-12 text-lg font-bold" />
                {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea {...form.register('description')} placeholder="Detalhes sobre o evento..." className="min-h-[150px] resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data e Hora de Início</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('start_date')} type="datetime-local" className="pl-10 h-12" />
                  </div>
                  {form.formState.errors.start_date && <p className="text-red-500 text-sm">{form.formState.errors.start_date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Hora de Término (Opcional)</Label>
                  <Input {...form.register('end_time')} type="time" className="h-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Localização
              </h3>

              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                <Switch checked={isOnline} onCheckedChange={(c) => form.setValue('is_online', c)} />
                <Label>Este é um evento online?</Label>
              </div>

              {isOnline ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Link da Transmissão/Reunião</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...form.register('online_url')} placeholder="https://zoom.us/..." className="pl-10 h-12" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Endereço / Local</Label>
                  <Input {...form.register('location')} placeholder="Ex: Auditório Principal" className="h-12" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => form.setValue('category', v as EventFormValues['category'])}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVENT">Evento Geral</SelectItem>
                    <SelectItem value="COURSE">Curso</SelectItem>
                    <SelectItem value="PRAYER_CAMPAIGN">Campanha de Oração</SelectItem>
                    <SelectItem value="SERVICE">Culto</SelectItem>
                    <SelectItem value="COMMUNITY">Comunhão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Imagem de Capa (URL)</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...form.register('image_url')} placeholder="https://..." className="pl-10 h-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Inscrição
              </h3>

              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                <Switch checked={requiresRegistration} onCheckedChange={(c) => form.setValue('requires_registration', c)} />
                <Label>Requer Inscrição?</Label>
              </div>

              {requiresRegistration && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Capacidade (Opcional)</Label>
                    <Input {...form.register('capacity')} type="number" placeholder="Ilimitado" className="h-12" />
                  </div>

                  <div className="space-y-2">
                    <Label>Link Externo (Opcional)</Label>
                    <Input {...form.register('registration_link')} placeholder="Se vazio, usa inscrição interna" className="h-12" />
                  </div>

                  <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                    <Switch checked={isPaid} onCheckedChange={(c) => form.setValue('is_paid', c)} />
                    <Label>Possui Custo?</Label>
                  </div>

                  {isPaid && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label>Valor (R$)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...form.register('price')} type="number" step="0.01" className="pl-10 h-12" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {initialData ? 'Salvar Alterações' : 'Criar Evento'}
          </Button>
        </div>
      </div>
    </form>
  )
}
