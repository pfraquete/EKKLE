'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    User,
    Sparkles,
    BookOpen,
    Calendar,
    ShoppingBag,
    Radio,
    Home,
    ClipboardList,
    Image,
    Users
} from 'lucide-react'

interface MobileNavProps {
    profile: {
        cell_id?: string | null
        role?: string
    }
}

export function MemberMobileNav({ profile }: MobileNavProps) {
    const pathname = usePathname()
    const isLeader = profile?.role === 'LEADER'
    const hasCell = !!profile?.cell_id

    // Definir links baseado no papel e se tem célula
    const links = [
        {
            icon: User,
            label: 'Perfil',
            href: '/membro',
            active: pathname === '/membro',
            show: true
        },
        {
            icon: Sparkles,
            label: 'Célula',
            href: '/membro/minha-celula',
            active: pathname.startsWith('/membro/minha-celula'),
            show: hasCell
        },
        {
            icon: Home,
            label: 'Células',
            href: '/membro/celulas',
            active: pathname.startsWith('/membro/celulas'),
            show: !hasCell
        },
        {
            icon: Radio,
            label: 'Lives',
            href: '/membro/lives',
            active: pathname.startsWith('/membro/lives'),
            show: true
        },
        {
            icon: BookOpen,
            label: 'Cursos',
            href: '/membro/cursos',
            active: pathname.startsWith('/membro/cursos'),
            show: true
        },
        {
            icon: ShoppingBag,
            label: 'Loja',
            href: '/membro/loja',
            active: pathname.startsWith('/membro/loja') || pathname.startsWith('/membro/pedidos'),
            show: true
        },
    ]

    const visibleLinks = links.filter(l => l.show).slice(0, 5)

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {visibleLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-bold transition-all duration-200",
                            link.active
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-1.5 rounded-xl transition-all duration-200",
                            link.active && "bg-primary/10"
                        )}>
                            <link.icon className={cn(
                                "h-5 w-5 transition-transform",
                                link.active && "scale-110"
                            )} />
                        </div>
                        <span className="uppercase tracking-wider">{link.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    )
}
