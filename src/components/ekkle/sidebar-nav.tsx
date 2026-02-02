'use client'

import Link from 'next/link'
import { signOut } from '@/actions/auth'
import { usePathname } from 'next/navigation'
import { BookOpen, User, LogOut, Search, Radio, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EkkleSidebarNavProps {
    profile: {
        full_name?: string
        email?: string
    } | null
}

export function EkkleSidebarNav({ profile }: EkkleSidebarNavProps) {
    const pathname = usePathname()

    const navItems = [
        { href: '/ekkle/membro', label: 'Meu Perfil', icon: User },
        { href: '/ekkle/membro/igrejas', label: 'Pesquisar Igreja', icon: Search, highlight: true },
        { href: '/ekkle/membro/cursos', label: 'Cursos Ekkle', icon: BookOpen },
        { href: '/ekkle/membro/lives', label: 'Lives', icon: Radio },
        { href: '/ekkle/membro/biblia-oracao', label: 'Bíblia e Oração', icon: BookMarked },
    ]

    const renderNavItem = (item: { href: string; label: string; icon: typeof User; highlight?: boolean }) => {
        const Icon = item.icon
        const isActive = pathname === item.href ||
            (item.href !== '/ekkle/membro' && pathname.startsWith(item.href))

        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500 font-black text-xs uppercase tracking-[0.2em] group border",
                    isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30 scale-[1.05]'
                        : item.highlight
                            ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50'
                            : 'bg-transparent text-muted-foreground border-transparent hover:bg-card hover:text-primary hover:border-border/50'
                )}
            >
                <Icon className={cn(
                    "w-5 h-5 transition-transform duration-500",
                    isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-3'
                )} />
                <span>{item.label}</span>
            </Link>
        )
    }

    return (
        <nav className="space-y-4">
            {/* Welcome message */}
            <div className="px-6 py-4 mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Olá,</p>
                <p className="text-lg font-black text-foreground">
                    {profile?.full_name?.split(' ')[0] || 'Visitante'}
                </p>
                <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">
                    Encontre sua comunidade
                </p>
            </div>

            {/* Nav items */}
            {navItems.map(renderNavItem)}

            {/* Sign out */}
            <div className="pt-8 mt-8 border-t border-border/50">
                <form action={signOut}>
                    <button
                        type="submit"
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-destructive hover:bg-destructive/10 transition-all duration-300 font-black text-xs uppercase tracking-widest group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Sair da Conta</span>
                    </button>
                </form>
            </div>
        </nav>
    )
}
