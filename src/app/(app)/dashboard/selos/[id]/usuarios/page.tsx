'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getBadgeById, getBadgeUsers, type Badge } from '@/actions/badges'
import { Award, ArrowLeft, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface BadgeUser {
  id: string
  full_name: string
  photo_url: string | null
  earned_at: string
}

export default function UsuariosSeloPage() {
  const params = useParams()
  const badgeId = params.id as string
  
  const [badge, setBadge] = useState<Badge | null>(null)
  const [users, setUsers] = useState<BadgeUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [badgeId])

  async function loadData() {
    setLoading(true)
    const [badgeResult, usersResult] = await Promise.all([
      getBadgeById(badgeId),
      getBadgeUsers(badgeId)
    ])

    if (badgeResult.error) {
      toast.error(badgeResult.error)
    } else {
      setBadge(badgeResult.data)
    }

    if (usersResult.error) {
      toast.error(usersResult.error)
    } else {
      setUsers(usersResult.data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-text-muted mt-2">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/selos"
          className="p-2 hover:bg-gray-bg rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-text-muted" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-text flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
              {badge?.image_url ? (
                <Image
                  src={badge.image_url}
                  alt={badge.name || ''}
                  width={24}
                  height={24}
                  className="rounded"
                />
              ) : (
                <Award className="h-6 w-6 text-amber-500" />
              )}
            </div>
            {badge?.name}
          </h1>
          <p className="text-gray-text-muted mt-1">
            {badge?.description || 'Sem descrição'}
          </p>
        </div>
        <Link
          href={`/dashboard/selos/${badgeId}/atribuir`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Users className="h-4 w-4" />
          Atribuir
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-card border border-gray-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-text">{users.length}</p>
              <p className="text-sm text-gray-text-muted">Membros com este selo</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-card border border-gray-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Calendar className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-text">
                {badge?.created_at ? new Date(badge.created_at).toLocaleDateString('pt-BR') : '-'}
              </p>
              <p className="text-sm text-gray-text-muted">Data de criação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-gray-card border border-gray-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-border">
          <h2 className="font-semibold text-gray-text">Membros</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-text-muted mx-auto mb-3" />
            <p className="text-gray-text-muted">Nenhum membro possui este selo ainda</p>
            <Link
              href={`/dashboard/selos/${badgeId}/atribuir`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              <Users className="h-4 w-4" />
              Atribuir selo
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-border">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/membros/${user.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-bg/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-border overflow-hidden">
                    {user.photo_url ? (
                      <Image
                        src={user.photo_url}
                        alt={user.full_name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-text-muted font-medium text-lg">
                        {user.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-text">{user.full_name}</p>
                    <p className="text-sm text-gray-text-muted">
                      Conquistado em {new Date(user.earned_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
