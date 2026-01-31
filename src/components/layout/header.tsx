'use client'

import { Profile } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell } from 'lucide-react'

interface HeaderProps {
    profile: Profile
}

export function Header({ profile }: HeaderProps) {
    return (
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 sm:px-6">
            <div>
                <h2 className="text-muted-foreground text-sm font-medium">
                    Bem-vindo de volta,
                </h2>
                <p className="font-bold text-foreground leading-tight">
                    {profile.full_name.split(' ')[0]}
                </p>
            </div>

            <div className="flex items-center gap-4">
                <button
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Notificações"
                >
                    <Bell className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-foreground leading-none">
                            {profile.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {profile.role === 'PASTOR' ? 'Pastor' : profile.role === 'LEADER' ? 'Líder' : 'Membro'}
                        </p>
                    </div>
                    <Avatar>
                        <AvatarImage src={profile.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
