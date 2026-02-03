'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BookOpen, Flame, HeartHandshake, ArrowRight } from 'lucide-react'
import { AnimatedSection, fadeInUp, fadeInRight } from '@/components/landing/animations'

const HIGHLIGHTS = [
  {
    icon: Flame,
    title: 'Oracao guiada',
    description: 'Salas, pedidos e parceiro de oracao para manter constancia.',
  },
  {
    icon: BookOpen,
    title: 'Leitura diaria',
    description: 'Planos prontos e progresso visivel em cada semana.',
  },
  {
    icon: HeartHandshake,
    title: 'Comunidade viva',
    description: 'Encontre uma igreja e caminhe junto com pessoas reais.',
  },
]

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="pt-28 md:pt-32 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,61,62,0.12),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(217,164,65,0.18),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(15,61,62,0.05)_1px,_transparent_1px),_linear-gradient(180deg,_rgba(15,61,62,0.05)_1px,_transparent_1px)] bg-[size:60px_60px]" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <AnimatedSection className="space-y-6">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-[#0f3d3e]/10 text-[#0f3d3e] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Ekkle Hub
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="hub-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0f3d3e] leading-tight"
            >
              Um lugar simples para orar, ler a Biblia e encontrar uma comunidade
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-base sm:text-lg text-[#415552] max-w-xl">
              Feito para quem ainda nao tem igreja. Comece pelo que voce mais precisa hoje e, quando estiver pronto, conecte-se com um pastor perto de voce.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/registro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f3d3e] text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-[#0f3d3e]/20"
              >
                Comecar no Hub
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ekkle/membro/abrir-igreja"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9a441] text-[#7a4f02] px-6 py-3 text-sm font-semibold bg-[#fff6df]"
              >
                Sou pastor
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="grid sm:grid-cols-3 gap-4 pt-2">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#0f3d3e]/10 bg-white/70 p-4 shadow-sm"
                >
                  <item.icon className="w-5 h-5 text-[#0f3d3e] mb-2" />
                  <h3 className="text-sm font-semibold text-[#0f3d3e]">{item.title}</h3>
                  <p className="text-xs text-[#5c6f6b] mt-1">{item.description}</p>
                </div>
              ))}
            </motion.div>
          </AnimatedSection>

          <motion.div
            variants={fadeInRight}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            <div className="rounded-[28px] overflow-hidden border border-[#0f3d3e]/10 bg-white shadow-xl">
              <Image
                src="/images/hub/prayer-group.jpeg"
                alt="Pessoas em oracao"
                width={640}
                height={720}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl border border-[#0f3d3e]/10 px-5 py-4 shadow-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d9a441] font-semibold">Hoje</p>
              <p className="text-sm font-semibold text-[#0f3d3e]">Leitura + Oracao em 12 min</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
})
