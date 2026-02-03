'use client'

import Link from 'next/link'
import { 
    Users, 
    Calendar, 
    BookOpen, 
    ShoppingBag, 
    Video, 
    MessageSquare,
    ChevronRight,
    Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
    title: string
    description: string
    icon: typeof Users
    href: string
    color: string
    gradient: string
    glow: string
}

const quickActions: QuickAction[] = [
    {
        title: 'Membros',
        description: 'Gerenciar pessoas',
        icon: Users,
        href: '/membros',
        color: 'text-blue-400',
        gradient: 'from-blue-500/20 to-blue-500/5',
        glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]'
    },
    {
        title: 'Eventos',
        description: 'Criar e gerenciar',
        icon: Calendar,
        href: '/dashboard/eventos',
        color: 'text-cyan-400',
        gradient: 'from-cyan-500/20 to-cyan-500/5',
        glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]'
    },
    {
        title: 'Cursos',
        description: 'Escola bíblica',
        icon: BookOpen,
        href: '/dashboard/cursos',
        color: 'text-purple-400',
        gradient: 'from-purple-500/20 to-purple-500/5',
        glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]'
    },
    {
        title: 'Loja',
        description: 'Produtos e pedidos',
        icon: ShoppingBag,
        href: '/dashboard/loja',
        color: 'text-orange-400',
        gradient: 'from-orange-500/20 to-orange-500/5',
        glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]'
    },
    {
        title: 'Lives',
        description: 'Transmissões ao vivo',
        icon: Video,
        href: '/dashboard/lives',
        color: 'text-red-400',
        gradient: 'from-red-500/20 to-red-500/5',
        glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]'
    },
    {
        title: 'Mensagens',
        description: 'Comunicação em massa',
        icon: MessageSquare,
        href: '/dashboard/comunicacoes',
        color: 'text-emerald-400',
        gradient: 'from-emerald-500/20 to-emerald-500/5',
        glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]'
    },
]

export function QuickActions() {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gold" />
                    <h2 className="text-sm font-black uppercase tracking-[0.15em] text-gray-text-secondary">
                        Acesso Rápido
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickActions.map((action, index) => (
                    <Link
                        key={action.title}
                        href={action.href}
                        className={cn(
                            'group relative overflow-hidden rounded-2xl p-4',
                            'bg-gradient-to-br from-black-surface/80 to-black-elevated/40',
                            'border border-gray-border/30 hover:border-gray-border/60',
                            'transition-all duration-300 hover:scale-[1.02]',
                            action.glow
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Gradient Overlay */}
                        <div className={cn(
                            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                            action.gradient
                        )} />

                        <div className="relative flex flex-col items-center text-center">
                            <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                                'bg-black-elevated/80 border border-gray-border/50',
                                'transition-all duration-300 group-hover:scale-110',
                                action.color
                            )}>
                                <action.icon className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-white-primary group-hover:text-gold transition-colors">
                                {action.title}
                            </p>
                            <p className="text-xs text-gray-text-muted mt-0.5 hidden sm:block">
                                {action.description}
                            </p>
                        </div>

                        {/* Arrow indicator */}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <ChevronRight className={cn('h-4 w-4', action.color)} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
