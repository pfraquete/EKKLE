'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
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
    <section className="py-20 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Você enfrenta esses desafios?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            A maioria das igrejas ainda usa métodos ultrapassados que consomem tempo e energia.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8">
          {PROBLEMS.map((problem, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-red-500/30 transition-all"
            >
              <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                <problem.icon className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{problem.title}</h3>
              <p className="text-zinc-400">{problem.description}</p>
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
  { icon: Home, title: 'Gestão de Células', description: 'Organize células, líderes e membros. Acompanhe reuniões, relatórios e crescimento de cada grupo.', color: 'from-[#1C2E4A] to-[#66A5AD]' },
  { icon: Users, title: 'Gestão de Membros', description: 'Cadastro completo de membros com histórico, estágio espiritual, aniversários e muito mais.', color: 'from-[#66A5AD] to-[#B89A5F]' },
  { icon: MessageSquare, title: 'Automação WhatsApp', description: 'Envie lembretes automáticos de reuniões, aniversários e avisos importantes direto no WhatsApp.', color: 'from-[#B89A5F] to-[#1C2E4A]' },
  { icon: Globe, title: 'Site Personalizado', description: 'Sua igreja com presença online profissional. Eventos, cursos e informações sempre atualizados.', color: 'from-[#1C2E4A] to-[#B89A5F]' },
  { icon: BookOpen, title: 'Cursos e Eventos', description: 'Crie cursos de discipulado, organize eventos e gerencie inscrições de forma simples.', color: 'from-[#66A5AD] to-[#1C2E4A]' },
  { icon: BarChart3, title: 'Relatórios Completos', description: 'Dashboards com métricas de crescimento, frequência, engajamento e muito mais.', color: 'from-[#B89A5F] to-[#66A5AD]' },
  { icon: ShoppingBag, title: 'Loja Virtual', description: 'Venda produtos, livros, camisetas e materiais da igreja com gestão completa de estoque e pagamentos.', color: 'from-[#1C2E4A] to-[#66A5AD]' },
  { icon: Video, title: 'Gestão de Cultos', description: 'Organize cultos, escalas de ministério, pregações e acompanhe a frequência dos membros.', color: 'from-[#66A5AD] to-[#B89A5F]' },
  { icon: DollarSign, title: 'Controle Financeiro', description: 'Gerencie entradas, saídas, dízimos e ofertas com relatórios detalhados e transparência total.', color: 'from-[#B89A5F] to-[#1C2E4A]' },
  { icon: Calendar, title: 'Calendário Integrado', description: 'Visualize todos os eventos, cultos e reuniões em um calendário unificado e compartilhável.', color: 'from-[#1C2E4A] to-[#B89A5F]' },
  { icon: Upload, title: 'Importação de Dados', description: 'Importe membros de planilhas Excel ou Google Sheets de forma rápida e sem complicação.', color: 'from-[#66A5AD] to-[#1C2E4A]' },
  { icon: Bell, title: 'Comunicações em Massa', description: 'Envie avisos, convites e mensagens para grupos específicos ou toda a igreja de uma vez.', color: 'from-[#B89A5F] to-[#66A5AD]' },
]

export const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#66A5AD] font-medium mb-4 block">
            RECURSOS COMPLETOS
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tudo que sua igreja precisa em um só lugar
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Ferramentas poderosas e fáceis de usar para transformar a gestão da sua comunidade.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})

// =====================================================
// SCREENSHOTS SECTION
// =====================================================

const SCREENSHOT_HIGHLIGHTS = [
  { icon: TrendingUp, title: 'Métricas em Tempo Real', description: 'Acompanhe o crescimento da sua igreja com gráficos atualizados' },
  { icon: UserPlus, title: 'Gestão Simplificada', description: 'Cadastre e gerencie membros com poucos cliques' },
  { icon: Bell, title: 'Notificações Automáticas', description: 'Receba alertas sobre eventos, aniversários e relatórios pendentes' },
]

