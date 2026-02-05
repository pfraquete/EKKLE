'use client'

import { useState, useEffect } from 'react'
import { getMyBadges, getUserBadges, type Badge, type UserBadge } from '@/actions/badges'
import { Award, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface UserBadgesDisplayProps {
  userId?: string // If provided, shows badges for this user. Otherwise shows current user's badges
  showAvailable?: boolean // Show badges that are always_visible but not yet earned
  compact?: boolean // Compact mode for sidebar
  className?: string
}

export function UserBadgesDisplay({ 
  userId, 
  showAvailable = true, 
  compact = false,
  className = '' 
}: UserBadgesDisplayProps) {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([])
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBadges()
  }, [userId])

  async function loadBadges() {
    setLoading(true)
    
    if (userId) {
      // Load badges for a specific user
      const { data, error } = await getUserBadges(userId)
      if (!error && data) {
        setEarnedBadges(data.map(ub => ub.badge!).filter(Boolean))
      }
    } else {
      // Load current user's badges
      const { data, error } = await getMyBadges()
      if (!error && data) {
        setEarnedBadges(data.earned)
        if (showAvailable) {
          setAvailableBadges(data.available)
        }
      }
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const allBadges = [...earnedBadges, ...availableBadges]

  if (allBadges.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-text">Selos</span>
          <span className="text-xs text-gray-text-muted">({earnedBadges.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {earnedBadges.slice(0, 6).map((badge) => (
            <div
              key={badge.id}
              className="relative group"
              title={badge.name}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center overflow-hidden border border-amber-500/30">
                {badge.image_url ? (
                  <Image
                    src={badge.image_url}
                    alt={badge.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <Award className="h-5 w-5 text-amber-500" />
                )}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-card border border-gray-border rounded-lg text-xs text-gray-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {badge.name}
              </div>
            </div>
          ))}
          {earnedBadges.length > 6 && (
            <div className="w-10 h-10 rounded-xl bg-gray-bg flex items-center justify-center text-xs font-medium text-gray-text-muted">
              +{earnedBadges.length - 6}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-card border border-gray-border rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <span className="font-medium text-gray-text">Selos Conquistados</span>
        </div>
        <span className="text-sm text-gray-text-muted">
          {earnedBadges.length} de {allBadges.length}
        </span>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {earnedBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} earned />
          ))}
        </div>
      )}

      {/* Available Badges (not earned yet) */}
      {availableBadges.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-border">
            <Lock className="h-4 w-4 text-gray-text-muted" />
            <span className="text-sm text-gray-text-muted">Disponíveis para conquistar</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned={false} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface BadgeCardProps {
  badge: Badge
  earned: boolean
}

function BadgeCard({ badge, earned }: BadgeCardProps) {
  const pageRoutes: Record<string, string> = {
    feed: '/feed',
    courses: '/cursos',
    events: '/eventos',
    cells: '/celulas',
    profile: '/perfil'
  }

  const href = pageRoutes[badge.opening_page] || '/feed'

  return (
    <Link
      href={href}
      className={`group relative flex flex-col items-center p-3 rounded-xl transition-all ${
        earned 
          ? 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/30' 
          : 'bg-gray-bg/50 hover:bg-gray-bg border border-gray-border opacity-60'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden mb-2 ${
        earned ? 'bg-amber-500/20' : 'bg-gray-border'
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
          <Award className={`h-6 w-6 ${earned ? 'text-amber-500' : 'text-gray-text-muted'}`} />
        )}
      </div>
      <span className={`text-xs font-medium text-center line-clamp-2 ${
        earned ? 'text-gray-text' : 'text-gray-text-muted'
      }`}>
        {badge.name}
      </span>
      
      {/* Lock icon for unavailable badges */}
      {!earned && (
        <div className="absolute top-1 right-1">
          <Lock className="h-3 w-3 text-gray-text-muted" />
        </div>
      )}

      {/* Tooltip with description */}
      {badge.description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-card border border-gray-border rounded-lg text-xs text-gray-text max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
          <p className="font-medium mb-1">{badge.name}</p>
          <p className="text-gray-text-muted">{badge.description}</p>
        </div>
      )}
    </Link>
  )
}

// Horizontal scroll version for feed sidebar
export function UserBadgesHorizontal({ className = '' }: { className?: string }) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBadges()
  }, [])

  async function loadBadges() {
    const { data, error } = await getMyBadges()
    if (!error && data) {
      setBadges([...data.earned, ...data.available])
    }
    setLoading(false)
  }

  if (loading || badges.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-gray-text">Meus Selos</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex-shrink-0 w-16 flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center overflow-hidden border border-amber-500/30 mb-1">
              {badge.image_url ? (
                <Image
                  src={badge.image_url}
                  alt={badge.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <Award className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <span className="text-[10px] text-gray-text-muted text-center line-clamp-1">
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
