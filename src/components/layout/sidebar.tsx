'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Home,
    Settings,
    LogOut,
    CalendarCheck2,
    ShoppingBag,
    BookOpen,
    Wallet
} from 'lucide-react'
import { signOut } from '@/actions/auth'
import { Profile } from '@/actions/auth'

interface SidebarProps {
    profile: Profile
}

import Image from 'next/image'

export function Sidebar({ profile }: SidebarProps) {
    const pathname = usePathname()

    const isPastor = profile.role === 'PASTOR'

    const routes = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard',
            show: true
        },
        {
            label: 'Minha Célula',
            icon: Home,
            href: '/minha-celula',
            active: pathname.startsWith('/minha-celula'),
            show: profile.role === 'LEADER' || isPastor
        },
        {
            label: 'Células',
            icon: CalendarCheck2,
            href: '/celulas',
            active: pathname.startsWith('/celulas'),
            show: isPastor
        },
        {
            label: 'Membros',
            icon: Users,
            href: '/membros',
            active: pathname.startsWith('/membros'),
            show: isPastor
        },
        {
            label: 'Loja',
            icon: ShoppingBag,
            href: '/dashboard/loja',
            active: pathname.startsWith('/dashboard/loja'),
            show: isPastor
        },
        {
            label: 'Eventos',
            icon: CalendarCheck2,
            href: '/dashboard/eventos',
            active: pathname.startsWith('/dashboard/eventos'),
            show: isPastor
        },
        {
            label: 'Cursos',
            icon: BookOpen,
            href: '/dashboard/cursos',
            active: pathname.startsWith('/dashboard/cursos'),
            show: isPastor
        },
        {
            label: 'Financeiro',
            icon: Wallet,
            href: '/dashboard/financeiro',
            active: pathname.startsWith('/dashboard/financeiro'),
            show: isPastor
        },
        {
            label: 'Configurações',
            icon: Settings,
            href: '/configuracoes',
            active: pathname === '/configuracoes',
            show: true
        },
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
            <div className="p-6 flex items-center gap-3">
                <div className="relative w-10 h-10">
                    <Image
                        src="/logo.png"
                        alt="Ekkle Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-lg leading-none tracking-tighter text-sidebar-foreground uppercase">Ekkle</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {routes.filter(r => r.show).map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={`
                            flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group
                            ${route.active
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
                            }
                        `}
                    >
                        <route.icon className="h-5 w-5" />
                        {route.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
