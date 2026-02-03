'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { WebsiteSettings } from '@/types/site-settings'

type Church = {
  name: string
  logo_url: string | null
}

interface SiteHeaderProps {
  church: Church
  settings: WebsiteSettings
}

export function SiteHeader({ church, settings }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const { theme, header } = settings
  const logoUrl = church.logo_url

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { href: '/', label: 'Início' },
    { href: '/sobre', label: 'Sobre' },
    { href: '/eventos', label: 'Eventos' },
    { href: '/cursos', label: 'Cursos' },
    { href: '/cultos', label: 'Cultos' },
    { href: '/lives', label: 'Lives' },
  ]

  const isActive = (path: string) => pathname === path

  // Dynamic styles based on settings
  const headerBg = header.transparent && !scrolled
    ? 'bg-transparent'
    : scrolled
      ? 'bg-black/80 backdrop-blur-xl'
      : 'bg-black/50 backdrop-blur-lg'

  const borderStyle = scrolled ? 'border-b border-white/10' : 'border-b border-transparent'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        headerBg,
        borderStyle,
        header.sticky ? 'sticky' : 'absolute'
      )}
      style={{
        '--header-primary': theme.primaryColor,
        '--header-text': theme.textColor,
      } as React.CSSProperties}
    >
      <div className="container mx-auto px-6 py-4">
        <div className={cn(
          'flex items-center',
          header.logoPosition === 'center' ? 'justify-center' : 'justify-between'
        )}>
          {/* Logo and Church Name */}
          <Link 
            href="/" 
            className={cn(
              'flex items-center gap-3 z-50 relative group',
              header.logoPosition === 'center' && 'absolute left-6'
            )}
          >
            {logoUrl ? (
              <div className="relative">
                <Image
                  src={logoUrl}
                  alt={church.name}
                  width={48}
                  height={48}
                  className="w-11 h-11 md:w-12 md:h-12 object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                />
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `0 0 20px ${theme.primaryColor}40` }}
                />
              </div>
            ) : (
              <div 
                className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-300 group-hover:scale-105"
                style={{ 
                  backgroundColor: theme.primaryColor,
                  color: theme.backgroundColor,
                }}
              >
                {church.name[0]}
              </div>
            )}
            <span 
              className="text-lg md:text-xl font-bold truncate max-w-[180px] md:max-w-none transition-colors duration-300"
              style={{ color: theme.textColor }}
            >
              {church.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={cn(
            'hidden md:flex items-center gap-1',
            header.logoPosition === 'center' && 'mx-auto'
          )}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                  isActive(link.href) 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                )}
                style={{ 
                  color: isActive(link.href) ? theme.primaryColor : `${theme.textColor}99`,
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <Link
            href="/membro"
            className={cn(
              'hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105',
              header.logoPosition === 'center' && 'absolute right-6'
            )}
            style={{ 
              backgroundColor: theme.primaryColor,
              color: theme.backgroundColor,
            }}
          >
            Área do Membro
            <ChevronRight className="w-4 h-4" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 z-50 relative rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            style={{ 
              color: theme.textColor,
              backgroundColor: isOpen ? `${theme.primaryColor}20` : 'transparent',
            }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden transition-all duration-500',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="pt-24 px-6 pb-8 h-full overflow-y-auto">
          <nav className="flex flex-col gap-2">
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'p-4 rounded-2xl text-lg font-semibold transition-all duration-300 flex items-center justify-between',
                  isOpen && 'animate-in slide-in-from-right-4'
                )}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  backgroundColor: isActive(link.href) ? `${theme.primaryColor}15` : `${theme.textColor}08`,
                  color: isActive(link.href) ? theme.primaryColor : theme.textColor,
                  borderLeft: isActive(link.href) ? `3px solid ${theme.primaryColor}` : '3px solid transparent',
                }}
              >
                {link.label}
                <ChevronRight 
                  className="w-5 h-5 transition-transform" 
                  style={{ 
                    color: isActive(link.href) ? theme.primaryColor : `${theme.textColor}40`,
                  }}
                />
              </Link>
            ))}
          </nav>

          {/* Mobile CTA */}
          <Link
            href="/membro"
            onClick={() => setIsOpen(false)}
            className="mt-8 flex items-center justify-center gap-2 p-4 rounded-2xl font-bold text-lg transition-all duration-300"
            style={{ 
              backgroundColor: theme.primaryColor,
              color: theme.backgroundColor,
            }}
          >
            Área do Membro
            <ChevronRight className="w-5 h-5" />
          </Link>

          {/* Church Info in Mobile Menu */}
          <div className="mt-12 text-center opacity-50" style={{ color: theme.textColor }}>
            <p className="text-sm">{church.name}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
