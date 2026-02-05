'use client'

import { useState, useEffect } from 'react'
import { getBadges, deleteBadge, updateBadgeRelevance, type BadgeWithUsers } from '@/actions/badges'
import { Award, Plus, Pencil, Trash2, Users, Eye, EyeOff, GripVertical } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

export default function SelosPage() {
  const [badges, setBadges] = useState<BadgeWithUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadBadges()
  }, [])

  async function loadBadges() {
    setLoading(true)
    const { data, error } = await getBadges()
    if (error) {
      toast.error(error)
    } else {
      setBadges(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(badgeId: string, badgeName: string) {
    if (!confirm(`Tem certeza que deseja excluir o selo "${badgeName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeleting(badgeId)
    const { success, error } = await deleteBadge(badgeId)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Selo excluído com sucesso')
      setBadges(badges.filter(b => b.id !== badgeId))
    }
    setDeleting(null)
  }

  async function handleRelevanceChange(badgeId: string, newRelevance: number) {
    const { success, error } = await updateBadgeRelevance(badgeId, newRelevance)
    if (error) {
      toast.error(error)
    } else {
      setBadges(badges.map(b => 
        b.id === badgeId ? { ...b, relevance: newRelevance } : b
      ).sort((a, b) => b.relevance - a.relevance))
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-text flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            Selos e Conquistas
          </h1>
          <p className="text-gray-text-muted mt-1">
            Crie e gerencie selos para reconhecer e engajar os membros da sua igreja
          </p>
        </div>
        <Link
          href="/dashboard/selos/novo"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-5 w-5" />
          Novo Selo
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-card border border-gray-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-text">{badges.length}</p>
              <p className="text-sm text-gray-text-muted">Selos Criados</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-card border border-gray-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-text">
                {badges.reduce((acc, b) => acc + b.user_count, 0)}
              </p>
              <p className="text-sm text-gray-text-muted">Selos Atribuídos</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-card border border-gray-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Eye className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-text">
                {badges.filter(b => b.always_visible).length}
              </p>
              <p className="text-sm text-gray-text-muted">Sempre Visíveis</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-card border border-gray-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <EyeOff className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-text">
                {badges.filter(b => !b.always_visible).length}
              </p>
              <p className="text-sm text-gray-text-muted">Ocultos até Conquistar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Table */}
      <div className="bg-gray-card border border-gray-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-border">
          <h2 className="font-semibold text-gray-text">Lista de Selos</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-text-muted mt-2">Carregando selos...</p>
          </div>
        ) : badges.length === 0 ? (
          <div className="p-8 text-center">
            <Award className="h-12 w-12 text-gray-text-muted mx-auto mb-3" />
            <p className="text-gray-text-muted">Nenhum selo criado ainda</p>
            <Link
              href="/dashboard/selos/novo"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro selo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-bg/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-text-muted uppercase tracking-wider">
                    Imagem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-text-muted uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-text-muted uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-text-muted uppercase tracking-wider">
                    Relevância
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-text-muted uppercase tracking-wider">
                    Visibilidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-text-muted uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-text-muted uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {badges.map((badge) => (
                  <tr key={badge.id} className="hover:bg-gray-bg/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-bg flex items-center justify-center overflow-hidden">
                        {badge.image_url ? (
                          <Image
                            src={badge.image_url}
                            alt={badge.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <Award className="h-6 w-6 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-text">{badge.name}</p>
                        {badge.description && (
                          <p className="text-sm text-gray-text-muted line-clamp-1">
                            {badge.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/selos/${badge.id}/usuarios`}
                        className="flex items-center gap-2 text-gray-text hover:text-amber-500 transition-colors"
                      >
                        <Users className="h-4 w-4" />
                        <span>{badge.user_count}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-text-muted" />
                        <input
                          type="number"
                          value={badge.relevance}
                          onChange={(e) => handleRelevanceChange(badge.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-gray-bg border border-gray-border rounded-lg text-gray-text text-center text-sm"
                          min="0"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {badge.always_visible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm">
                          <Eye className="h-3 w-3" />
                          Sempre visível
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-bg text-gray-text-muted rounded-lg text-sm">
                          <EyeOff className="h-3 w-3" />
                          Oculto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-text-muted">
                      {new Date(badge.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/selos/${badge.id}/atribuir`}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Atribuir selo"
                        >
                          <Users className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/selos/${badge.id}/editar`}
                          className="p-2 text-gray-text-muted hover:text-gray-text hover:bg-gray-bg rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(badge.id, badge.name)}
                          disabled={deleting === badge.id}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          {deleting === badge.id ? (
                            <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-text flex items-center gap-2 mb-3">
          <Award className="h-5 w-5 text-amber-500" />
          Sobre o Sistema de Selos
        </h3>
        <div className="space-y-2 text-sm text-gray-text-muted">
          <p>
            Os selos são uma forma de reconhecer e engajar os membros da sua igreja. 
            Você pode criar selos para diferentes conquistas como batismo, conclusão de cursos, 
            participação em eventos, liderança de células, entre outros.
          </p>
          <p>
            <strong className="text-gray-text">Relevância:</strong> Define a ordem de exibição dos selos. 
            Quanto maior o número, mais destaque o selo terá no perfil do membro.
          </p>
          <p>
            <strong className="text-gray-text">Sempre Visível:</strong> Se ativado, o selo aparecerá 
            no perfil do membro mesmo que ele ainda não tenha conquistado, incentivando a participação.
          </p>
        </div>
      </div>
    </div>
  )
}
