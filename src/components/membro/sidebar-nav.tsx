'use client'

import Link from 'next/link'
import { signOut } from '@/actions/auth'
import { usePathname } from 'next/navigation'
import { BookOpen, User, ShoppingBag, Package, Calendar, Home, LogOut, Search, Sparkles, Radio, Users, ClipboardList, Image } from 'lucide-react'

interface SidebarNavProps {
    profile: any
}

export function SidebarNav({ profile }: SidebarNavProps) {
    const pathname = usePathname()

    const isLeader = profile?.role === 'LEADER'

    const navItems = [
        { href: '/membro', label: 'Meu Perfil', icon: User },
        { href: '/membro/lives', label: 'Lives', icon: Radio },
        { href: '/membro/cursos', label: 'Meus Cursos', icon: BookOpen },
        { href: '/membro/eventos', label: 'Meus Eventos', icon: Calendar },
        ...(profile?.cell_id
            ? [
                { href: '/membro/minha-celula', label: 'Minha Célula', icon: Sparkles },
                // Leader-only menu items
                ...(isLeader ? [
                    { href: '/membro/minha-celula/reunioes', label: 'Reuniões', icon: ClipboardList },
                    { href: '/membro/minha-celula/membros', label: 'Membros', icon: Users },
                    { href: '/membro/minha-celula/album', label: 'Álbum de Fotos', icon: Image },
                ] : [
                    { href: '/membro/minha-celula/album', label: 'Álbum da Célula', icon: Image },
                ]),
                { href: '/membro/celulas', label: 'Explorar Células', icon: Search }
            ]
            : [
                { href: '/membro/celulas', label: 'Células', icon: Home }
            ]
        ),
        { href: '/membro/loja', label: 'Loja Virtual', icon: ShoppingBag },
        { href: '/membro/pedidos', label: 'Meus Pedidos', icon: Package },
    ]

    return (
        <nav className="space-y-4">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/membro' && pathname.startsWith(item.href))

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] group border ${isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30 scale-[1.05]'
                            : 'bg-transparent text-muted-foreground border-transparent hover:bg-card hover:text-primary hover:border-border/50'
                            }`}
                    >
                        <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-3'}`} />
                        <span>{item.label}</span>
                    </Link>
                )
            })}

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
