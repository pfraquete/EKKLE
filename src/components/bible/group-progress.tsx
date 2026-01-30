'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Flame, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GroupMemberProgress {
    member: {
        id: string
        profile_id: string
        current_streak: number
        profile?: {
            full_name: string
            avatar_url: string | null
        }
    }
    completedCount: number
    progressPercent: number
}

interface GroupProgressProps {
    members: GroupMemberProgress[]
    currentUserId?: string
    className?: string
}

export function GroupProgress({
    members,
    currentUserId,
    className
}: GroupProgressProps) {
    if (members.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p>Nenhum membro no plano ainda</p>
                </CardContent>
            </Card>
        )
    }

    // Sort by progress
    const sortedMembers = [...members].sort((a, b) => b.progressPercent - a.progressPercent)
    const topMember = sortedMembers[0]

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Progresso do Grupo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedMembers.map((item, index) => {
                    const isCurrentUser = item.member.profile_id === currentUserId
                    const isTop = index === 0 && item.progressPercent > 0
                    const initials = item.member.profile?.full_name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || '??'

                    return (
                        <div
                            key={item.member.id}
                            className={cn(
                                'flex items-center gap-3 p-2 rounded-lg',
                                isCurrentUser && 'bg-primary/5 border border-primary/20'
                            )}
                        >
                            <div className="relative">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={item.member.profile?.avatar_url || undefined} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                {isTop && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                                        <Trophy className="h-3 w-3 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        'font-medium truncate',
                                        isCurrentUser && 'text-primary'
                                    )}>
                                        {item.member.profile?.full_name || 'Membro'}
                                    </span>
                                    {isCurrentUser && (
                                        <Badge variant="secondary" className="text-xs">
                                            Voce
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Progress
                                        value={item.progressPercent}
                                        className="flex-1 h-2"
                                    />
                                    <span className="text-xs text-muted-foreground w-10 text-right">
                                        {item.progressPercent}%
                                    </span>
                                </div>
                            </div>

                            {item.member.current_streak > 0 && (
                                <div className="flex items-center gap-1 text-orange-500">
                                    <Flame className="h-4 w-4 fill-orange-400" />
                                    <span className="text-sm font-medium">
                                        {item.member.current_streak}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
