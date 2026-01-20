'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    Home,
    LayoutDashboard,
    Users,
    CalendarCheck2,
} from 'lucide-react'
import { Profile } from '@/actions/auth'

interface MobileNavProps {
    profile: Profile
}

export function MobileNav({ profile }: MobileNavProps) {
    const pathname = usePathname()
    const isPastor = profile.role === 'PASTOR'

    const links = [
        {
            icon: LayoutDashboard,
            label: 'Dash',
            href: '/dashboard',
            active: pathname === '/dashboard',
            show: true
        },
        {
            icon: Home,
            label: 'Célula',
            href: '/minha-celula',
            active: pathname.startsWith('/minha-celula'),
            show: profile.role === 'LEADER' || isPastor
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
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 z-50">
            {links.filter(l => l.show).map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-medium transition-colors",
                        link.active ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <link.icon className={cn("h-5 w-5", link.active ? "text-primary" : "text-muted-foreground")} />
                    {link.label}
                </Link>
            ))}
        </nav>
    )
}
