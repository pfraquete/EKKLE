'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Users,
    Settings,
    LogOut,
    History,
    Puzzle,
    Flag,
    FileText,
    AlertTriangle,
    Menu,
    X,
    ChevronRight,
    HeadphonesIcon
} from 'lucide-react'
import { signOut } from '@/actions/auth'
import { AdminProfile } from '@/lib/admin-auth'

interface AdminMobileNavProps {
    profile: AdminProfile
    alertsCount?: {
        critical: number
        warning: number
        total: number
    }
}

export function AdminMobileNav({ profile, alertsCount }: AdminMobileNavProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    const bottomLinks = [
        {
            icon: LayoutDashboard,
            label: 'Dash',
            href: '/admin',
            active: pathname === '/admin'
        },
        {
            icon: Building2,
            label: 'Igrejas',
            href: '/admin/churches',
            active: pathname.startsWith('/admin/churches')
        },
        {
            icon: Users,
            label: 'Usuarios',
            href: '/admin/users',
            active: pathname.startsWith('/admin/users')
        },
        {
            icon: HeadphonesIcon,
            label: 'Suporte',
            href: '/admin/support',
            active: pathname.startsWith('/admin/support')
        },
    ]

    const navSections = [
        {
            title: 'Overview',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
                {
                    label: 'Alertas',
                    icon: AlertTriangle,
                    href: '/admin/alerts',
                    badge: alertsCount?.total || 0,
                    badgeColor: alertsCount?.critical ? 'red' as const : 'yellow' as const
                }
            ]
        },
        {
            title: 'Gestao',
            items: [
                { label: 'Igrejas', icon: Building2, href: '/admin/churches' },
                { label: 'Assinaturas', icon: CreditCard, href: '/admin/subscriptions' },
                { label: 'Usuarios', icon: Users, href: '/admin/users' }
            ]
        },
        {
            title: 'Sistema',
            items: [
                { label: 'Integracoes', icon: Puzzle, href: '/admin/integrations' },
                { label: 'Feature Flags', icon: Flag, href: '/admin/settings/feature-flags' },
                { label: 'Auditoria', icon: History, href: '/admin/audit' }
            ]
        },
        {
            title: 'Suporte',
            items: [
                { label: 'Tickets', icon: HeadphonesIcon, href: '/admin/support' },
                { label: 'Comunicacoes', icon: FileText, href: '/admin/support/communications' }
            ]
        },
        {
            title: 'Configuracoes',
            items: [
                { label: 'Planos', icon: FileText, href: '/admin/subscriptions/plans' },
                { label: 'Sistema', icon: Settings, href: '/admin/settings' }
            ]
        }
    ]

    return (
        <>
            {/* Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 flex items-center justify-around px-2 z-50 safe-area-inset-bottom">
                {bottomLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-all duration-200",
                            link.active
                                ? "text-orange-500"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <link.icon className={cn(
                            "h-5 w-5 transition-colors",
                            link.active ? "text-orange-500" : "text-zinc-500"
                        )} />
                        <span>{link.label}</span>
                        {link.active && (
                            <span className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full" />
                        )}
                    </Link>
                ))}

                {/* Menu Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <Menu className="h-5 w-5" />
                    Menu
                </button>
            </nav>

            {/* Drawer Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Sidebar */}
            <aside
                className={cn(
                    "md:hidden fixed top-0 left-0 h-full w-72 bg-zinc-950 border-r border-zinc-800 z-[70] transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-zinc-800">
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
                        <div className="flex flex-col">
                            <span className="font-black text-base leading-none tracking-tighter text-white uppercase">Ekkle</span>
                            <span className="text-[9px] text-orange-500 font-semibold uppercase tracking-wider">Admin</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                    {navSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const active = isActive(item.href)
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                                                active
                                                    ? 'bg-orange-500/10 text-orange-500 font-medium'
                                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            <span className="flex-1">{item.label}</span>
                                            {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                                                <span
                                                    className={cn(
                                                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                                                        'badgeColor' in item && item.badgeColor === 'red'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                    )}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                            {active && <ChevronRight className="h-4 w-4" />}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer - User & Logout */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-500">
                                {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {profile.full_name || 'Super Admin'}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {profile.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair
                    </button>
                </div>
            </aside>
        </>
    )
}
