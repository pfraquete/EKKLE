'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Instagram, Youtube, Mail, Phone } from 'lucide-react'
import { AnimatedSection, scaleIn } from './animations'

// =====================================================
// FINAL CTA SECTION
// =====================================================

export const FinalCTASection = memo(function FinalCTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <motion.div
            variants={scaleIn}
            className="relative bg-gradient-to-br from-[#D4AF37] via-[#B8962E] to-[#D4AF37] rounded-3xl p-12 md:p-16 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-[#0B0B0B] mb-6">
                Pronto para transformar sua igreja?
              </h2>
              <p className="text-xl text-[#0B0B0B]/80 mb-10">
                Junte-se a mais de 100 igrejas que já estão crescendo de forma organizada com o
                Ekkle. Somente o pastor paga — líderes e membros usam grátis!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/registro"
                  className="group bg-[#0B0B0B] text-[#D4AF37] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#141414] transition-colors flex items-center justify-center gap-2"
                >
                  Começar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://wa.me/5512996169767"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0B0B0B]/10 text-[#0B0B0B] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#0B0B0B]/20 transition-colors border border-[#0B0B0B]/20"
                >
                  Falar com Consultor
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
})

// =====================================================
// FOOTER
// =====================================================

const PRODUCT_LINKS = [
  { href: '#features', label: 'Recursos' },
  { href: '#screenshots', label: 'Sistema' },
  { href: '#pricing', label: 'Planos' },
  { href: '/hub', label: 'Ekkle Hub' },
  { href: '#faq', label: 'FAQ' },
]

export const LandingFooter = memo(function LandingFooter() {
  return (
    <footer className="py-16 border-t border-[#2A2A2A]">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="Ekkle Logo" width={40} height={40} className="object-contain" />
              <span className="text-xl font-bold text-white">Ekkle</span>
            </Link>
            <p className="text-[#A0A0A0] mb-6 max-w-md">
              Sistema completo de gestão e automação para igrejas. Transforme a forma como você cuida da sua comunidade.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-[#141414] rounded-lg flex items-center justify-center text-[#A0A0A0] hover:text-[#D4AF37] hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#141414] rounded-lg flex items-center justify-center text-[#A0A0A0] hover:text-[#D4AF37] hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-[#A0A0A0] hover:text-[#D4AF37] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contato@ekkle.com.br"
                  className="text-[#A0A0A0] hover:text-[#D4AF37] transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  contato@ekkle.com.br
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5512996169767"
                  className="text-[#A0A0A0] hover:text-[#D4AF37] transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A0A0A0] text-sm">
            © {new Date().getFullYear()} Ekkle. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/termos" className="text-[#A0A0A0] hover:text-[#D4AF37] text-sm transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-[#A0A0A0] hover:text-[#D4AF37] text-sm transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
})
