'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Flame,
  Mic,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  MapPin,
  Radio,
  MessageSquare,
  ArrowRight,
  Church,
  Sparkles,
} from 'lucide-react'
import { AnimatedSection, fadeInUp, staggerContainer, scaleIn } from '@/components/landing/animations'

const PRAYER_FEATURES = [
  { icon: Flame, title: 'Salas de oracao', description: 'Crie salas privadas ou abertas para intercessao.' },
  { icon: Users, title: 'Parceiro de oracao', description: 'Compartilhe pedidos com alguem de confianca.' },
  { icon: Mic, title: 'Audio e diario', description: 'Registre oracoes em audio e acompanhe sua evolucao.' },
]

export const PrayerSection = memo(function PrayerSection() {
  return (
    <section id="oracao" className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeInUp} className="space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-[#7a4f02] font-semibold">Oracao</span>
            <h2 className="hub-heading text-2xl sm:text-3xl font-semibold text-[#0f3d3e]">
              Um lugar seguro para conversar com Deus
            </h2>
            <p className="text-[#4b5f5c]">
              O Hub organiza seus pedidos, mostra o seu streak e ajuda a manter a constancia.
              Tudo com simplicidade e sem distracoes.
            </p>
            <motion.div variants={staggerContainer} className="space-y-4">
              {PRAYER_FEATURES.map((item) => (
                <motion.div key={item.title} variants={fadeInUp} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f3d3e]/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#0f3d3e]" />
                  </div>
                  <div>
                    <h3 className="hub-heading text-sm font-semibold text-[#0f3d3e]">{item.title}</h3>
                    <p className="text-sm text-[#5b6f6c]">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f3d3e]"
            >
              Quero comecar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div variants={scaleIn} className="relative">
            <div className="rounded-[26px] overflow-hidden border border-[#0f3d3e]/10 shadow-lg bg-white">
              <Image
                src="/images/hub/adoration.jpg"
                alt="Momento de oracao"
                width={600}
                height={540}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-4 right-6 bg-[#fff6df] border border-[#d9a441]/30 rounded-2xl px-4 py-3 shadow-md">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a4f02] font-semibold">Streak</p>
              <p className="text-sm font-semibold text-[#7a4f02]">6 dias seguidos</p>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
})

const BIBLE_FEATURES = [
  { icon: BookOpen, title: 'Planos prontos', description: 'Escolha um plano e siga passo a passo.' },
  { icon: Calendar, title: 'Leitura diaria', description: 'Texto do dia e progresso visivel.' },
  { icon: Sparkles, title: 'Devocionais curtos', description: 'Reflexoes leves para manter foco.' },
]

export const BibleSection = memo(function BibleSection() {
  return (
    <section id="biblia" className="py-16 bg-white/60">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          <motion.div variants={scaleIn} className="relative">
            <div className="rounded-[26px] overflow-hidden border border-[#0f3d3e]/10 shadow-lg bg-white">
              <Image
                src="/images/hub/bible-study.jpg"
                alt="Leitura da Biblia"
                width={600}
                height={540}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -top-5 left-6 bg-white border border-[#0f3d3e]/10 rounded-2xl px-4 py-3 shadow-md">
              <p className="text-xs uppercase tracking-[0.2em] text-[#0f3d3e] font-semibold">Hoje</p>
              <p className="text-sm font-semibold text-[#0f3d3e]">Salmos 23</p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-[#0f3d3e] font-semibold">Biblia</span>
            <h2 className="hub-heading text-2xl sm:text-3xl font-semibold text-[#0f3d3e]">
              Leitura guiada, sem pressa e sem culpa
            </h2>
            <p className="text-[#4b5f5c]">
              Escolha um plano e siga no seu ritmo. O Hub mostra seu progresso e te lembra do que importa: consistencia.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {BIBLE_FEATURES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#0f3d3e]/10 bg-white p-4">
                  <item.icon className="w-5 h-5 text-[#0f3d3e]" />
                  <h3 className="hub-heading text-sm font-semibold text-[#0f3d3e] mt-3">{item.title}</h3>
                  <p className="text-xs text-[#5c6f6b] mt-1">{item.description}</p>
                </div>
              ))}
            </div>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f3d3e]"
            >
              Comecar minha jornada
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
})

const COMMUNITY_POINTS = [
  'Buscar igrejas por cidade e estado',
  'Solicitar entrada com poucos cliques',
  'Acompanhar avisos, cursos e eventos',
]

export const CommunitySection = memo(function CommunitySection() {
  return (
    <section id="comunidade" className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeInUp} className="space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-[#7a4f02] font-semibold">Comunidade</span>
            <h2 className="hub-heading text-2xl sm:text-3xl font-semibold text-[#0f3d3e]">
              Encontre uma igreja perto de voce
            </h2>
            <p className="text-[#4b5f5c]">
              Quando estiver pronto, o Hub facilita a conexao com uma comunidade real. Voce escolhe, conversa e participa.
            </p>
            <motion.div variants={staggerContainer} className="space-y-3">
              {COMMUNITY_POINTS.map((item) => (
                <motion.div key={item} variants={fadeInUp} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#0f3d3e]" />
                  <span className="text-sm text-[#5c6f6b]">{item}</span>
                </motion.div>
              ))}
            </motion.div>
            <Link
              href="/ekkle/membro/igrejas"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f3d3e]"
            >
              Pesquisar igrejas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div variants={scaleIn} className="relative">
            <div className="rounded-[26px] overflow-hidden border border-[#0f3d3e]/10 shadow-lg bg-white">
              <Image
                src="/images/hub/community.jpg"
                alt="Comunidade reunida"
                width={600}
                height={540}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-4 left-6 bg-white border border-[#0f3d3e]/10 rounded-2xl px-4 py-3 shadow-md flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0f3d3e]" />
              <p className="text-sm font-semibold text-[#0f3d3e]">Igrejas em Sao Paulo</p>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
})

const PASTOR_FEATURES = [
  { icon: Church, title: 'Abrir igreja', description: 'Crie sua igreja e organize membros em minutos.' },
  { icon: MessageSquare, title: 'Comunicacao simples', description: 'Avisos e convites com poucos cliques.' },
  { icon: Radio, title: 'Conteudo vivo', description: 'Cursos, lives e mensagens no mesmo lugar.' },
]

export const PastorSection = memo(function PastorSection() {
  return (
    <section id="pastores" className="py-16 bg-[#0f3d3e]/5">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <motion.div variants={fadeInUp} className="space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-[#0f3d3e] font-semibold">Pastores</span>
            <h2 className="hub-heading text-2xl sm:text-3xl font-semibold text-[#0f3d3e]">
              O Hub tambem fortalece quem lidera
            </h2>
            <p className="text-[#4b5f5c]">
              Para pastores, o Ekkle oferece gestao de membros, celulas e comunicacao em um unico lugar.
              Abrir sua igreja e simples e voce acompanha tudo em tempo real.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {PASTOR_FEATURES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#0f3d3e]/10 bg-white p-4">
                  <item.icon className="w-5 h-5 text-[#0f3d3e]" />
                  <h3 className="hub-heading text-sm font-semibold text-[#0f3d3e] mt-3">{item.title}</h3>
                  <p className="text-xs text-[#5c6f6b] mt-1">{item.description}</p>
                </div>
              ))}
            </div>
            <Link
              href="/ekkle/membro/abrir-igreja"
              className="inline-flex items-center gap-2 rounded-full bg-[#0f3d3e] text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-[#0f3d3e]/20"
            >
              Abrir minha igreja
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div variants={scaleIn} className="relative">
            <div className="rounded-[26px] overflow-hidden border border-[#0f3d3e]/10 shadow-lg bg-white">
              <Image
                src="/images/hub/worship.jpg"
                alt="Pastor com a comunidade"
                width={520}
                height={520}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -top-4 right-6 bg-[#fff6df] border border-[#d9a441]/30 rounded-2xl px-4 py-3 shadow-md">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a4f02] font-semibold">R$ 57/mes</p>
              <p className="text-sm font-semibold text-[#7a4f02]">Plano pastoral</p>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
})

const STEPS = [
  {
    title: 'Crie sua conta',
    description: 'Em menos de 2 minutos voce entra no Hub.',
  },
  {
    title: 'Escolha sua rotina',
    description: 'Defina oracao, leitura e lembretes.',
  },
  {
    title: 'Conecte-se',
    description: 'Quando quiser, encontre uma igreja e se envolva.',
  },
]

export const HowItWorksSection = memo(function HowItWorksSection() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-12">
          <motion.span variants={fadeInUp} className="text-xs uppercase tracking-[0.3em] text-[#7a4f02] font-semibold">
            Como funciona
          </motion.span>
          <motion.h2 variants={fadeInUp} className="hub-heading text-2xl sm:text-3xl font-semibold text-[#0f3d3e] mt-3">
            Um caminho simples em tres passos
          </motion.h2>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              variants={fadeInUp}
              className="rounded-3xl border border-[#0f3d3e]/10 bg-white p-6 text-left shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-[#0f3d3e]/10 text-[#0f3d3e] flex items-center justify-center font-semibold">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="hub-heading text-lg font-semibold text-[#0f3d3e] mt-4">{step.title}</h3>
              <p className="text-sm text-[#5c6f6b] mt-2">{step.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})

export const FinalCTASection = memo(function FinalCTASection() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection>
          <motion.div variants={scaleIn} className="rounded-[32px] bg-[#0f3d3e] text-white p-10 md:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(217,164,65,0.35),_transparent_60%)]" />
            <div className="relative space-y-6">
              <h2 className="hub-heading text-2xl sm:text-3xl font-semibold">Comece no Hub ou lidere sua igreja</h2>
              <p className="text-white/80 max-w-2xl">
                Seja voce alguem procurando um recomeco espiritual ou um pastor pronto para cuidar de pessoas,
                o Ekkle esta pronto para caminhar junto.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0f3d3e] px-6 py-3 text-sm font-semibold"
                >
                  Comecar no Hub
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/ekkle/membro/abrir-igreja"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 text-white px-6 py-3 text-sm font-semibold"
                >
                  Sou pastor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
})
