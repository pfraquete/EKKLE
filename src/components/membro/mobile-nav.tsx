'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/actions/auth'
import {
    User,
    Sparkles,
    BookOpen,
    ShoppingBag,
    Radio,
    Home,
    Menu,
    X,
    Wallet,
    BookMarked,
    Calendar,
    Package,
    LogOut,
    MessageCircle,
    ClipboardList,
    Users,
    Image,
    HandCoins,
    Video,
    Newspaper
} from 'lucide-react'

interface MobileNavProps {
    profile: {
        cell_id?: string | null
        role?: string
    } | null
}

export function MemberMobileNav({ profile }: MobileNavProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const hasCell = !!profile?.cell_id
    const isLeader = profile?.role === 'LEADER'

    // Links para o bottom nav (4 principais + menu)
    const bottomLinks = [
        {
            icon: User,
            label: 'Perfil',
            href: '/membro',
            active: pathname === '/membro',
            show: true
        },
        {
            icon: Newspaper,
            label: 'Feed',
            href: '/membro/feed',
            active: pathname.startsWith('/membro/feed'),
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
            icon: MessageCircle,
            label: 'Chat',
            href: '/membro/mensagens',
            active: pathname.startsWith('/membro/mensagens'),
            show: true
        },
    ]

    // Todos os links para o drawer
    const allLinks = [
        {
            icon: User,
            label: 'Meu Perfil',
            href: '/membro',
            active: pathname === '/membro',
            show: true
        },
        {
            icon: Newspaper,
            label: 'Feed',
            href: '/membro/feed',
            active: pathname.startsWith('/membro/feed'),
            show: true
        },
        {
            icon: MessageCircle,
            label: 'Chat',
            href: '/membro/mensagens',
            active: pathname.startsWith('/membro/mensagens'),
            show: true
        },
        {
            icon: Sparkles,
            label: 'Minha Célula',
            href: '/membro/minha-celula',
            active: pathname === '/membro/minha-celula',
            show: hasCell
        },
        // Sublinks da célula para líderes
        {
            icon: ClipboardList,
            label: 'Reuniões',
            href: '/membro/minha-celula/reunioes',
            active: pathname.startsWith('/membro/minha-celula/reunioes'),
            show: hasCell && isLeader,
            indent: true
        },
        {
            icon: Users,
            label: 'Membros da Célula',
            href: '/membro/minha-celula/membros',
            active: pathname.startsWith('/membro/minha-celula/membros'),
            show: hasCell && isLeader,
            indent: true
        },
        {
            icon: Image,
            label: 'Álbum de Fotos',
            href: '/membro/minha-celula/album',
            active: pathname.startsWith('/membro/minha-celula/album'),
            show: hasCell,
            indent: true
        },
        {
            icon: HandCoins,
            label: 'Caixa da Célula',
            href: '/membro/minha-celula/ofertas',
            active: pathname.startsWith('/membro/minha-celula/ofertas'),
            show: hasCell,
            indent: true
        },
        {
            icon: Home,
            label: 'Encontrar Célula',
            href: '/membro/celulas',
            active: pathname.startsWith('/membro/celulas'),
            show: !hasCell
        },
        // Link de Cultos para líderes
        {
            icon: Video,
            label: 'Cultos',
            href: '/membro/cultos',
            active: pathname.startsWith('/membro/cultos'),
            show: isLeader
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
            icon: BookMarked,
            label: 'Bíblia & Oração',
            href: '/membro/biblia-oracao',
            active: pathname.startsWith('/membro/biblia-oracao'),
            show: true
        },
        {
            icon: Wallet,
            label: 'Meus Dízimos',
            href: '/membro/dizimos',
            active: pathname.startsWith('/membro/dizimos'),
            show: true
        },
        {
            icon: Calendar,
            label: 'Eventos',
            href: '/eventos',
            active: pathname.startsWith('/eventos'),
            show: true
        },
        {
            icon: ShoppingBag,
            label: 'Loja',
            href: '/membro/loja',
            active: pathname.startsWith('/membro/loja'),
            show: true
        },
        {
            icon: Package,
            label: 'Meus Pedidos',
            href: '/membro/pedidos',
            active: pathname.startsWith('/membro/pedidos'),
            show: true
        },
    ]

    const visibleBottomLinks = bottomLinks.filter(l => l.show).slice(0, 4)
    const visibleAllLinks = allLinks.filter(l => l.show)

    return (
        <>
            {/* Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-inset-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {visibleBottomLinks.map((link) => (
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

                    {/* Menu Button */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                        <div className="p-1.5 rounded-xl">
                            <Menu className="h-5 w-5" />
                        </div>
                        <span className="uppercase tracking-wider">Menu</span>
                    </button>
                </div>
            </nav>

            {/* Drawer Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Sidebar */}
            <aside
                className={cn(
                    "lg:hidden fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-[70] transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-border">
                    <span className="font-black text-lg leading-none tracking-tighter uppercase">Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {visibleAllLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex items-center gap-3 py-3 rounded-xl transition-all duration-200",
                                link.indent ? "px-6 ml-3 border-l-2 border-border" : "px-3",
                                link.active
                                    ? link.indent
                                        ? 'bg-primary/10 text-primary font-semibold border-l-primary'
                                        : 'bg-primary text-primary-foreground font-semibold shadow-sm'
                                    : 'text-foreground/70 hover:bg-muted hover:text-foreground font-medium'
                            )}
                        >
                            <link.icon className={cn("h-5 w-5", link.indent && "h-4 w-4")} />
                            <span className={link.indent ? "text-sm" : ""}>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer - Back to Site & Logout */}
                <div className="p-4 border-t border-border space-y-2">
                    <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                    >
                        <LogOut className="h-5 w-5 rotate-180" />
                        Voltar ao Site
                    </Link>
                    <form action={signOut}>
                        <button
                            type="submit"
                            className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Sair da Conta
                        </button>
                    </form>
                </div>
            </aside>
        </>
    )
}
