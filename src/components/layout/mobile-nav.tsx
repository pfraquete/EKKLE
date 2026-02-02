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
    Baby
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
            {/* Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 z-50 safe-area-inset-bottom">
                {bottomLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors",
                            link.active ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <link.icon className={cn("h-5 w-5", link.active ? "text-primary" : "text-muted-foreground")} />
                        {link.label}
                    </Link>
                ))}

                {/* Menu Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium text-muted-foreground transition-colors"
                >
                    <Menu className="h-5 w-5" />
                    Menu
                </button>
            </nav>

            {/* Drawer Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Sidebar */}
            <aside
                className={cn(
                    "md:hidden fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-[70] transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
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
                        <span className="font-black text-lg leading-none tracking-tighter text-sidebar-foreground uppercase">Ekkle</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                    >
                        <X className="h-5 w-5 text-sidebar-foreground" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {visibleLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                                link.active
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Footer - Logout */}
                <div className="p-4 border-t border-sidebar-border">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair
                    </button>
                </div>
            </aside>
        </>
    )
}
