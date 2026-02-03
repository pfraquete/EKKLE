'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    Home,
    LayoutDashboard,
    Users,
    CalendarCheck2,
    BookOpen,
    Menu,
    X,
    ShoppingBag,
    Wallet,
    MessageSquare,
    Video,
    Radio,
    GraduationCap,
    Landmark,
    Settings,
    LogOut,
    Baby,
    Newspaper
} from 'lucide-react'
import { Profile, signOut } from '@/actions/auth'

interface MobileNavProps {
    profile: Profile
}

export function MobileNav({ profile }: MobileNavProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const isPastor = profile.role === 'PASTOR'
    const isLeader = profile.role === 'LEADER'

    // Links para o bottom nav (apenas 4 principais)
    const bottomLinks = [
        {
            icon: Newspaper,
            label: 'Feed',
            href: '/feed',
            active: pathname === '/feed',
            show: true
        },
        {
            icon: LayoutDashboard,
            label: 'Dash',
            href: '/dashboard',
            active: pathname === '/dashboard',
            show: isPastor
        },
        {
            icon: Home,
            label: 'Célula',
            href: '/minha-celula',
            active: pathname.startsWith('/minha-celula'),
            show: isLeader || isPastor
        },
        {
            icon: CalendarCheck2,
            label: 'Células',
            href: '/celulas',
            active: pathname.startsWith('/celulas'),
            show: isPastor
        },
        {
            icon: Users,
            label: 'Membros',
            href: '/membros',
            active: pathname.startsWith('/membros'),
            show: isPastor
        },
    ].filter(l => l.show).slice(0, 4)

    // Todos os links para o drawer (menu completo)
    const allLinks = [
        {
            icon: Newspaper,
            label: 'Feed',
            href: '/feed',
            active: pathname === '/feed',
            show: true
        },
        {
            icon: LayoutDashboard,
            label: 'Dashboard',
            href: '/dashboard',
            active: pathname === '/dashboard',
            show: isPastor
        },
        {
            icon: Home,
            label: 'Minha Célula',
            href: '/minha-celula',
            active: pathname.startsWith('/minha-celula'),
            show: isLeader || isPastor
        },
        {
            icon: CalendarCheck2,
            label: 'Células',
            href: '/celulas',
            active: pathname.startsWith('/celulas'),
            show: isPastor
        },
        {
            icon: Users,
            label: 'Membros',
            href: '/membros',
            active: pathname.startsWith('/membros'),
            show: isPastor
        },
        {
            icon: Video,
            label: 'Cultos',
            href: isPastor ? '/dashboard/cultos' : '/membro/cultos',
            active: pathname.startsWith('/dashboard/cultos') || pathname.startsWith('/membro/cultos'),
            show: isPastor || isLeader
        },
        {
            icon: ShoppingBag,
            label: 'Loja',
            href: '/dashboard/loja',
            active: pathname.startsWith('/dashboard/loja'),
            show: isPastor
        },
        {
            icon: CalendarCheck2,
            label: 'Eventos',
            href: '/dashboard/eventos',
            active: pathname.startsWith('/dashboard/eventos'),
            show: isPastor
        },
        {
            icon: BookOpen,
            label: 'Cursos',
            href: '/dashboard/cursos',
            active: pathname.startsWith('/dashboard/cursos'),
            show: isPastor
        },
        {
            icon: GraduationCap,
            label: 'Professores',
            href: '/dashboard/professores',
            active: pathname.startsWith('/dashboard/professores'),
            show: isPastor
        },
        {
            icon: Radio,
            label: 'Lives',
            href: '/dashboard/lives',
            active: pathname.startsWith('/dashboard/lives'),
            show: isPastor
        },
        {
            icon: MessageSquare,
            label: 'Comunicações',
            href: '/dashboard/comunicacoes',
            active: pathname.startsWith('/dashboard/comunicacoes'),
            show: isPastor
        },
        {
            icon: Landmark,
            label: 'Financeiro',
            href: '/dashboard/financeiro',
            active: pathname.startsWith('/dashboard/financeiro'),
            show: isPastor || profile.is_finance_team
        },
        {
            icon: Baby,
            label: 'Rede Kids',
            href: '/rede-kids',
            active: pathname.startsWith('/rede-kids'),
            show: isPastor || profile.is_kids_network
        },
        {
            icon: Settings,
            label: 'Configurações',
            href: '/configuracoes',
            active: pathname.startsWith('/configuracoes'),
            show: isPastor
        }
    ]

    const visibleLinks = allLinks.filter(l => l.show)

    return (
        <>
            {/* Bottom Navigation - Dark Premium */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black-deep/95 backdrop-blur-sm border-t border-gray-border-subtle flex items-center justify-around px-2 z-50 safe-area-inset-bottom">
                {bottomLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-all duration-200",
                            link.active 
                                ? "text-gold" 
                                : "text-gray-text-muted hover:text-white-soft"
                        )}
                    >
                        <link.icon className={cn(
                            "h-5 w-5 transition-colors",
                            link.active ? "text-gold" : "text-gray-text-muted"
                        )} />
                        <span>{link.label}</span>
                        {link.active && (
                            <span className="absolute bottom-1 w-1 h-1 bg-gold rounded-full" />
                        )}
                    </Link>
                ))}

                {/* Menu Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium text-gray-text-muted hover:text-white-soft transition-colors"
                >
                    <Menu className="h-5 w-5" />
                    Menu
                </button>
            </nav>

            {/* Drawer Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black-absolute/80 backdrop-blur-sm z-[60] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Sidebar - Dark Premium */}
            <aside
                className={cn(
                    "md:hidden fixed top-0 left-0 h-full w-72 bg-black-deep border-r border-gray-border-subtle z-[70] transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-border-subtle">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/logo.png"
                                alt="Ekkle Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="font-black text-lg leading-none tracking-tighter text-gold uppercase">Ekkle</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl text-gray-text-secondary hover:text-white-primary hover:bg-black-elevated transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {visibleLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative",
                                link.active
                                    ? 'bg-black-elevated text-gold font-semibold border-l-2 border-gold'
                                    : 'text-gray-text-secondary hover:bg-black-elevated hover:text-white-soft font-medium'
                            )}
                        >
                            <link.icon className={cn(
                                "h-5 w-5 transition-colors",
                                link.active ? "text-gold" : "text-gray-text-muted"
                            )} />
                            {link.label}
                            {link.active && (
                                <div className="absolute inset-0 rounded-xl bg-gold/5 pointer-events-none" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer - Logout */}
                <div className="p-4 border-t border-gray-border-subtle">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair
                    </button>
                </div>
            </aside>
        </>
    )
}
