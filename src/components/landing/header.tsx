'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '#features', label: 'Recursos' },
  { href: '#screenshots', label: 'Sistema' },
  { href: '#pricing', label: 'Planos' },
  { href: '#testimonials', label: 'Depoimentos' },
  { href: '/hub', label: 'Ekkle Hub' },
  { href: '#faq', label: 'FAQ' },
]

export const LandingHeader = memo(function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen(prev => !prev), [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || mobileMenuOpen
          ? 'bg-[#0B0B0B] backdrop-blur-lg border-b border-[#2A2A2A]'
          : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Ekkle Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-xl font-bold text-white">Ekkle</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[#A0A0A0] hover:text-[#D4AF37] transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-[#BFBFBF] hover:text-white transition-colors text-sm font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#D4AF37] text-[#0B0B0B] px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all text-sm"
            >
              Começar Agora
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 -mr-2 touch-manipulation"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden py-4 border-t border-[#2A2A2A] bg-[#0B0B0B]"
            >
              <nav className="flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-[#A0A0A0] hover:text-[#D4AF37] active:text-[#D4AF37] transition-colors py-2 touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-3 pt-4 border-t border-[#2A2A2A]">
                  <Link
                    href="/login"
                    className="text-[#A0A0A0] hover:text-white transition-colors py-2 touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/registro"
                    className="bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#D4AF37] text-[#0B0B0B] px-5 py-3 rounded-xl font-semibold text-center touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    Começar Agora
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
})
