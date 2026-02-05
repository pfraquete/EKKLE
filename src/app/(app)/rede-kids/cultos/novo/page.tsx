'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Users,
  ClipboardList,
  Theater,
  MapPin,
  Youtube,
  Check,
  X,
} from 'lucide-react'
import { createKidsWorshipService } from '@/actions/kids-worship'
import { getChurchMembers } from '@/actions/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Member = {
  id: string
  full_name: string
  role: string
  photo_url?: string | null
}

export default function NovoCultoKidsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedTheaterCast, setSelectedTheaterCast] = useState<string[]>([])
  const [theaterSearch, setTheaterSearch] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_date: '',
    service_time: '',
    type: 'PRESENCIAL' as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO',
    location: '',
    youtube_url: '',
    is_published: false,
    theme: '',
    bible_verse: '',
    // Theater
    has_theater: false,
    theater_theme: '',
    theater_description: '',
    // Teams
    preacher_id: '',
    preacher_name: '',
    opening_id: '',
    offerings_id: '',
    praise_team: '',
    media_team: '',
    welcome_team: '',
    cleaning_team: '',
    cafeteria_team: '',
    communion_team: '',
  })

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

    try {
      const result = await createKidsWorshipService({
        title: formData.title,
        description: formData.description || null,
        service_date: formData.service_date,
        service_time: formData.service_time || null,
        type: formData.type,
        location: formData.location || null,
        youtube_url: formData.youtube_url || null,
        is_published: formData.is_published,
        theme: formData.theme || null,
        bible_verse: formData.bible_verse || null,
        has_theater: formData.has_theater,
        theater_theme: formData.theater_theme || null,
        theater_description: formData.theater_description || null,
        theater_cast_ids: selectedTheaterCast,
        preacher_id: formData.preacher_id || null,
        preacher_name: formData.preacher_name || null,
        opening_id: formData.opening_id || null,
        offerings_id: formData.offerings_id || null,
        praise_team: formData.praise_team || null,
        media_team: formData.media_team || null,
        welcome_team: formData.welcome_team || null,
        cleaning_team: formData.cleaning_team || null,
        cafeteria_team: formData.cafeteria_team || null,
        communion_team: formData.communion_team || null,
      })

      if (result.success) {
        toast.success('Culto kids criado com sucesso!')
        router.push('/rede-kids/cultos')
      } else {
        toast.error(result.error || 'Erro ao criar culto kids')
      }
    } catch (error) {
      toast.error('Erro ao criar culto kids')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheaterCast = (memberId: string) => {
    setSelectedTheaterCast(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(theaterSearch.toLowerCase())
  )

  const selectedMembers = members.filter(m => selectedTheaterCast.includes(m.id))

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/rede-kids/cultos"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Culto Kids</h1>
          <p className="text-muted-foreground">
            Agende um novo culto kids para a igreja
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-card border rounded-xl p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Título do Culto *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Culto Kids de Domingo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição do culto..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="service_date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data *
            </Label>
            <Input
              id="service_date"
              type="date"
              value={formData.service_date}
              onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horário
            </Label>
            <Input
              id="service_time"
              type="time"
              value={formData.service_time}
              onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO' })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            >
              <option value="PRESENCIAL">Presencial</option>
              <option value="ONLINE">Online</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
        </div>

        {formData.type !== 'ONLINE' && (
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Local
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Endereço do culto"
            />
          </div>
        )}

        {formData.type !== 'PRESENCIAL' && (
          <div className="space-y-2">
            <Label htmlFor="youtube_url" className="flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              URL do YouTube
            </Label>
            <Input
              id="youtube_url"
              type="url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="theme" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Tema
            </Label>
            <Input
              id="theme"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="Ex: O amor de Deus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bible_verse">Versículo Bíblico</Label>
            <Input
              id="bible_verse"
              value={formData.bible_verse}
              onChange={(e) => setFormData({ ...formData, bible_verse: e.target.value })}
              placeholder="Ex: João 3:16"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is_published"
            checked={formData.is_published}
            onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
          />
          <Label htmlFor="is_published">Publicar culto no site público</Label>
        </div>
      </div>

      {/* Theater Section */}
      <div className="bg-card border rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Theater className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-bold">Teatro</h2>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="has_theater">Com teatro?</Label>
            <Switch
              id="has_theater"
              checked={formData.has_theater}
              onCheckedChange={(checked) => setFormData({ ...formData, has_theater: checked })}
            />
          </div>
        </div>

        {formData.has_theater && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theater_theme">Tema do Teatro</Label>
                <Input
                  id="theater_theme"
                  value={formData.theater_theme}
                  onChange={(e) => setFormData({ ...formData, theater_theme: e.target.value })}
                  placeholder="Ex: A parábola do filho pródigo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theater_description">Descrição</Label>
                <Input
                  id="theater_description"
                  value={formData.theater_description}
                  onChange={(e) => setFormData({ ...formData, theater_description: e.target.value })}
                  placeholder="Breve descrição do teatro"
                />
              </div>
            </div>

            {/* Theater Cast Selection */}
            <div className="space-y-3">
              <Label>Elenco do Teatro</Label>
              
              {/* Selected members */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedMembers.map(member => (
                    <div
                      key={member.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm"
                    >
                      <span>{member.full_name}</span>
                      <button
                        type="button"
                        onClick={() => toggleTheaterCast(member.id)}
                        className="hover:bg-purple-500/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search */}
              <Input
                placeholder="Buscar irmãos para o teatro..."
                value={theaterSearch}
                onChange={(e) => setTheaterSearch(e.target.value)}
              />

              {/* Members list */}
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Nenhum membro encontrado
                  </div>
                ) : (
                  filteredMembers.slice(0, 20).map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleTheaterCast(member.id)}
                      className={`w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors ${
                        selectedTheaterCast.includes(member.id) ? 'bg-purple-500/10' : ''
                      }`}
                    >
                      <span className="text-sm">{member.full_name}</span>
                      {selectedTheaterCast.includes(member.id) && (
                        <Check className="w-4 h-4 text-purple-500" />
                      )}
                    </button>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedTheaterCast.length} membro(s) selecionado(s)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Teams Section */}
      <div className="bg-card border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Programação e Escala</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Palavra e Altar */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Palavra e Altar</h3>

            <div className="space-y-2">
              <Label htmlFor="preacher_id">Pregador (Membro)</Label>
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

            <div className="space-y-2">
              <Label htmlFor="preacher_name">Pregador (Convidado Externo)</Label>
              <Input
                id="preacher_name"
                value={formData.preacher_name}
                onChange={(e) => setFormData({ ...formData, preacher_name: e.target.value })}
                placeholder="Nome do pregador convidado"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening_id">Abertura</Label>
                <select
                  id="opening_id"
                  value={formData.opening_id}
                  onChange={(e) => setFormData({ ...formData, opening_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                >
                  <option value="">Selecione...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offerings_id">Ofertas</Label>
                <select
                  id="offerings_id"
                  value={formData.offerings_id}
                  onChange={(e) => setFormData({ ...formData, offerings_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                >
                  <option value="">Selecione...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Equipes e Apoio */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Equipes e Apoio</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="praise_team">Louvor</Label>
                <Input
                  id="praise_team"
                  value={formData.praise_team}
                  onChange={(e) => setFormData({ ...formData, praise_team: e.target.value })}
                  placeholder="Equipe ou nomes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media_team">Mídias</Label>
                <Input
                  id="media_team"
                  value={formData.media_team}
                  onChange={(e) => setFormData({ ...formData, media_team: e.target.value })}
                  placeholder="Proj., Live, Som"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome_team">Boas-vindas</Label>
                <Input
                  id="welcome_team"
                  value={formData.welcome_team}
                  onChange={(e) => setFormData({ ...formData, welcome_team: e.target.value })}
                  placeholder="Equipe de recepção"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="communion_team">Santa Ceia</Label>
                <Input
                  id="communion_team"
                  value={formData.communion_team}
                  onChange={(e) => setFormData({ ...formData, communion_team: e.target.value })}
                  placeholder="Responsáveis pela ceia"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cleaning_team">Limpeza</Label>
                <Input
                  id="cleaning_team"
                  value={formData.cleaning_team}
                  onChange={(e) => setFormData({ ...formData, cleaning_team: e.target.value })}
                  placeholder="Equipe de limpeza"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cafeteria_team">Cantina</Label>
                <Input
                  id="cafeteria_team"
                  value={formData.cafeteria_team}
                  onChange={(e) => setFormData({ ...formData, cafeteria_team: e.target.value })}
                  placeholder="Equipe da cantina"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link href="/rede-kids/cultos">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            'Criar Culto Kids'
          )}
        </Button>
      </div>
    </form>
  )
}
