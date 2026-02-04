'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  MessageSquare,
  BarChart3,
  Globe,
  Calendar,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Clock,
  Shield,
  ShoppingBag,
  Upload,
  Bell,
  Video,
  DollarSign,
  TrendingUp,
  UserPlus,
  Home,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AnimatedSection, fadeInUp, scaleIn, staggerContainer } from './animations'

// =====================================================
// PROBLEMS SECTION
// =====================================================

const PROBLEMS = [
  {
    icon: Clock,
    title: 'Tempo perdido com planilhas',
    description:
      'Horas gastas atualizando planilhas manualmente, com risco de erros e informações desatualizadas.',
  },
  {
    icon: MessageSquare,
    title: 'Comunicação fragmentada',
    description:
      'Mensagens importantes se perdem entre WhatsApp, email e ligações. Membros não recebem avisos.',
  },
  {
    icon: Users,
    title: 'Dificuldade em acompanhar membros',
    description:
      'Sem visibilidade de quem está frequentando, quem precisa de atenção ou está se afastando.',
  },
]

export const ProblemsSection = memo(function ProblemsSection() {
  return (
    <section className="py-20 bg-[#141414]/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Você enfrenta esses desafios?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            A maioria das igrejas ainda usa métodos ultrapassados que consomem tempo e energia.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8">
          {PROBLEMS.map((problem, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 hover:border-red-500/30 transition-all"
            >
              <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <problem.icon className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{problem.title}</h3>
              <p className="text-[#A0A0A0]">{problem.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})

// =====================================================
// FEATURES SECTION
// =====================================================

const FEATURES = [
  { icon: Home, title: 'Gestão de Células', description: 'Organize células, líderes e membros. Acompanhe reuniões, relatórios e crescimento de cada grupo.', color: 'from-[#D4AF37] to-[#F2D675]', screenshot: '/images/landing/celulas-screenshot.png' },
  { icon: Users, title: 'Gestão de Membros', description: 'Cadastro completo de membros com histórico, estágio espiritual, aniversários e muito mais.', color: 'from-[#F2D675] to-[#B8962E]', screenshot: '/images/landing/membros-screenshot.png' },
  { icon: MessageSquare, title: 'Automação WhatsApp', description: 'Envie lembretes automáticos de reuniões, aniversários e avisos importantes direto no WhatsApp.', color: 'from-[#B8962E] to-[#D4AF37]', screenshot: '/images/landing/comunicacoes-screenshot.png' },
  { icon: Globe, title: 'Feed Social', description: 'Rede social exclusiva da igreja. Membros compartilham momentos, fotos e testemunhos.', color: 'from-[#D4AF37] to-[#B8962E]', screenshot: '/images/landing/feed-screenshot.png' },
  { icon: BookOpen, title: 'Cursos Online', description: 'Crie cursos de discipulado com módulos, aulas em vídeo e acompanhamento de progresso.', color: 'from-[#F2D675] to-[#D4AF37]', screenshot: '/images/landing/cursos-screenshot.png' },
  { icon: Calendar, title: 'Gestão de Eventos', description: 'Organize eventos, gerencie inscrições e envie lembretes automáticos aos participantes.', color: 'from-[#B8962E] to-[#F2D675]', screenshot: '/images/landing/eventos-screenshot.png' },
  { icon: ShoppingBag, title: 'Loja Virtual', description: 'Venda produtos, livros, camisetas e materiais da igreja com gestão completa de estoque.', color: 'from-[#D4AF37] to-[#F2D675]', screenshot: '/images/landing/loja-screenshot.png' },
  { icon: Video, title: 'Lives e Transmissões', description: 'Gerencie lives, cultos online e transmissões com integração ao YouTube e outras plataformas.', color: 'from-[#F2D675] to-[#B8962E]', screenshot: '/images/landing/lives-screenshot.png' },
  { icon: DollarSign, title: 'Controle Financeiro', description: 'Gerencie dízimos, ofertas, entradas e saídas com relatórios detalhados e transparência total.', color: 'from-[#B8962E] to-[#D4AF37]', screenshot: '/images/landing/financeiro-screenshot.png' },
  { icon: BarChart3, title: 'Dashboard Completo', description: 'Visão geral de toda a igreja com métricas, gráficos e indicadores de crescimento.', color: 'from-[#D4AF37] to-[#B8962E]', screenshot: '/images/landing/dashboard-screenshot.png' },
  { icon: Upload, title: 'Importação de Dados', description: 'Importe membros de planilhas Excel ou Google Sheets de forma rápida e sem complicação.', color: 'from-[#F2D675] to-[#D4AF37]' },
  { icon: Bell, title: 'Comunicações em Massa', description: 'Envie avisos, convites e mensagens para grupos específicos ou toda a igreja de uma vez.', color: 'from-[#B8962E] to-[#F2D675]' },
]

export const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#D4AF37] font-medium mb-4 block">
            RECURSOS COMPLETOS
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tudo que sua igreja precisa em um só lugar
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Ferramentas poderosas e fáceis de usar para transformar a gestão da sua comunidade.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#2A2A2A] transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#A0A0A0]">{feature.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})

// =====================================================
// SCREENSHOTS SECTION - GALERIA INTERATIVA
// =====================================================

const SCREENSHOTS = [
  { 
    id: 'dashboard', 
    title: 'Dashboard', 
    description: 'Visão geral completa da sua igreja com métricas em tempo real',
    image: '/images/landing/dashboard-screenshot.png',
    icon: BarChart3,
  },
  { 
    id: 'celulas', 
    title: 'Células', 
    description: 'Gerencie todas as células, líderes e relatórios de reuniões',
    image: '/images/landing/celulas-screenshot.png',
    icon: Home,
  },
  { 
    id: 'membros', 
    title: 'Membros', 
    description: 'Cadastro completo com histórico e acompanhamento pastoral',
    image: '/images/landing/membros-screenshot.png',
    icon: Users,
  },
  { 
    id: 'cursos', 
    title: 'Cursos', 
    description: 'Plataforma de ensino com módulos e acompanhamento de progresso',
    image: '/images/landing/cursos-screenshot.png',
    icon: BookOpen,
  },
  { 
    id: 'eventos', 
    title: 'Eventos', 
    description: 'Organize eventos e gerencie inscrições facilmente',
    image: '/images/landing/eventos-screenshot.png',
    icon: Calendar,
  },
  { 
    id: 'loja', 
    title: 'Loja', 
    description: 'Venda produtos da igreja com gestão completa',
    image: '/images/landing/loja-screenshot.png',
    icon: ShoppingBag,
  },
  { 
    id: 'feed', 
    title: 'Feed Social', 
    description: 'Rede social exclusiva para sua comunidade',
    image: '/images/landing/feed-screenshot.png',
    icon: Globe,
  },
  { 
    id: 'financeiro', 
    title: 'Financeiro', 
    description: 'Controle de dízimos, ofertas e relatórios financeiros',
    image: '/images/landing/financeiro-screenshot.png',
    icon: DollarSign,
  },
  { 
    id: 'comunicacoes', 
    title: 'WhatsApp', 
    description: 'Automação de mensagens e comunicação em massa',
    image: '/images/landing/comunicacoes-screenshot.png',
    icon: MessageSquare,
  },
]

export const ScreenshotsSection = memo(function ScreenshotsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeScreenshot = SCREENSHOTS[activeIndex]

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % SCREENSHOTS.length)
  }

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length)
  }

  return (
    <section id="screenshots" className="py-20 bg-[#141414]/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-12">
          <motion.span variants={fadeInUp} className="text-[#F2D675] font-medium mb-4 block">
            CONHEÇA O SISTEMA
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Interface moderna e intuitiva
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Design dark mode elegante, fácil de usar e com todas as informações que você precisa.
          </motion.p>
        </AnimatedSection>

        {/* Tabs de navegação */}
        <AnimatedSection className="mb-8">
          <motion.div 
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-2 md:gap-3"
          >
            {SCREENSHOTS.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveIndex(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeIndex === index
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-white shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-[#1A1A1A] text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-white border border-[#2A2A2A]'
                }`}
              >
                <screenshot.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{screenshot.title}</span>
              </button>
            ))}
          </motion.div>
        </AnimatedSection>

        {/* Screenshot principal com navegação */}
        <AnimatedSection>
          <motion.div variants={scaleIn} className="relative max-w-6xl mx-auto">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#B8962E]/20 rounded-3xl blur-3xl" />
            
            {/* Container do screenshot */}
            <div className="relative bg-[#141414] border border-[#2A2A2A] rounded-3xl overflow-hidden shadow-2xl">
              {/* Browser bar */}
              <div className="bg-[#1A1A1A] px-4 py-3 flex items-center gap-2 border-b border-[#2A2A2A]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#2A2A2A] rounded-lg px-4 py-1 text-sm text-[#A0A0A0]">
                    ekkle.com.br/{activeScreenshot.id}
                  </div>
                </div>
              </div>

              {/* Screenshot com animação */}
              <div className="relative aspect-video">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeScreenshot.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={activeScreenshot.image}
                      alt={`${activeScreenshot.title} - Ekkle`}
                      fill
                      className="object-cover object-top"
                      loading="lazy"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navegação lateral */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Info bar */}
              <div className="bg-[#1A1A1A] px-6 py-4 border-t border-[#2A2A2A]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{activeScreenshot.title}</h3>
                    <p className="text-sm text-[#A0A0A0]">{activeScreenshot.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <span>{activeIndex + 1}</span>
                    <span>/</span>
                    <span>{SCREENSHOTS.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots de navegação */}
            <div className="flex justify-center gap-2 mt-6">
              {SCREENSHOTS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeIndex === index
                      ? 'w-8 bg-[#D4AF37]'
                      : 'bg-[#2A2A2A] hover:bg-[#3A3A3A]'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatedSection>

        {/* Highlights abaixo do screenshot */}
        <AnimatedSection className="grid md:grid-cols-3 gap-8 mt-16">
          <motion.div variants={fadeInUp} className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#F2D675] rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Métricas em Tempo Real</h3>
            <p className="text-[#A0A0A0]">Acompanhe o crescimento da sua igreja com gráficos atualizados</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#F2D675] rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Gestão Simplificada</h3>
            <p className="text-[#A0A0A0]">Cadastre e gerencie membros com poucos cliques</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#F2D675] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Notificações Automáticas</h3>
            <p className="text-[#A0A0A0]">Receba alertas sobre eventos, aniversários e relatórios pendentes</p>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
})

// =====================================================
// COMMUNITY SECTION
// =====================================================

const COMMUNITY_FEATURES = [
  'Gestão completa de células e membros',
  'Automação de comunicação via WhatsApp',
  'Site personalizado para sua igreja',
  'Loja virtual integrada',
  'Relatórios e métricas em tempo real',
  'Suporte dedicado e treinamento',
]

export const CommunitySection = memo(function CommunitySection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection className="relative">
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-[#2A2A2A]">
                  <Image
                    src="/images/landing/celulas-screenshot.png"
                    alt="Gestão de Células"
                    width={300}
                    height={200}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-[#2A2A2A]">
                  <Image
                    src="/images/landing/feed-screenshot.png"
                    alt="Feed Social"
                    width={300}
                    height={200}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </motion.div>
              <motion.div variants={fadeInUp} className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-[#2A2A2A]">
                  <Image
                    src="/images/landing/membros-screenshot.png"
                    alt="Gestão de Membros"
                    width={300}
                    height={200}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-[#2A2A2A]">
                  <Image
                    src="/images/landing/eventos-screenshot.png"
                    alt="Eventos"
                    width={300}
                    height={200}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <motion.span variants={fadeInUp} className="text-[#D4AF37] font-medium mb-4 block">
              POR QUE ESCOLHER O EKKLE?
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-6">
              Feito por quem entende de igreja
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-[#A0A0A0] mb-8">
              O Ekkle foi desenvolvido em parceria com pastores e líderes que conhecem os desafios reais da gestão eclesiástica. 
              Cada funcionalidade foi pensada para facilitar o dia a dia da sua liderança.
            </motion.p>
            <motion.ul variants={fadeInUp} className="space-y-4 mb-8">
              {COMMUNITY_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-[#F5F5F5]">{feature}</span>
                </li>
              ))}
            </motion.ul>
            <motion.div variants={fadeInUp}>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
})

// =====================================================
// HOW IT WORKS SECTION
// =====================================================

const STEPS = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem complicação.',
  },
  {
    number: '02',
    title: 'Configure sua igreja',
    description: 'Personalize cores, logo e informações. Importe seus membros de planilhas existentes.',
  },
  {
    number: '03',
    title: 'Convide sua liderança',
    description: 'Adicione pastores, discipuladores e líderes. Eles têm acesso gratuito!',
  },
  {
    number: '04',
    title: 'Transforme sua gestão',
    description: 'Comece a usar todas as ferramentas e veja sua igreja crescer de forma organizada.',
  },
]

export const HowItWorksSection = memo(function HowItWorksSection() {
  return (
    <section className="py-20 bg-[#141414]/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#D4AF37] font-medium mb-4 block">
            COMO FUNCIONA
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comece em 4 passos simples
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Em poucos minutos sua igreja estará pronta para usar o Ekkle.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, index) => (
            <motion.div key={index} variants={fadeInUp} className="relative">
              <div className="text-6xl font-bold text-[#1A1A1A] mb-4">{step.number}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-[#A0A0A0]">{step.description}</p>
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2 w-full border-t border-dashed border-[#2A2A2A]" />
              )}
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})

// =====================================================
// BENEFITS SECTION
// =====================================================

const BENEFITS = [
  {
    icon: Clock,
    title: 'Economize Tempo',
    description: 'Automatize tarefas repetitivas e foque no que realmente importa: as pessoas.',
    stat: '10h',
    statLabel: 'economizadas por semana',
  },
  {
    icon: TrendingUp,
    title: 'Aumente o Engajamento',
    description: 'Comunicação eficiente aumenta a participação dos membros em eventos e células.',
    stat: '+40%',
    statLabel: 'de engajamento',
  },
  {
    icon: Shield,
    title: 'Dados Seguros',
    description: 'Criptografia de ponta a ponta e backups diários. Seus dados estão protegidos.',
    stat: '99.9%',
    statLabel: 'de uptime',
  },
]

export const BenefitsSection = memo(function BenefitsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#D4AF37] font-medium mb-4 block">
            BENEFÍCIOS
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Resultados que você vai ver
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Igrejas que usam o Ekkle relatam melhorias significativas na gestão.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 text-center hover:border-[#D4AF37]/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#F2D675] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#F2D675] bg-clip-text text-transparent mb-2">
                {benefit.stat}
              </div>
              <div className="text-sm text-[#A0A0A0] mb-4">{benefit.statLabel}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
              <p className="text-[#A0A0A0]">{benefit.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})
