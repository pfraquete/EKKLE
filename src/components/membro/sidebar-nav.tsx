'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, User, ShoppingBag, Package, Calendar, Home, LogOut } from 'lucide-react'

const navItems = [
    { href: '/membro', label: 'Meu Perfil', icon: User },
    { href: '/membro/cursos', label: 'Meus Cursos', icon: BookOpen },
    { href: '/membro/eventos', label: 'Meus Eventos', icon: Calendar },
    { href: '/membro/celulas', label: 'Células', icon: Home },
    { href: '/membro/loja', label: 'Loja Virtual', icon: ShoppingBag },
    { href: '/membro/pedidos', label: 'Meus Pedidos', icon: Package },
]

export function SidebarNav() {
    const pathname = usePathname()

    return (
        <nav className="space-y-2">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/membro' && pathname.startsWith(item.href))

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-widest group border ${isActive
                                ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]'
                                : 'bg-transparent text-muted-foreground border-transparent hover:bg-card hover:text-primary hover:border-border/50'
                            }`}
                    >
                        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span>{item.label}</span>
                    </Link>
                )
            })}

            <div className="pt-8 mt-8 border-t border-border/50">
                <form action="/api/auth/signout" method="POST">
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
