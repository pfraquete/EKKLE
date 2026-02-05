'use client'

import { useState, useEffect } from 'react'
import { getMyBadges, type Badge } from '@/actions/badges'
import { Award, User, Settings, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ProfileSidebarProps {
  user: {
    id: string
    full_name: string
    photo_url: string | null
    email?: string | null
    member_stage?: string
  }
  className?: string
}

export function ProfileSidebar({ user, className = '' }: ProfileSidebarProps) {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([])
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBadges()
  }, [])

  async function loadBadges() {
    const { data, error } = await getMyBadges()
    if (!error && data) {
      setEarnedBadges(data.earned)
      setAvailableBadges(data.available)
    }
    setLoading(false)
  }

  const memberStageLabels: Record<string, string> = {
    VISITOR: 'Visitante',
    REGULAR_VISITOR: 'Frequentador',
    MEMBER: 'Membro',
    GUARDIAN_ANGEL: 'Anjo da Guarda',
    TRAINING_LEADER: 'Líder em Treinamento',
    LEADER: 'Líder',
    PASTOR: 'Pastor'
  }

  return (
    <div className={`bg-gray-card border border-gray-border rounded-2xl overflow-hidden ${className}`}>
      {/* Profile Header */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-border overflow-hidden ring-2 ring-primary/30">
            {user.photo_url ? (
              <Image
                src={user.photo_url}
                alt={user.full_name}
                width={56}
                height={56}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-text-muted font-medium text-xl">
                {user.full_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-text truncate">{user.full_name}</p>
            {user.member_stage && (
              <p className="text-sm text-gray-text-muted">
                {memberStageLabels[user.member_stage] || user.member_stage}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/perfil"
          className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-gray-bg/50 hover:bg-gray-bg rounded-xl text-sm text-gray-text transition-colors"
        >
          <User className="h-4 w-4" />
          Meu Perfil
        </Link>
      </div>

      {/* Badges Section */}
      <div className="p-4 border-t border-gray-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-text">Meus Selos</span>
          </div>
          {earnedBadges.length > 0 && (
            <span className="text-xs text-gray-text-muted">
              {earnedBadges.length} conquistados
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : earnedBadges.length === 0 && availableBadges.length === 0 ? (
          <p className="text-sm text-gray-text-muted text-center py-4">
            Nenhum selo disponível ainda
          </p>
        ) : (
          <div className="space-y-3">
            {/* Earned Badges - Horizontal Scroll */}
            {earnedBadges.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {earnedBadges.map((badge) => (
                  <BadgeItem key={badge.id} badge={badge} earned />
                ))}
              </div>
            )}

            {/* Available Badges */}
            {availableBadges.length > 0 && (
              <div className="pt-2 border-t border-gray-border">
                <p className="text-xs text-gray-text-muted mb-2">Disponíveis</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {availableBadges.map((badge) => (
                    <BadgeItem key={badge.id} badge={badge} earned={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="p-4 border-t border-gray-border space-y-1">
        <Link
          href="/configuracoes"
          className="flex items-center justify-between p-2 hover:bg-gray-bg rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-text-muted" />
            <span className="text-sm text-gray-text">Configurações</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-text-muted group-hover:text-gray-text transition-colors" />
        </Link>
      </div>
    </div>
  )
}

interface BadgeItemProps {
  badge: Badge
  earned: boolean
}

function BadgeItem({ badge, earned }: BadgeItemProps) {
  return (
    <div
      className={`flex-shrink-0 relative group cursor-pointer ${!earned && 'opacity-50'}`}
      title={badge.name}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
        earned 
          ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30' 
          : 'bg-gray-bg border border-gray-border'
      }`}>
        {badge.image_url ? (
          <Image
            src={badge.image_url}
            alt={badge.name}
            width={40}
            height={40}
            className={`object-cover ${!earned && 'grayscale'}`}
          />
        ) : (
          <Award className={`h-5 w-5 ${earned ? 'text-amber-500' : 'text-gray-text-muted'}`} />
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-card border border-gray-border rounded-lg text-xs text-gray-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
        {badge.name}
        {!earned && <span className="text-gray-text-muted ml-1">(bloqueado)</span>}
      </div>
    </div>
  )
}
