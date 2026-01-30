'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    User,
    Search,
    BookOpen,
    Radio,
    BookMarked,
} from 'lucide-react'

export function EkkleMobileNav() {
    const pathname = usePathname()

    const links = [
        {
            icon: User,
            label: 'Perfil',
            href: '/ekkle/membro',
            active: pathname === '/ekkle/membro',
        },
        {
            icon: Search,
            label: 'Igrejas',
            href: '/ekkle/membro/igrejas',
            active: pathname.startsWith('/ekkle/membro/igrejas'),
            highlight: true,
        },
        {
            icon: BookOpen,
            label: 'Cursos',
            href: '/ekkle/membro/cursos',
            active: pathname.startsWith('/ekkle/membro/cursos'),
        },
        {
            icon: Radio,
            label: 'Lives',
            href: '/ekkle/membro/lives',
            active: pathname.startsWith('/ekkle/membro/lives'),
        },
        {
            icon: BookMarked,
            label: 'Bíblia',
            href: '/ekkle/membro/biblia',
            active: pathname.startsWith('/ekkle/membro/biblia'),
        },
    ]

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all duration-200",
                            link.active
                                ? "text-primary"
                                : link.highlight
                                    ? "text-primary/70"
                                    : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-1.5 rounded-xl transition-all duration-200",
                            link.active && "bg-primary/10",
                            link.highlight && !link.active && "bg-primary/5"
                        )}>
                            <link.icon className={cn(
                                "h-5 w-5 transition-transform",
                                link.active && "scale-110"
                            )} />
                        </div>
                        <span className="uppercase tracking-wider">{link.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    )
}
