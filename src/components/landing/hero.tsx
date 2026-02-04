'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Play, Star, Users, CheckCircle2 } from 'lucide-react'

const STATS = [
  { value: '152', label: 'Membros', color: 'text-white' },
  { value: '24', label: 'Células', color: 'text-[#D4AF37]' },
  { value: '4', label: 'Eventos', color: 'text-[#F2D675]' },
  { value: '+15%', label: 'Crescimento', color: 'text-green-400' },
]

const AVATARS = ['👨‍💼', '👩‍💼', '👨‍🦳', '👩', '👨']

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="pt-32 md:pt-40 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] bg-[#B8962E]/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-full px-4 py-2 mb-8"
            >
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-[#F5F5F5]">
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
              <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#B8962E] bg-clip-text text-transparent">
                gestão da sua igreja
              </span>{' '}
              com tecnologia
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-[#A0A0A0] mb-10 max-w-xl mx-auto lg:mx-0"
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
                className="group bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#D4AF37] text-[#0B0B0B] px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all flex items-center justify-center gap-2"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#screenshots"
                className="group bg-[#141414] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A] flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Ver Sistema
              </a>
            </motion.div>

            {/* Destaque: Só o pastor paga */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex items-center gap-3 justify-center lg:justify-start mb-6 bg-[#141414]/50 border border-[#D4AF37]/20 rounded-xl px-4 py-3 max-w-fit mx-auto lg:mx-0"
            >
              <Users className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm text-[#F5F5F5]">
                <span className="font-semibold text-[#D4AF37]">Somente o pastor paga</span> — Líderes e membros usam grátis!
              </span>
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
                    className="w-10 h-10 rounded-full bg-[#141414] border-2 border-[#0B0B0B] flex items-center justify-center text-lg"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-white font-semibold">+100 igrejas</span>
                <span className="text-[#A0A0A0]"> já usam</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
                <span className="text-[#A0A0A0] text-sm ml-1">4.9/5</span>
              </div>
            </motion.div>
          </div>

          {/* Right Image - Dashboard Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/30 to-[#B8962E]/20 rounded-3xl blur-2xl scale-105" />
            
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-[#2A2A2A]">
              {/* Browser bar */}
              <div className="bg-[#1A1A1A] px-4 py-3 flex items-center gap-2 border-b border-[#2A2A2A]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#2A2A2A] rounded-lg px-4 py-1 text-sm text-[#A0A0A0]">
                    ekkle.com.br/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard Screenshot */}
              <Image
                src="/images/landing/dashboard-screenshot.png"
                alt="Dashboard do Ekkle - Sistema de Gestão para Igrejas"
                width={800}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />

              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-[#141414]/95 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#2A2A2A]"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                  {STATS.map((stat, i) => (
                    <div key={i}>
                      <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-[#A0A0A0]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute -left-4 top-1/4 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-2 shadow-xl hidden lg:flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm text-white">Dados em tempo real</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute -right-4 top-1/2 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-2 shadow-xl hidden lg:flex items-center gap-2"
            >
              <Zap className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm text-white">Automação WhatsApp</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
})
