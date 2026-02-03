'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatedSection, fadeInUp } from '@/components/landing/animations'

const FAQS = [
  {
    question: 'Preciso ter igreja para usar o Hub?',
    answer: 'Nao. O Hub foi criado para quem ainda nao esta em uma igreja. Voce pode orar, ler a Biblia e depois escolher uma comunidade.',
  },
  {
    question: 'Como funcionam as salas de oracao?',
    answer: 'Voce pode criar salas privadas, convidar pessoas e registrar pedidos. O Hub organiza tudo em um so lugar.',
  },
  {
    question: 'Os planos de leitura sao obrigatorios?',
    answer: 'Nao. Voce pode ler livremente, mas os planos ajudam a manter constancia e acompanhar o progresso.',
  },
  {
    question: 'Sou pastor. Preciso pagar para abrir uma igreja?',
    answer: 'Sim, existe um plano pastoral para acessar os recursos completos de gestao da igreja.',
  },
  {
    question: 'Posso migrar depois para uma igreja?',
    answer: 'Sim. Assim que voce encontrar uma igreja no Hub, voce pode solicitar entrada e continuar usando o sistema.',
  },
]

export const HubFAQSection = memo(function HubFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-16 bg-white/60">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection className="text-center mb-10">
          <motion.span variants={fadeInUp} className="text-xs uppercase tracking-[0.3em] text-[#7a4f02] font-semibold">
            FAQ
          </motion.span>
          <motion.h2 variants={fadeInUp} className="hub-heading text-2xl sm:text-3xl font-semibold text-[#0f3d3e] mt-3">
            Duvidas sobre o Ekkle Hub
          </motion.h2>
        </AnimatedSection>

        <AnimatedSection className="space-y-3">
          {FAQS.map((faq, index) => (
            <motion.div
              key={faq.question}
              variants={fadeInUp}
              className="rounded-2xl border border-[#0f3d3e]/10 bg-white"
            >
              <button
                className="w-full px-5 py-4 flex items-center justify-between text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="hub-heading text-sm font-semibold text-[#0f3d3e]">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-4 h-4 text-[#0f3d3e]/60" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#0f3d3e]/60" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-5 pb-4 text-sm text-[#5c6f6b]">
                  {faq.answer}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})
