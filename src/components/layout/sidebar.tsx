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
    Wallet,
    MessageSquare,
    MessageCircle,
    Globe,
    Video,
    Radio,
    GraduationCap,
    Landmark,
    Shield,
    UserCheck,
    FileText,
    Baby,
    Newspaper,
    Award
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
    const isDiscipulador = profile.role === 'DISCIPULADOR'

    const routes = [
        {
            label: 'Feed',
            icon: Newspaper,
            href: '/feed',
            active: pathname === '/feed',
            show: true
        },
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard',
            show: isPastor
        },
        {
            label: 'Chat',
            icon: MessageCircle,
            href: '/dashboard/mensagens',
            active: pathname.startsWith('/dashboard/mensagens'),
            show: true
        },
        // Discipulador Routes
        {
            label: 'Supervisão',
            icon: Shield,
            href: '/supervisao',
            active: pathname === '/supervisao',
            show: isDiscipulador
        },
        {
            label: 'Meus Líderes',
            icon: UserCheck,
            href: '/supervisao/lideres',
            active: pathname.startsWith('/supervisao/lideres'),
            show: isDiscipulador
        },
        {
            label: 'Relatórios',
            icon: FileText,
            href: '/supervisao/relatorios',
            active: pathname.startsWith('/supervisao/relatorios'),
            show: isDiscipulador
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
            label: 'Discipuladores',
            icon: Shield,
            href: '/dashboard/discipuladores',
            active: pathname.startsWith('/dashboard/discipuladores'),
            show: isPastor
        },
        {
            label: 'Cultos',
            icon: Video,
            href: '/dashboard/cultos',
            active: pathname.startsWith('/dashboard/cultos'),
            show: isPastor
        },
        {
            label: 'Cultos',
            icon: Video,
            href: '/membro/cultos',
            active: pathname.startsWith('/membro/cultos'),
            show: !isPastor && profile.role === 'LEADER'
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
            label: 'Professores',
            icon: GraduationCap,
            href: '/dashboard/professores',
            active: pathname.startsWith('/dashboard/professores'),
            show: isPastor
        },
        {
            label: 'Lives',
            icon: Radio,
            href: '/dashboard/lives',
            active: pathname.startsWith('/dashboard/lives'),
            show: isPastor
        },
        {
            label: 'Comunicações',
            icon: MessageSquare,
            href: '/dashboard/comunicacoes',
            active: pathname.startsWith('/dashboard/comunicacoes'),
            show: isPastor
        },
        {
            label: 'Selos',
            icon: Award,
            href: '/dashboard/selos',
            active: pathname.startsWith('/dashboard/selos'),
            show: isPastor
        },
        {
            label: 'Financeiro',
            icon: Landmark,
            href: '/dashboard/financeiro',
            active: pathname.startsWith('/dashboard/financeiro'),
            show: isPastor || profile.is_finance_team
        },
        {
            label: 'Rede Kids',
            icon: Baby,
            href: '/rede-kids',
            active: pathname.startsWith('/rede-kids'),
            show: isPastor || profile.is_kids_network
        },
        {
            label: 'Configurações',
            icon: Settings,
            href: '/configuracoes',
            active: pathname.startsWith('/configuracoes'),
            show: isPastor
        }
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-black-deep border-r border-gray-border-subtle">
            {/* Logo Section */}
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
                    <span className="font-black text-lg leading-none tracking-tighter text-gold uppercase">Ekkle</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {routes.filter(r => r.show).map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                            ${route.active
                                ? 'bg-black-elevated text-gold font-semibold border-l-2 border-gold shadow-gold-glow-subtle'
                                : 'text-gray-text-secondary hover:bg-black-elevated hover:text-white-soft font-medium'
                            }
                        `}
                    >
                        <route.icon className={`h-5 w-5 transition-colors ${route.active ? 'text-gold' : 'text-gray-text-muted group-hover:text-white-soft'}`} />
                        <span>{route.label}</span>
                        {route.active && (
                            <div className="absolute inset-0 rounded-xl bg-gold/5 pointer-events-none" />
                        )}
                    </Link>
                ))}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-gray-border-subtle">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