export const ScreenshotsSection = memo(function ScreenshotsSection() {
  return (
    <section id="screenshots" className="py-20 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#B89A5F] font-medium mb-4 block">
            CONHEÇA O SISTEMA
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Interface moderna e intuitiva
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Design dark mode elegante, fácil de usar e com todas as informações que você precisa.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection>
          <motion.div variants={scaleIn} className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C2E4A]/30 to-[#66A5AD]/30 rounded-3xl blur-3xl" />
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-zinc-800 px-4 py-3 flex items-center gap-2 border-b border-zinc-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-zinc-700 rounded-lg px-4 py-1 text-sm text-zinc-400">
                    ekkle.com.br/dashboard
                  </div>
                </div>
              </div>
              <Image
                src="/images/landing/dashboard-example.jpg"
                alt="Dashboard do Ekkle"
                width={1200}
                height={800}
                className="w-full h-auto"
                loading="lazy"
                priority={false}
              />
            </div>
          </motion.div>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8 mt-16">
          {SCREENSHOT_HIGHLIGHTS.map((item, index) => (
            <motion.div key={index} variants={fadeInUp} className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-[#1C2E4A] to-[#66A5AD] rounded-xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400">{item.description}</p>
            </motion.div>
          ))}
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
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image src="/images/landing/small-group.jpeg" alt="Célula em reunião" width={300} height={200} className="w-full h-48 object-cover" loading="lazy" />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image src="/images/landing/bible-study.jpg" alt="Estudo bíblico" width={300} height={200} className="w-full h-48 object-cover" loading="lazy" />
                </div>
              </motion.div>
              <motion.div variants={fadeInUp} className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image src="/images/landing/youth-worship.jpg" alt="Jovens em adoração" width={300} height={200} className="w-full h-48 object-cover" loading="lazy" />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image src="/images/landing/church-worship.jpg" alt="Culto de celebração" width={300} height={200} className="w-full h-48 object-cover" loading="lazy" />
                </div>
              </motion.div>
            </div>
            <div
              className="absolute -bottom-4 -right-4 bg-gradient-to-br from-[#1C2E4A] to-[#66A5AD] rounded-2xl p-4 shadow-xl"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">+100</div>
                <div className="text-sm text-white/80">Igrejas</div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <motion.span variants={fadeInUp} className="text-[#66A5AD] font-medium mb-4 block">
              COMUNIDADE
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-6">
              Feito para igrejas que querem crescer
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-zinc-400 mb-8">
              O Ekkle foi desenvolvido por quem entende as necessidades reais de uma igreja em crescimento.
              Cada funcionalidade foi pensada para facilitar o trabalho pastoral e fortalecer a comunidade.
            </motion.p>
            <motion.div variants={staggerContainer} className="space-y-4">
              {COMMUNITY_FEATURES.map((item, index) => (
                <motion.div key={index} variants={fadeInUp} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#66A5AD] flex-shrink-0" />
                  <span className="text-zinc-300">{item}</span>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={fadeInUp} className="mt-8">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
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
  { number: '01', title: 'Cadastre sua igreja', description: 'Crie sua conta em menos de 2 minutos. Sem burocracia, sem complicação.' },
  { number: '02', title: 'Configure suas células', description: 'Adicione líderes, membros e configure os dias de reunião de cada célula.' },
  { number: '03', title: 'Comece a crescer', description: 'Use os relatórios e automações para acompanhar e impulsionar o crescimento.' },
]

export const HowItWorksSection = memo(function HowItWorksSection() {
  return (
    <section className="py-20 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#B89A5F] font-medium mb-4 block">
            COMO FUNCIONA
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comece em 3 passos simples
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Não precisa ser especialista em tecnologia. O Ekkle foi feito para ser simples.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {STEPS.map((step, index) => (
            <motion.div key={index} variants={fadeInUp} className="relative">
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#66A5AD] to-transparent -translate-x-1/2" />
              )}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#1C2E4A] to-[#66A5AD] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#66A5AD]/20">
                  <span className="text-3xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-zinc-400">{step.description}</p>
              </div>
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
  { icon: Clock, title: 'Economize até 10h por semana', description: 'Automatize tarefas repetitivas e foque no ministério.' },
  { icon: MessageSquare, title: 'Comunicação eficiente', description: 'Todos os membros informados no momento certo.' },
  { icon: BarChart3, title: 'Decisões baseadas em dados', description: 'Relatórios que mostram onde focar seus esforços.' },
  { icon: Shield, title: 'Dados seguros', description: 'Informações protegidas com criptografia de ponta.' },
]

const NOTIFICATION_ITEMS = [
  { icon: CheckCircle2, iconBg: 'bg-green-500/20', iconColor: 'text-green-400', title: 'Lembrete enviado', desc: 'Reunião de célula amanhã às 20h' },
  { icon: Star, iconBg: 'bg-[#B89A5F]/20', iconColor: 'text-[#B89A5F]', title: 'Novo membro!', desc: 'Maria Silva se cadastrou na célula Centro' },
  { icon: BarChart3, iconBg: 'bg-[#66A5AD]/20', iconColor: 'text-[#66A5AD]', title: 'Crescimento de 15%', desc: 'Sua igreja cresceu este mês!' },
  { icon: ShoppingBag, iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', title: 'Nova venda na loja', desc: 'Bíblia de Estudo - R$ 89,90' },
]

export const BenefitsSection = memo(function BenefitsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <motion.span variants={fadeInUp} className="text-[#66A5AD] font-medium mb-4 block">
              BENEFÍCIOS
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-6">
              Por que pastores escolhem o Ekkle
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-zinc-400 mb-10">
              Mais do que um software, uma ferramenta que entende as necessidades reais de uma igreja em crescimento.
            </motion.p>
            <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 gap-6">
              {BENEFITS.map((benefit, index) => (
                <motion.div key={index} variants={fadeInUp} className="flex gap-4">
                  <div className="w-12 h-12 bg-[#1C2E4A]/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-[#66A5AD]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-zinc-400">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>

          <AnimatedSection className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C2E4A]/20 to-[#66A5AD]/20 rounded-3xl blur-3xl" />
            <motion.div variants={scaleIn} className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <div className="space-y-6">
                {NOTIFICATION_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl"
                  >
                    <div className={`w-10 h-10 ${item.iconBg} rounded-full flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <div className="text-white font-medium">{item.title}</div>
                      <div className="text-sm text-zinc-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
})
