'use client'

import { AdminProfile } from '@/lib/admin-auth'
import { Bell, Search, AlertTriangle, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface AdminHeaderProps {
    profile: AdminProfile
    alertsCount?: {
        critical: number
        warning: number
        total: number
    }
}

export function AdminHeader({ profile, alertsCount }: AdminHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Implement global search
        console.log('Search:', searchQuery)
    }

    return (
        <header className="h-16 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar igrejas, usuarios, assinaturas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                    />
                </div>
            </form>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Alerts indicator */}
                {alertsCount && alertsCount.total > 0 && (
                    <Link
                        href="/admin/alerts"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-medium text-red-400">
                            {alertsCount.critical > 0
                                ? `${alertsCount.critical} critico${alertsCount.critical > 1 ? 's' : ''}`
                                : `${alertsCount.total} alerta${alertsCount.total > 1 ? 's' : ''}`
                            }
                        </span>
                    </Link>
                )}

                {/* Notifications */}
                <button
                    className="relative p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                    aria-label="Notificacoes"
                >
                    <Bell className="h-5 w-5" />
                </button>

                {/* User info */}
                <div className="flex items-center gap-3 pl-4 border-l border-zinc-700">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-zinc-200 leading-none">
                            {profile.full_name || 'Super Admin'}
                        </p>
                        <p className="text-xs text-orange-500 mt-1 font-medium">
                            Super Admin
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <span className="text-sm font-bold text-white">
                            {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SA'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    )
}
