'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Play, Star } from 'lucide-react'

const STATS = [
  { value: '1.247', label: 'Membros', color: 'text-white' },
  { value: '48', label: 'Células', color: 'text-[#66A5AD]' },
  { value: '12', label: 'Eventos', color: 'text-[#B89A5F]' },
  { value: '+15%', label: 'Crescimento', color: 'text-green-400' },
]

const AVATARS = ['👨‍💼', '👩‍💼', '👨‍🦳', '👩', '👨']

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="pt-32 md:pt-40 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C2E4A]/20 to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#66A5AD]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#B89A5F]/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-full px-4 py-2 mb-8"
            >
              <Zap className="w-4 h-4 text-[#B89A5F]" />
              <span className="text-sm text-zinc-300">
                Sistema completo de gestão para igrejas
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Transforme a{' '}
              <span className="bg-gradient-to-r from-[#66A5AD] to-[#B89A5F] bg-clip-text text-transparent">
                gestão da sua igreja
              </span>{' '}
              com tecnologia
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Gerencie células, membros, eventos, loja virtual e comunicação em um único lugar.
              Automatize tarefas e foque no que realmente importa: as pessoas.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
            >
              <Link
                href="/registro"
                className="group bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:shadow-xl hover:shadow-[#66A5AD]/20 flex items-center justify-center gap-2"
              >
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#screenshots"
                className="group bg-zinc-800/50 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-800 transition-colors border border-zinc-700 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Ver Sistema
              </a>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-6 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3">
                {AVATARS.map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-[#09090b] flex items-center justify-center text-lg"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-white font-semibold">+100 igrejas</span>
                <span className="text-zinc-400"> já usam</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#B89A5F] text-[#B89A5F]" />
                ))}
                <span className="text-zinc-400 text-sm ml-1">4.9/5</span>
              </div>
            </motion.div>
          </div>

          {/* Right Image - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              <Image
                src="/images/landing/congregation.jpg"
                alt="Comunidade em adoração"
                width={700}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-transparent" />

              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-zinc-900/90 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-zinc-700"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                  {STATS.map((stat, i) => (
                    <div key={i}>
                      <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs text-zinc-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
})
