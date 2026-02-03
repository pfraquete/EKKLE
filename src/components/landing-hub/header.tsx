'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '#oracao', label: 'Oracao' },
  { href: '#biblia', label: 'Biblia' },
  { href: '#comunidade', label: 'Comunidade' },
  { href: '#pastores', label: 'Pastores' },
  { href: '#faq', label: 'FAQ' },
]

export const HubHeader = memo(function HubHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#f7f1e8]/90 backdrop-blur border-b border-[#0f3d3e]/10"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/hub" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Ekkle" width={36} height={36} className="rounded-lg" />
            <span className="text-lg font-semibold tracking-tight text-[#0f3d3e]">Ekkle Hub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#0f3d3e]/80 hover:text-[#0f3d3e] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/registro"
              className="px-4 py-2 rounded-full text-sm font-semibold border border-[#0f3d3e]/20 text-[#0f3d3e] hover:bg-[#0f3d3e]/5 transition-colors"
            >
              Comecar no Hub
            </Link>
            <Link
              href="/ekkle/membro/abrir-igreja"
              className="px-4 py-2 rounded-full text-sm font-semibold border border-[#d9a441]/40 text-[#7a4f02] hover:bg-[#d9a441]/15 transition-colors"
            >
              Sou pastor
            </Link>
          </div>

          <button
            className="md:hidden text-[#0f3d3e] p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[#0f3d3e]/10">
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#0f3d3e]/80 hover:text-[#0f3d3e]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-[#0f3d3e]/10">
                <Link
                  href="/registro"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-[#0f3d3e]/20 text-[#0f3d3e] text-center"
                >
                  Comecar no Hub
                </Link>
                <Link
                  href="/ekkle/membro/abrir-igreja"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-[#d9a441]/40 text-[#7a4f02] text-center"
                >
                  Sou pastor
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </motion.header>
  )
})
