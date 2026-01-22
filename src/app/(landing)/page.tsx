'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Users,
  MessageSquare,
  BarChart3,
  Globe,
  Calendar,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Shield,
  Clock,
  Heart,
  Phone,
  Mail,
  Instagram,
  Youtube,
  Menu,
  X,
  Play,
} from 'lucide-react';

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// =====================================================
// ANIMATED SECTION WRAPPER
// =====================================================

function AnimatedSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// HEADER COMPONENT
// =====================================================

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#09090b]/95 backdrop-blur-lg border-b border-zinc-800'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Ekkle Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-xl font-bold text-white">Ekkle</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Recursos
            </a>
            <a
              href="#pricing"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Planos
            </a>
            <a
              href="#testimonials"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Depoimentos
            </a>
            <a
              href="#faq"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all hover:shadow-lg hover:shadow-[#66A5AD]/20 text-sm"
            >
              Começar Grátis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-zinc-800"
          >
            <nav className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Recursos
              </a>
              <a
                href="#pricing"
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Planos
              </a>
              <a
                href="#testimonials"
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Depoimentos
              </a>
              <a
                href="#faq"
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
                <Link
                  href="/login"
                  className="text-zinc-400 hover:text-white transition-colors py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white px-5 py-3 rounded-xl font-medium text-center"
                >
                  Começar Grátis
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

// =====================================================
// HERO SECTION
// =====================================================

function HeroSection() {
  return (
    <section className="pt-32 md:pt-40 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C2E4A]/20 to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#66A5AD]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#B89A5F]/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
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
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
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
            className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-2xl mx-auto"
          >
            Gerencie células, membros, eventos e comunicação em um único lugar.
            Automatize tarefas e foque no que realmente importa: as pessoas.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              href="/registro"
              className="group bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:shadow-xl hover:shadow-[#66A5AD]/20 flex items-center justify-center gap-2"
            >
              Começar Teste Grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#demo"
              className="group bg-zinc-800/50 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-800 transition-colors border border-zinc-700 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Ver Demonstração
            </a>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-zinc-400"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 border-2 border-[#09090b] flex items-center justify-center text-xs text-zinc-400"
                  >
                    {['👨‍💼', '👩‍💼', '👨‍🦳', '👩', '👨'][i - 1]}
                  </div>
                ))}
              </div>
              <span className="text-sm">+100 igrejas já usam</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-[#B89A5F] text-[#B89A5F]" />
              ))}
              <span className="text-sm ml-1">4.9/5 de avaliação</span>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl shadow-black/50 mx-auto max-w-5xl">
            <div className="bg-zinc-800 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-zinc-400 text-sm ml-4">ekkle.com.br/dashboard</span>
            </div>
            <div className="p-4 md:p-8 bg-gradient-to-br from-zinc-900 to-zinc-950">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Membros Ativos', value: '1.247', icon: Users, color: 'text-[#66A5AD]' },
                  { label: 'Células', value: '48', icon: Heart, color: 'text-[#B89A5F]' },
                  { label: 'Eventos', value: '12', icon: Calendar, color: 'text-green-400' },
                  { label: 'Mensagens', value: '3.2k', icon: MessageSquare, color: 'text-purple-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs md:text-sm text-zinc-400">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 h-48 bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-zinc-400">Crescimento Mensal</span>
                    <span className="text-xs text-green-400">+15%</span>
                  </div>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 95, 85, 100, 88, 110].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#1C2E4A] to-[#66A5AD] rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-48 bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-4">
                  <span className="text-sm text-zinc-400">Atividade Recente</span>
                  <div className="mt-4 space-y-3">
                    {[
                      { text: 'Nova célula criada', time: '2min' },
                      { text: 'Membro cadastrado', time: '5min' },
                      { text: 'Relatório enviado', time: '12min' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300">{item.text}</span>
                        <span className="text-zinc-500">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// =====================================================
// PROBLEMS SECTION
// =====================================================

function ProblemsSection() {
  const problems = [
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
  ];

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

        <AnimatedSection className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-8 hover:border-red-500/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <problem.icon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{problem.title}</h3>
              <p className="text-zinc-400">{problem.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

// =====================================================
// FEATURES SECTION
// =====================================================

function FeaturesSection() {
  const features = [
    {
      icon: Users,
      title: 'Gestão de Células',
      description:
        'Organize células, líderes e membros. Acompanhe reuniões, relatórios e crescimento de cada grupo.',
      color: 'from-[#1C2E4A] to-[#66A5AD]',
    },
    {
      icon: Heart,
      title: 'Gestão de Membros',
      description:
        'Cadastro completo de membros com histórico, estágio espiritual, aniversários e muito mais.',
      color: 'from-[#66A5AD] to-[#B89A5F]',
    },
    {
      icon: MessageSquare,
      title: 'Automação WhatsApp',
      description:
        'Envie lembretes automáticos de reuniões, aniversários e avisos importantes direto no WhatsApp.',
      color: 'from-[#B89A5F] to-[#1C2E4A]',
    },
    {
      icon: Globe,
      title: 'Site Personalizado',
      description:
        'Sua igreja com presença online profissional. Eventos, cursos e informações sempre atualizados.',
      color: 'from-[#1C2E4A] to-[#B89A5F]',
    },
    {
      icon: BookOpen,
      title: 'Cursos e Eventos',
      description:
        'Crie cursos de discipulado, organize eventos e gerencie inscrições de forma simples.',
      color: 'from-[#66A5AD] to-[#1C2E4A]',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Completos',
      description:
        'Dashboards com métricas de crescimento, frequência, engajamento e muito mais.',
      color: 'from-[#B89A5F] to-[#66A5AD]',
    },
  ];

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span
            variants={fadeInUp}
            className="text-[#66A5AD] font-medium mb-4 block"
          >
            RECURSOS
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Tudo que sua igreja precisa em um só lugar
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Ferramentas poderosas e fáceis de usar para transformar a gestão da sua comunidade.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

// =====================================================
// HOW IT WORKS SECTION
// =====================================================

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Cadastre sua igreja',
      description: 'Crie sua conta em menos de 2 minutos. Sem burocracia, sem complicação.',
    },
    {
      number: '02',
      title: 'Configure suas células',
      description: 'Adicione líderes, membros e configure os dias de reunião de cada célula.',
    },
    {
      number: '03',
      title: 'Comece a crescer',
      description: 'Use os relatórios e automações para acompanhar e impulsionar o crescimento.',
    },
  ];

  return (
    <section className="py-20 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span
            variants={fadeInUp}
            className="text-[#B89A5F] font-medium mb-4 block"
          >
            COMO FUNCIONA
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Comece em 3 passos simples
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Não precisa ser especialista em tecnologia. O Ekkle foi feito para ser simples.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div key={index} variants={fadeInUp} className="relative">
              {index < steps.length - 1 && (
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
  );
}

// =====================================================
// BENEFITS SECTION
// =====================================================

function BenefitsSection() {
  const benefits = [
    {
      icon: Clock,
      title: 'Economize até 10h por semana',
      description: 'Automatize tarefas repetitivas e foque no ministério.',
    },
    {
      icon: MessageSquare,
      title: 'Comunicação eficiente',
      description: 'Todos os membros informados no momento certo.',
    },
    {
      icon: BarChart3,
      title: 'Decisões baseadas em dados',
      description: 'Relatórios que mostram onde focar seus esforços.',
    },
    {
      icon: Shield,
      title: 'Dados seguros',
      description: 'Informações protegidas com criptografia de ponta.',
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <motion.span
              variants={fadeInUp}
              className="text-[#66A5AD] font-medium mb-4 block"
            >
              BENEFÍCIOS
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Por que pastores escolhem o Ekkle
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-zinc-400 mb-10">
              Mais do que um software, uma ferramenta que entende as necessidades reais de uma
              igreja em crescimento.
            </motion.p>

            <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
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
            <motion.div
              variants={scaleIn}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8"
            >
              <div className="space-y-6">
                {[
                  {
                    icon: CheckCircle2,
                    iconBg: 'bg-green-500/20',
                    iconColor: 'text-green-400',
                    title: 'Lembrete enviado',
                    desc: 'Reunião de célula amanhã às 20h',
                  },
                  {
                    icon: Star,
                    iconBg: 'bg-[#B89A5F]/20',
                    iconColor: 'text-[#B89A5F]',
                    title: 'Novo membro!',
                    desc: 'Maria Silva se cadastrou na célula Centro',
                  },
                  {
                    icon: BarChart3,
                    iconBg: 'bg-[#66A5AD]/20',
                    iconColor: 'text-[#66A5AD]',
                    title: 'Crescimento de 15%',
                    desc: 'Sua igreja cresceu este mês!',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl"
                  >
                    <div
                      className={`w-10 h-10 ${item.iconBg} rounded-full flex items-center justify-center`}
                    >
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <div className="text-white font-medium">{item.title}</div>
                      <div className="text-sm text-zinc-400">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

// =====================================================
// TESTIMONIALS SECTION
// =====================================================

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Pr. Carlos Mendes',
      role: 'Igreja Batista Central',
      content:
        'O Ekkle transformou a forma como gerenciamos nossa igreja. Antes perdíamos horas com planilhas, agora temos tudo organizado e automatizado.',
      rating: 5,
    },
    {
      name: 'Pra. Ana Paula',
      role: 'Comunidade Vida Nova',
      content:
        'A automação do WhatsApp é incrível! Nossos membros nunca mais perderam um evento. A comunicação melhorou 100%.',
      rating: 5,
    },
    {
      name: 'Pr. Roberto Silva',
      role: 'Igreja Presbiteriana',
      content:
        'Finalmente um sistema feito por quem entende de igreja. Simples, intuitivo e com tudo que precisamos.',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span
            variants={fadeInUp}
            className="text-[#B89A5F] font-medium mb-4 block"
          >
            DEPOIMENTOS
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            O que pastores dizem sobre o Ekkle
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Histórias reais de igrejas que transformaram sua gestão.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#B89A5F] text-[#B89A5F]" />
                ))}
              </div>
              <p className="text-zinc-300 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1C2E4A] to-[#66A5AD] rounded-full" />
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-zinc-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

// =====================================================
// PRICING SECTION
// =====================================================

function PricingSection() {
  const plans = [
    {
      name: 'Plano Mensal',
      price: 57,
      interval: '/mês',
      description: 'Ideal para começar a transformar sua igreja',
      features: [
        'Gestão ilimitada de células',
        'Gestão ilimitada de membros',
        'Relatórios completos',
        'Automação via WhatsApp',
        'Site personalizado para igreja',
        'Cursos e eventos',
        'Suporte prioritário',
      ],
      cta: 'Começar Agora',
      popular: false,
    },
    {
      name: 'Plano Anual',
      price: 397,
      originalPrice: 684,
      interval: '/ano',
      description: 'Economize 42% pagando anualmente',
      features: [
        'Tudo do plano mensal',
        'Economia de R$ 287 por ano',
        'Prioridade no suporte',
        'Acesso antecipado a novidades',
        'Consultoria de implantação',
        'Treinamento para líderes',
        'Backup prioritário',
      ],
      cta: 'Economizar 42%',
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span
            variants={fadeInUp}
            className="text-[#66A5AD] font-medium mb-4 block"
          >
            PLANOS
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Investimento que se paga
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Escolha o plano ideal para sua igreja. Sem taxas escondidas, sem surpresas.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              className={`relative bg-zinc-900 border rounded-3xl p-8 ${
                plan.popular
                  ? 'border-[#66A5AD] shadow-xl shadow-[#66A5AD]/10'
                  : 'border-zinc-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white text-sm font-medium px-4 py-1 rounded-full">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-zinc-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-zinc-400">R$</span>
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-400">{plan.interval}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-zinc-500 line-through mt-2">
                    De R$ {plan.originalPrice}/ano
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#66A5AD] flex-shrink-0" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/registro"
                className={`block w-full py-4 rounded-xl font-semibold text-center transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#1C2E4A] to-[#66A5AD] text-white hover:opacity-90 hover:shadow-lg hover:shadow-[#66A5AD]/20'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </AnimatedSection>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center text-zinc-500 mt-8"
        >
          Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
        </motion.p>
      </div>
    </section>
  );
}

// =====================================================
// FAQ SECTION
// =====================================================

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Preciso ter conhecimento técnico para usar o Ekkle?',
      answer:
        'Não! O Ekkle foi desenvolvido para ser extremamente intuitivo. Se você sabe usar WhatsApp, vai conseguir usar o Ekkle. Além disso, oferecemos suporte completo e tutoriais em vídeo.',
    },
    {
      question: 'Posso migrar os dados da minha planilha atual?',
      answer:
        'Sim! Nossa equipe pode ajudar você a importar os dados existentes. Oferecemos suporte gratuito para migração de dados de planilhas Excel ou Google Sheets.',
    },
    {
      question: 'Como funciona a automação do WhatsApp?',
      answer:
        'Você conecta o WhatsApp da igreja ao Ekkle e configura mensagens automáticas para lembretes de reuniões, aniversários, eventos e muito mais. Tudo de forma simples e sem precisar de número adicional.',
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer:
        'Sim! Não temos fidelidade. Você pode cancelar sua assinatura a qualquer momento diretamente pelo painel. Se cancelar, terá acesso até o fim do período pago.',
    },
    {
      question: 'Os dados da minha igreja estão seguros?',
      answer:
        'Absolutamente! Usamos criptografia de ponta a ponta e servidores seguros. Seus dados são backupeados diariamente e nunca são compartilhados com terceiros.',
    },
    {
      question: 'Vocês oferecem suporte?',
      answer:
        'Sim! Oferecemos suporte via WhatsApp, email e chat. Assinantes do plano anual têm prioridade no atendimento e acesso a consultoria de implantação.',
    },
  ];

  return (
    <section id="faq" className="py-20 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span
            variants={fadeInUp}
            className="text-[#B89A5F] font-medium mb-4 block"
          >
            FAQ
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Perguntas Frequentes
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Ekkle.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-white pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-5"
                >
                  <p className="text-zinc-400">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

// =====================================================
// FINAL CTA SECTION
// =====================================================

function FinalCTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <motion.div
            variants={scaleIn}
            className="relative bg-gradient-to-br from-[#1C2E4A] to-[#66A5AD] rounded-3xl p-12 md:p-16 overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Pronto para transformar sua igreja?
              </h2>
              <p className="text-xl text-white/80 mb-10">
                Junte-se a mais de 100 igrejas que já estão crescendo de forma organizada com o
                Ekkle. Comece hoje mesmo com 7 dias grátis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/registro"
                  className="group bg-white text-[#1C2E4A] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
                >
                  Começar Teste Grátis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  Falar com Consultor
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// =====================================================
// FOOTER
// =====================================================

function Footer() {
  return (
    <footer className="py-16 border-t border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="Ekkle Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-bold text-white">Ekkle</span>
            </Link>
            <p className="text-zinc-400 mb-6 max-w-md">
              Sistema completo de gestão e automação para igrejas. Transforme a forma como você
              cuida da sua comunidade.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-zinc-400 hover:text-white transition-colors">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">
                  Planos
                </a>
              </li>
              <li>
                <a href="#faq" className="text-zinc-400 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contato@ekkle.com.br"
                  className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  contato@ekkle.com.br
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5511999999999"
                  className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Ekkle. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-500 hover:text-zinc-400 text-sm transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-zinc-500 hover:text-zinc-400 text-sm transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <Header />
      <main>
        <HeroSection />
        <ProblemsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
