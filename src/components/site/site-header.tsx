'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Church = {
    name: string
    logo_url: string | null
}

import { BrandingSettings } from '@/actions/branding'

export function SiteHeader({ church, branding }: { church: Church, branding?: BrandingSettings }) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const logoUrl = branding?.logo?.url || church.logo_url

    const links = [
        { href: '/', label: 'Início' },
        { href: '/sobre', label: 'Sobre' },
        { href: '/eventos', label: 'Eventos' },
        { href: '/cursos', label: 'Cursos' },
        { href: '/cultos', label: 'Cultos' },
        { href: '/lives', label: 'Lives' },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <header
            className={cn(
                "sticky top-0 z-50 transition-all duration-300",
                branding?.theme?.navStyle === 'blur' ? "bg-background/70 backdrop-blur-lg border-b border-border" :
                    branding?.theme?.navStyle === 'transparent' ? "bg-transparent border-none absolute w-full" :
                        "bg-background border-b border-border"
            )}
        >
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo and Church Name */}
                    <Link href="/" className="flex items-center gap-3 z-50 relative">
                        {logoUrl ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={logoUrl}
                                    alt={church.name}
                                    className="w-10 h-10 md:w-12 md:h-12 object-contain bg-muted"
                                    style={{ borderRadius: 'var(--radius-custom)' }}
                                />
                            </>
                        ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                                {church.name[0]}
                            </div>
                        )}
                        <span className="text-lg md:text-xl font-bold truncate max-w-[200px] md:max-w-none">
                            {church.name}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    isActive(link.href) ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/membro"
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                            Área do Membro
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-foreground z-50 relative"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-background z-40 md:hidden pt-24 px-4 pb-8">
                    <nav className="flex flex-col gap-4">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "p-4 rounded-lg text-lg font-medium transition-colors border border-border",
                                    isActive(link.href)
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/membro"
                            onClick={() => setIsOpen(false)}
                            className="mt-4 bg-primary text-primary-foreground p-4 rounded-lg text-center font-bold hover:bg-primary/90 transition-colors"
                        >
                            Área do Membro
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    )
}
