'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createService, updateService } from '@/actions/services'
import { Loader2, ArrowLeft, Users, CalendarDays, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { getChurchMembers } from '@/actions/auth'

type Service = {
  id: string
  title: string
  description: string | null
  service_date: string
  service_time: string
  type: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO'
  location: string | null
  youtube_url: string | null
  zoom_meeting_id: string | null
  zoom_password: string | null
  is_published: boolean
  preacher_id?: string | null
  preacher_name?: string | null
  opening_id?: string | null
  offerings_id?: string | null
  praise_team?: string | null
  media_team?: string | null
  welcome_team?: string | null
  cleaning_team?: string | null
  cafeteria_team?: string | null
  communion_team?: string | null
}

type Member = {
  id: string
  full_name: string
  role: string
}

export function ServiceForm({ service }: { service?: Service }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: service?.title || '',
    description: service?.description || '',
    service_date: service?.service_date?.split('T')[0] || '',
    service_time: service?.service_time || '',
    type: service?.type || 'PRESENCIAL' as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO',
    location: service?.location || '',
    youtube_url: service?.youtube_url || '',
    zoom_meeting_id: service?.zoom_meeting_id || '',
    zoom_password: service?.zoom_password || '',
    is_published: service?.is_published || false,
    preacher_id: service?.preacher_id || '',
    preacher_name: service?.preacher_name || '',
    opening_id: service?.opening_id || '',
    offerings_id: service?.offerings_id || '',
    praise_team: service?.praise_team || '',
    media_team: service?.media_team || '',
    welcome_team: service?.welcome_team || '',
    cleaning_team: service?.cleaning_team || '',
    cafeteria_team: service?.cafeteria_team || '',
    communion_team: service?.communion_team || '',
  })
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    async function loadMembers() {
      const data = await getChurchMembers()
      setMembers(data)
    }
    loadMembers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = service
      ? await updateService(service.id, formData)
      : await createService(formData)

    if (result.success) {
      router.push('/dashboard/cultos')
      router.refresh()
    } else {
      setError(result.error || 'Erro ao salvar culto')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/cultos" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-black">{service ? 'Editar Culto' : 'Novo Culto'}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold mb-2">Título do Culto *</label>
          <input id="title" type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Culto de Domingo" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-2">Descrição</label>
          <textarea id="description" rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none outline-none transition-all" placeholder="Descreva o culto..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="service_date" className="block text-sm font-semibold mb-2">Data *</label>
            <input id="service_date" type="date" required value={formData.service_date} onChange={(e) => setFormData({ ...formData, service_date: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label htmlFor="service_time" className="block text-sm font-semibold mb-2">Horário *</label>
            <input id="service_time" type="time" required value={formData.service_time} onChange={(e) => setFormData({ ...formData, service_time: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-semibold mb-2">Tipo *</label>
            <select id="type" required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO' })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
              <option value="PRESENCIAL">Presencial</option>
              <option value="ONLINE">Online</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
        </div>

        {formData.type !== 'ONLINE' && (
          <div>
            <label htmlFor="location" className="block text-sm font-semibold mb-2">Local</label>
            <input id="location" type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Endereço do culto" />
          </div>
        )}

        {formData.type !== 'PRESENCIAL' && (
          <>
            <div>
              <label htmlFor="youtube_url" className="block text-sm font-semibold mb-2">URL do YouTube</label>
              <input id="youtube_url" type="url" value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="https://youtube.com/watch?v=..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="zoom_meeting_id" className="block text-sm font-semibold mb-2">Zoom Meeting ID</label>
                <input id="zoom_meeting_id" type="text" value={formData.zoom_meeting_id} onChange={(e) => setFormData({ ...formData, zoom_meeting_id: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="123 456 7890" />
              </div>
              <div>
                <label htmlFor="zoom_password" className="block text-sm font-semibold mb-2">Zoom Password</label>
                <input id="zoom_password" type="text" value={formData.zoom_password} onChange={(e) => setFormData({ ...formData, zoom_password: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="senha123" />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <input id="is_published" type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
          <label htmlFor="is_published" className="text-sm font-semibold">Publicar culto no site público</label>
        </div>
      </div>

      {/* Programação do Culto */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Programação e Escala</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Palavra e Altar</h3>

            <div>
              <label htmlFor="preacher_id" className="block text-sm font-semibold mb-2">Pregador (Membro)</label>
              <select
                id="preacher_id"
                value={formData.preacher_id}
                onChange={(e) => setFormData({ ...formData, preacher_id: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              >
                <option value="">Selecione um membro...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="preacher_name" className="block text-sm font-semibold mb-2">Pregador (Convidado Externo)</label>
              <input
                id="preacher_name"
                type="text"
                value={formData.preacher_name}
                onChange={(e) => setFormData({ ...formData, preacher_name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Nome do pregador convidado"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="opening_id" className="block text-sm font-semibold mb-2">Abertura</label>
                <select
                  id="opening_id"
                  value={formData.opening_id}
                  onChange={(e) => setFormData({ ...formData, opening_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="">Selecione...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="offerings_id" className="block text-sm font-semibold mb-2">Ofertas</label>
                <select
                  id="offerings_id"
                  value={formData.offerings_id}
                  onChange={(e) => setFormData({ ...formData, offerings_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="">Selecione...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Equipes e Apoio</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="praise_team" className="block text-sm font-semibold mb-2">Louvor</label>
                <input
                  id="praise_team"
                  type="text"
                  value={formData.praise_team}
                  onChange={(e) => setFormData({ ...formData, praise_team: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm outline-none transition-all"
                  placeholder="Equipe ou nomes"
                />
              </div>
              <div>
                <label htmlFor="media_team" className="block text-sm font-semibold mb-2">Mídias</label>
                <input
                  id="media_team"
                  type="text"
                  value={formData.media_team}
                  onChange={(e) => setFormData({ ...formData, media_team: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm outline-none transition-all"
                  placeholder="Proj., Live, Som"
                />
              </div>
              <div>
                <label htmlFor="welcome_team" className="block text-sm font-semibold mb-2">Boas-vindas</label>
                <input
                  id="welcome_team"
                  type="text"
                  value={formData.welcome_team}
                  onChange={(e) => setFormData({ ...formData, welcome_team: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm outline-none transition-all"
                  placeholder="Equipe de recepção"
                />
              </div>
              <div>
                <label htmlFor="communion_team" className="block text-sm font-semibold mb-2">Santa Ceia</label>
                <input
                  id="communion_team"
                  type="text"
                  value={formData.communion_team}
                  onChange={(e) => setFormData({ ...formData, communion_team: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm outline-none transition-all"
                  placeholder="Responsáveis pela ceia"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="cleaning_team" className="block text-sm font-semibold mb-2">Limpeza</label>
                <input
                  id="cleaning_team"
                  type="text"
                  value={formData.cleaning_team}
                  onChange={(e) => setFormData({ ...formData, cleaning_team: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm outline-none transition-all"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="cafeteria_team" className="block text-sm font-semibold mb-2">Cantina</label>
                <input
                  id="cafeteria_team"
                  type="text"
                  value={formData.cafeteria_team}
                  onChange={(e) => setFormData({ ...formData, cafeteria_team: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl shadow-primary/20">
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Salvando...' : service ? 'Atualizar Culto' : 'Criar Culto'}
        </button>
        <Link href="/dashboard/cultos" className="px-6 py-3 border border-border rounded-xl font-bold hover:bg-muted transition-colors">Cancelar</Link>
      </div>
    </form>
  )
}
