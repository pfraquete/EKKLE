'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, Medal, Award, Star, Crown, Loader2
} from 'lucide-react'
import { getKidsRanking } from '@/actions/kids-gamification'

interface KidsRankingProps {
  limit?: number
}

interface RankedChild {
  id: string
  full_name: string
  photo_url: string | null
  total_points: number
  current_level: {
    name: string
    icon_name: string
    color: string
  } | null
}

export function KidsRanking({ limit = 10 }: KidsRankingProps) {
  const [ranking, setRanking] = useState<RankedChild[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRanking() {
      setLoading(true)
      const data = await getKidsRanking(limit)
      type RankingRow = Omit<RankedChild, 'current_level'> & {
        current_level: RankedChild['current_level'] | RankedChild['current_level'][]
      }
      const normalized = (data as RankingRow[]).map(child => ({
        ...child,
        current_level: Array.isArray(child.current_level)
          ? child.current_level[0] ?? null
          : child.current_level ?? null,
      }))
      setRanking(normalized)
      setLoading(false)
    }
    loadRanking()
  }, [limit])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
            {position}
          </span>
        )
    }
  }

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
      default:
        return 'bg-white'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ranking Kids
        </CardTitle>
        <CardDescription>
          Os campeões da fé
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma criança no ranking ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {ranking.map((child, index) => {
              const position = index + 1
              const initials = child.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <div
                  key={child.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-all hover:shadow-md ${getPositionStyle(position)}`}
                >
                  {/* Position */}
                  <div className="flex-shrink-0">
                    {getPositionIcon(position)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12 border-2 border-white shadow">
                    <AvatarImage src={child.photo_url || undefined} alt={child.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{child.full_name}</p>
                    {child.current_level && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${child.current_level.color}20`,
                          color: child.current_level.color
                        }}
                      >
                        {child.current_level.name}
                      </Badge>
                    )}
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-xl font-bold">{child.total_points}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
