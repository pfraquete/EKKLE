'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getBadgeById, getBadgeUsers, searchMembersForBadge, assignBadge, removeBadge, type Badge } from '@/actions/badges'
import { Award, ArrowLeft, Search, UserPlus, UserMinus, Check, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface BadgeUser {
  id: string
  full_name: string
  photo_url: string | null
  earned_at: string
}

interface SearchResult {
  id: string
  full_name: string
  photo_url: string | null
  email: string | null
}

export default function AtribuirSeloPage() {
  const params = useParams()
  const badgeId = params.id as string
  
  const [badge, setBadge] = useState<Badge | null>(null)
  const [users, setUsers] = useState<BadgeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [badgeId])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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

  async function handleSearch() {
    setSearching(true)
    const { data, error } = await searchMembersForBadge(searchQuery)
    if (error) {
      toast.error(error)
    } else {
      // Filter out users who already have the badge
      const existingUserIds = new Set(users.map(u => u.id))
      setSearchResults((data || []).filter(u => !existingUserIds.has(u.id)))
    }
    setSearching(false)
  }

  async function handleAssign(userId: string, userName: string) {
    setAssigning(userId)
    const { success, error } = await assignBadge(userId, badgeId)
    if (error) {
      toast.error(error)
    } else {
      toast.success(`Selo atribuído a ${userName}`)
      // Add user to the list
      const user = searchResults.find(u => u.id === userId)
      if (user) {
        setUsers([{ 
          id: user.id, 
          full_name: user.full_name, 
          photo_url: user.photo_url,
          earned_at: new Date().toISOString()
        }, ...users])
        setSearchResults(searchResults.filter(u => u.id !== userId))
      }
    }
    setAssigning(null)
  }

  async function handleRemove(userId: string, userName: string) {
    if (!confirm(`Tem certeza que deseja remover o selo de ${userName}?`)) {
      return
    }

    setRemoving(userId)
    const { success, error } = await removeBadge(userId, badgeId)
    if (error) {
      toast.error(error)
    } else {
      toast.success(`Selo removido de ${userName}`)
      setUsers(users.filter(u => u.id !== userId))
    }
    setRemoving(null)
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
                  alt={badge.name}
                  width={24}
                  height={24}
                  className="rounded"
                />
              ) : (
                <Award className="h-6 w-6 text-amber-500" />
              )}
            </div>
            Atribuir Selo
          </h1>
          <p className="text-gray-text-muted mt-1">
            {badge?.name} • {users.length} membros com este selo
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-6">
        <h2 className="font-semibold text-gray-text mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-500" />
          Atribuir a Novos Membros
        </h2>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar membro por nome..."
            className="w-full pl-12 pr-4 py-3 bg-gray-bg border border-gray-border rounded-xl text-gray-text placeholder:text-gray-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-bg rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-border overflow-hidden">
                    {user.photo_url ? (
                      <Image
                        src={user.photo_url}
                        alt={user.full_name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-text-muted font-medium">
                        {user.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-text">{user.full_name}</p>
                    {user.email && (
                      <p className="text-sm text-gray-text-muted">{user.email}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAssign(user.id, user.full_name)}
                  disabled={assigning === user.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {assigning === user.id ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Atribuir
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
          <p className="mt-4 text-center text-gray-text-muted">
            Nenhum membro encontrado ou todos já possuem este selo
          </p>
        )}
      </div>

      {/* Current Users */}
      <div className="bg-gray-card border border-gray-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-border">
          <h2 className="font-semibold text-gray-text flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            Membros com este Selo ({users.length})
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center">
            <Award className="h-12 w-12 text-gray-text-muted mx-auto mb-3" />
            <p className="text-gray-text-muted">Nenhum membro possui este selo ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 hover:bg-gray-bg/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-border overflow-hidden">
                    {user.photo_url ? (
                      <Image
                        src={user.photo_url}
                        alt={user.full_name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-text-muted font-medium">
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
                <button
                  onClick={() => handleRemove(user.id, user.full_name)}
                  disabled={removing === user.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {removing === user.id ? (
                    <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Remover
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
