'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '#features', label: 'Recursos' },
  { href: '#screenshots', label: 'Sistema' },
  { href: '#pricing', label: 'Planos' },
  { href: '#testimonials', label: 'Depoimentos' },
  { href: '#faq', label: 'FAQ' },
]

export const LandingHeader = memo(function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#09090b]/95 backdrop-blur-lg border-b border-zinc-800'
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
                className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all hover:shadow-lg hover:shadow-[#66A5AD]/20 text-sm"
            >
              Começar Grátis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-zinc-800"
          >
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-zinc-400 hover:text-white transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
                <Link
                  href="/login"
                  className="text-zinc-400 hover:text-white transition-colors py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white px-5 py-3 rounded-xl font-medium text-center"
                >
                  Começar Grátis
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
})
