'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Users,
    Settings,
    LogOut,
    Bell,
    History,
    Puzzle,
    Flag,
    FileText,
    AlertTriangle,
    ChevronRight
} from 'lucide-react'
import { signOut } from '@/actions/auth'
import { AdminProfile } from '@/lib/admin-auth'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
    profile: AdminProfile
    alertsCount?: {
        critical: number
        warning: number
        total: number
    }
}

interface NavItem {
    label: string
    icon: React.ElementType
    href: string
    badge?: number
    badgeColor?: 'red' | 'yellow' | 'blue'
}

interface NavSection {
    title: string
    items: NavItem[]
}

export function AdminSidebar({ profile, alertsCount }: AdminSidebarProps) {
    const pathname = usePathname()

    const navSections: NavSection[] = [
        {
            title: 'Overview',
            items: [
                {
                    label: 'Dashboard',
                    icon: LayoutDashboard,
                    href: '/admin'
                },
                {
                    label: 'Alertas',
                    icon: AlertTriangle,
                    href: '/admin/alerts',
                    badge: alertsCount?.total || 0,
                    badgeColor: alertsCount?.critical ? 'red' : alertsCount?.warning ? 'yellow' : 'blue'
                }
            ]
        },
        {
            title: 'Gestao',
            items: [
                {
                    label: 'Igrejas',
                    icon: Building2,
                    href: '/admin/churches'
                },
                {
                    label: 'Assinaturas',
                    icon: CreditCard,
                    href: '/admin/subscriptions'
                },
                {
                    label: 'Usuarios',
                    icon: Users,
                    href: '/admin/users'
                }
            ]
        },
        {
            title: 'Sistema',
            items: [
                {
                    label: 'Integracoes',
                    icon: Puzzle,
                    href: '/admin/integrations'
                },
                {
                    label: 'Feature Flags',
                    icon: Flag,
                    href: '/admin/settings/feature-flags'
                },
                {
                    label: 'Auditoria',
                    icon: History,
                    href: '/admin/audit'
                }
            ]
        },
        {
            title: 'Configuracoes',
            items: [
                {
                    label: 'Planos',
                    icon: FileText,
                    href: '/admin/subscriptions/plans'
                },
                {
                    label: 'Sistema',
                    icon: Settings,
                    href: '/admin/settings'
                }
            ]
        }
    ]

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin'
        }
        return pathname.startsWith(href)
    }

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#0B0B0B] border-r border-[#2A2A2A]">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3 border-b border-[#2A2A2A]">
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
                    <span className="font-black text-lg leading-none tracking-tighter text-white uppercase">
                        Ekkle
                    </span>
                    <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider">
                        Admin Panel
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                {navSections.map((section) => (
                    <div key={section.title}>
                        <h3 className="px-3 mb-2 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                                            active
                                                ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                                                : 'text-[#A0A0A0] hover:bg-[#141414] hover:text-white'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 text-xs font-semibold rounded-full',
                                                    item.badgeColor === 'red' && 'bg-red-500/20 text-red-400',
                                                    item.badgeColor === 'yellow' && 'bg-yellow-500/20 text-yellow-400',
                                                    item.badgeColor === 'blue' && 'bg-blue-500/20 text-blue-400'
                                                )}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                        {active && (
                                            <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-[#2A2A2A]">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#D4AF37]">
                            {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {profile.full_name || 'Super Admin'}
                        </p>
                        <p className="text-xs text-[#A0A0A0] truncate">
                            {profile.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
