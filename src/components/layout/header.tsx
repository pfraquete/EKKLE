'use client'

import { Profile } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Search } from 'lucide-react'

interface HeaderProps {
    profile: Profile
}

export function Header({ profile }: HeaderProps) {
    const roleLabels: Record<string, string> = {
        PASTOR: 'Pastor',
        LEADER: 'Líder',
        MEMBER: 'Membro',
        DISCIPULADOR: 'Discipulador'
    }

    return (
        <header className="h-16 border-b border-gray-border-subtle bg-black-deep/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 relative z-20">
            {/* Welcome Section */}
            <div>
                <h2 className="text-gray-text-secondary text-sm font-medium">
                    Bem-vindo de volta,
                </h2>
                <p className="font-bold text-white-primary leading-tight">
                    {profile.full_name.split(' ')[0]}
                </p>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Search Button (Desktop) */}
                <button
                    className="hidden sm:flex p-2.5 items-center justify-center text-gray-text-secondary hover:text-white-primary transition-all duration-200 rounded-xl hover:bg-black-elevated"
                    aria-label="Buscar"
                >
                    <Search className="h-5 w-5" />
                </button>

                {/* Notifications Button */}
                <button
                    className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-text-secondary hover:text-white-primary transition-all duration-200 rounded-xl hover:bg-black-elevated group"
                    aria-label="Notificações"
                >
                    <Bell className="h-5 w-5" />
                    {/* Notification Indicator */}
                    <span className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full animate-pulse" />
                </button>

                {/* Profile Section */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-border-subtle">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-white-primary leading-none">
                            {profile.full_name}
                        </p>
                        <p className="text-xs text-gray-text-muted mt-1">
                            {roleLabels[profile.role] || profile.role}
                        </p>
                    </div>
                    <Avatar className="ring-2 ring-gray-border hover:ring-gold/50 transition-all duration-200 cursor-pointer">
                        <AvatarImage src={profile.photo_url || undefined} />
                        <AvatarFallback className="bg-gold/10 text-gold font-bold">
                            {profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
