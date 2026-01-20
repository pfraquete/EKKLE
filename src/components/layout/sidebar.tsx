'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Home,
    Settings,
    LogOut,
    CalendarCheck2
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
            label: 'Configurações',
            icon: Settings,
            href: '/configuracoes',
            active: pathname === '/configuracoes',
            show: true
        },
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
            <div className="p-6 flex items-center gap-3">
                <div className="relative w-10 h-10">
                    <Image
                        src="/logo.png"
                        alt="Videira SJC Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-lg leading-none tracking-tighter text-gray-900 uppercase">Videira</span>
                    <span className="font-bold text-[10px] text-primary tracking-[0.2em] uppercase">SJC</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {routes.filter(r => r.show).map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            route.active
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <route.icon className="h-5 w-5" />
                        {route.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
