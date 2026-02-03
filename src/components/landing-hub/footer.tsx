'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Youtube, Mail } from 'lucide-react'

export const HubFooter = memo(function HubFooter() {
  return (
    <footer className="py-12 border-t border-[#0f3d3e]/10 bg-[#f7f1e8]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <Link href="/hub" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Ekkle" width={36} height={36} className="rounded-lg" />
              <span className="text-lg font-semibold text-[#0f3d3e]">Ekkle Hub</span>
            </Link>
            <p className="text-sm text-[#5c6f6b]">
              Um espaco para oracao, leitura da Biblia e conexao com comunidades locais.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#0f3d3e] mb-3">Navegacao</h4>
            <div className="grid gap-2 text-sm text-[#5c6f6b]">
              <a href="#oracao" className="hover:text-[#0f3d3e]">Oracao</a>
              <a href="#biblia" className="hover:text-[#0f3d3e]">Biblia</a>
              <a href="#comunidade" className="hover:text-[#0f3d3e]">Comunidade</a>
              <a href="#pastores" className="hover:text-[#0f3d3e]">Pastores</a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#0f3d3e] mb-3">Contato</h4>
            <div className="flex flex-col gap-2 text-sm text-[#5c6f6b]">
              <a href="mailto:contato@ekkle.com.br" className="inline-flex items-center gap-2 hover:text-[#0f3d3e]">
                <Mail className="w-4 h-4" />
                contato@ekkle.com.br
              </a>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="text-[#0f3d3e]/70 hover:text-[#0f3d3e]">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" aria-label="YouTube" className="text-[#0f3d3e]/70 hover:text-[#0f3d3e]">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#0f3d3e]/10 pt-6 text-xs text-[#5c6f6b] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>(c) {new Date().getFullYear()} Ekkle Hub. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link href="/termos" className="hover:text-[#0f3d3e]">Termos</Link>
            <Link href="/privacidade" className="hover:text-[#0f3d3e]">Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  )
})
