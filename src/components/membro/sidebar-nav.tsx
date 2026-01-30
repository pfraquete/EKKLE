'use client'

import Link from 'next/link'
import { signOut } from '@/actions/auth'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookOpen, User, ShoppingBag, Package, Calendar, Home, LogOut, Search, Sparkles, Radio, Users, ClipboardList, Image, ChevronDown, Video, GraduationCap, HandCoins, Landmark, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
    profile: any
}

export function SidebarNav({ profile }: SidebarNavProps) {
    const pathname = usePathname()
    const isLeader = profile?.role === 'LEADER'
    const isTeacher = profile?.is_teacher === true || profile?.role === 'PASTOR'
    const isFinanceTeam = profile?.is_finance_team === true || profile?.role === 'PASTOR'
    const hasCell = !!profile?.cell_id

    // Check if current path is within cell section
    const isCellSection = pathname.startsWith('/membro/minha-celula')
    const [cellExpanded, setCellExpanded] = useState(isCellSection)

    // Update expanded state when pathname changes
    useEffect(() => {
        if (isCellSection) {
            setCellExpanded(true)
        }
    }, [isCellSection])

    // Sublinks for "Minha Célula"
    const cellSublinks = isLeader
        ? [
            { href: '/membro/minha-celula/reunioes', label: 'Reuniões', icon: ClipboardList },
            { href: '/membro/minha-celula/membros', label: 'Membros', icon: Users },
            { href: '/membro/minha-celula/album', label: 'Álbum de Fotos', icon: Image },
            { href: '/membro/minha-celula/ofertas', label: 'Caixa da Célula', icon: HandCoins },
        ]
        : [
            { href: '/membro/minha-celula/album', label: 'Álbum da Célula', icon: Image },
            { href: '/membro/minha-celula/ofertas', label: 'Caixa da Célula', icon: HandCoins },
        ]

    const mainNavItems = [
        { href: '/membro', label: 'Meu Perfil', icon: User },
        { href: '/membro/lives', label: 'Lives', icon: Radio },
        { href: '/membro/cursos', label: 'Meus Cursos', icon: BookOpen },
        { href: '/membro/biblia', label: 'Bíblia', icon: BookMarked },
        { href: '/membro/eventos', label: 'Meus Eventos', icon: Calendar },
    ]

    const afterCellItems = hasCell
        ? [{ href: '/membro/celulas', label: 'Explorar Células', icon: Search }]
        : [{ href: '/membro/celulas', label: 'Células', icon: Home }]

    // Leader-only items
    const leaderItems = isLeader
        ? [{ href: '/membro/cultos', label: 'Cultos', icon: Video }]
        : []

    // Teacher-only items
    const teacherItems = isTeacher
        ? [{ href: '/membro/professor', label: 'Área do Professor', icon: GraduationCap }]
        : []

    // Finance items (visible to all members)
    const financeItems = [
        { href: '/membro/dizimos', label: 'Dízimos e Ofertas', icon: HandCoins },
    ]

    // Finance team items (only for finance team members or pastors)
    const financeTeamItems = isFinanceTeam
        ? [{ href: '/membro/financeiro', label: 'Financeiro Igreja', icon: Landmark }]
        : []

    const bottomNavItems = [
        { href: '/membro/loja', label: 'Loja Virtual', icon: ShoppingBag },
        { href: '/membro/pedidos', label: 'Meus Pedidos', icon: Package },
    ]

    const renderNavItem = (item: { href: string; label: string; icon: any }) => {
        const Icon = item.icon
        const isActive = pathname === item.href ||
            (item.href !== '/membro' && pathname.startsWith(item.href) && !pathname.startsWith('/membro/minha-celula'))

        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] group border",
                    isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30 scale-[1.05]'
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
            {/* Main nav items */}
            {mainNavItems.map(renderNavItem)}

            {/* Minha Célula with sublinks (only if user has a cell) */}
            {hasCell && (
                <div className="space-y-1">
                    {/* Main cell link with expand toggle */}
                    <button
                        onClick={() => setCellExpanded(!cellExpanded)}
                        className={cn(
                            "w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] group border",
                            pathname === '/membro/minha-celula'
                                ? 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30 scale-[1.05]'
                                : isCellSection
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-card hover:text-primary hover:border-border/50'
                        )}
                    >
                        <Sparkles className={cn(
                            "w-5 h-5 transition-transform duration-500",
                            pathname === '/membro/minha-celula' ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-3'
                        )} />
                        <Link href="/membro/minha-celula" className="flex-1 text-left" onClick={(e) => e.stopPropagation()}>
                            Minha Célula
                        </Link>
                        <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-300",
                            cellExpanded && "rotate-180"
                        )} />
                    </button>

                    {/* Sublinks */}
                    <div className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        cellExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}>
                        <div className="pl-6 pt-2 space-y-1">
                            {cellSublinks.map((subitem) => {
                                const SubIcon = subitem.icon
                                const isSubActive = pathname === subitem.href

                                return (
                                    <Link
                                        key={subitem.href}
                                        href={subitem.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-[9px] uppercase tracking-[0.15em] group",
                                            isSubActive
                                                ? 'bg-primary/15 text-primary border-l-2 border-primary'
                                                : 'text-muted-foreground hover:bg-card hover:text-foreground border-l-2 border-transparent'
                                        )}
                                    >
                                        <SubIcon className={cn(
                                            "w-4 h-4 transition-transform duration-300",
                                            isSubActive ? 'scale-110' : 'group-hover:scale-110'
                                        )} />
                                        <span>{subitem.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* After cell items (Explorar Células) */}
            {afterCellItems.map(renderNavItem)}

            {/* Leader-only items (Cultos) */}
            {leaderItems.map(renderNavItem)}

            {/* Teacher-only items (Área do Professor) */}
            {teacherItems.map(renderNavItem)}

            {/* Finance items (Dízimos e Ofertas) */}
            {financeItems.map(renderNavItem)}

            {/* Finance team items (Financeiro Igreja) */}
            {financeTeamItems.map(renderNavItem)}

            {/* Bottom nav items */}
            {bottomNavItems.map(renderNavItem)}

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
