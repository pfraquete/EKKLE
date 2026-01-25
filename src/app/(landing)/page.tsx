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
  ShoppingBag,
  CreditCard,
  FileText,
  Bell,
  Upload,
  Smartphone,
  Video,
  DollarSign,
  TrendingUp,
  UserPlus,
  Home,
} from 'lucide-react';

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
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
              href="#screenshots"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Sistema
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
                href="#screenshots"
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sistema
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
// HERO SECTION WITH IMAGE
// =====================================================

function HeroSection() {
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
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
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
              className="text-xl text-zinc-400 mb-10 max-w-xl"
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
                {['👨‍💼', '👩‍💼', '👨‍🦳', '👩', '👨'].map((emoji, i) => (
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
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-transparent" />
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute bottom-6 left-6 right-6 bg-zinc-900/90 backdrop-blur-lg rounded-2xl p-4 border border-zinc-700"
              >
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">1.247</div>
                    <div className="text-xs text-zinc-400">Membros</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#66A5AD]">48</div>
                    <div className="text-xs text-zinc-400">Células</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#B89A5F]">12</div>
                    <div className="text-xs text-zinc-400">Eventos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">+15%</div>
                    <div className="text-xs text-zinc-400">Crescimento</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
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

        <AnimatedSection className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
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
  );
}

// =====================================================
// FEATURES SECTION - EXPANDED
// =====================================================

function FeaturesSection() {
  const features = [
    {
      icon: Home,
      title: 'Gestão de Células',
      description:
        'Organize células, líderes e membros. Acompanhe reuniões, relatórios e crescimento de cada grupo.',
      color: 'from-[#1C2E4A] to-[#66A5AD]',
    },
    {
      icon: Users,
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
    {
      icon: ShoppingBag,
      title: 'Loja Virtual',
      description:
        'Venda produtos, livros, camisetas e materiais da igreja com gestão completa de estoque e pagamentos.',
      color: 'from-[#1C2E4A] to-[#66A5AD]',
    },
    {
      icon: Video,
      title: 'Gestão de Cultos',
      description:
        'Organize cultos, escalas de ministério, pregações e acompanhe a frequência dos membros.',
      color: 'from-[#66A5AD] to-[#B89A5F]',
    },
    {
      icon: DollarSign,
      title: 'Controle Financeiro',
      description:
        'Gerencie entradas, saídas, dízimos e ofertas com relatórios detalhados e transparência total.',
      color: 'from-[#B89A5F] to-[#1C2E4A]',
    },
    {
      icon: Calendar,
      title: 'Calendário Integrado',
      description:
        'Visualize todos os eventos, cultos e reuniões em um calendário unificado e compartilhável.',
      color: 'from-[#1C2E4A] to-[#B89A5F]',
    },
    {
      icon: Upload,
      title: 'Importação de Dados',
      description:
        'Importe membros de planilhas Excel ou Google Sheets de forma rápida e sem complicação.',
      color: 'from-[#66A5AD] to-[#1C2E4A]',
    },
    {
      icon: Bell,
      title: 'Comunicações em Massa',
      description:
        'Envie avisos, convites e mensagens para grupos específicos ou toda a igreja de uma vez.',
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
            RECURSOS COMPLETOS
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

        <AnimatedSection className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

// =====================================================
// SCREENSHOTS SECTION - NEW
// =====================================================

function ScreenshotsSection() {
  const screenshots = [
    {
      title: 'Dashboard Completo',
      description: 'Visão geral com KPIs, gráficos de crescimento e próximos eventos',
      image: '/images/landing/dashboard-example.png',
    },
  ];

  return (
    <section id="screenshots" className="py-20 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span
            variants={fadeInUp}
            className="text-[#B89A5F] font-medium mb-4 block"
          >
            CONHEÇA O SISTEMA
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Interface moderna e intuitiva
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Design dark mode elegante, fácil de usar e com todas as informações que você precisa.
          </motion.p>
        </AnimatedSection>

        {/* Main Screenshot */}
        <AnimatedSection>
          <motion.div
            variants={scaleIn}
            className="relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C2E4A]/30 to-[#66A5AD]/30 rounded-3xl blur-3xl" />
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl">
              {/* Browser Header */}
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
              {/* Screenshot */}
              <Image
                src="/images/landing/dashboard-example.png"
                alt="Dashboard do Ekkle"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </AnimatedSection>

        {/* Feature Highlights */}
        <AnimatedSection className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            {
              icon: TrendingUp,
              title: 'Métricas em Tempo Real',
              description: 'Acompanhe o crescimento da sua igreja com gráficos atualizados',
            },
            {
              icon: UserPlus,
              title: 'Gestão Simplificada',
              description: 'Cadastre e gerencie membros com poucos cliques',
            },
            {
              icon: Bell,
              title: 'Notificações Automáticas',
              description: 'Receba alertas sobre eventos, aniversários e relatórios pendentes',
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="text-center"
            >
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
  );
}

// =====================================================
// COMMUNITY SECTION - NEW WITH IMAGES
// =====================================================

function CommunitySection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Images Grid */}
          <AnimatedSection className="relative">
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/landing/small-group.jpeg"
                    alt="Célula em reunião"
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/landing/bible-study.jpg"
                    alt="Estudo bíblico"
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                </div>
              </motion.div>
              <motion.div variants={fadeInUp} className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/landing/youth-worship.jpg"
                    alt="Jovens em adoração"
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/landing/church-worship.jpg"
                    alt="Culto de celebração"
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                </div>
              </motion.div>
            </div>
            
            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-4 -right-4 bg-gradient-to-br from-[#1C2E4A] to-[#66A5AD] rounded-2xl p-4 shadow-xl"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">+100</div>
                <div className="text-sm text-white/80">Igrejas</div>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Right - Content */}
          <AnimatedSection>
            <motion.span
              variants={fadeInUp}
              className="text-[#66A5AD] font-medium mb-4 block"
            >
              COMUNIDADE
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Feito para igrejas que querem crescer
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-zinc-400 mb-8">
              O Ekkle foi desenvolvido por quem entende as necessidades reais de uma igreja em crescimento. 
              Cada funcionalidade foi pensada para facilitar o trabalho pastoral e fortalecer a comunidade.
            </motion.p>

            <motion.div variants={staggerContainer} className="space-y-4">
              {[
                'Gestão completa de células e membros',
                'Automação de comunicação via WhatsApp',
                'Site personalizado para sua igreja',
                'Loja virtual integrada',
                'Relatórios e métricas em tempo real',
                'Suporte dedicado e treinamento',
              ].map((item, index) => (
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
                  {
                    icon: ShoppingBag,
                    iconBg: 'bg-purple-500/20',
                    iconColor: 'text-purple-400',
                    title: 'Nova venda na loja',
                    desc: 'Bíblia de Estudo - R$ 89,90',
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

        <AnimatedSection className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#B89A5F] text-[#B89A5F]" />
                ))}
              </div>
              <p className="text-zinc-300 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1C2E4A] to-[#66A5AD] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {testimonial.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
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
      description: 'Ideal para começar a transformar sua igreja',
      price: '57',
      interval: '/mês',
      features: [
        'Gestão ilimitada de células',
        'Gestão ilimitada de membros',
        'Relatórios completos',
        'Automação via WhatsApp',
        'Site personalizado para igreja',
        'Cursos e eventos',
        'Loja virtual',
        'Suporte prioritário',
      ],
      cta: 'Começar Agora',
      popular: false,
    },
    {
      name: 'Plano Anual',
      description: 'Economize 42% pagando anualmente',
      price: '397',
      interval: '/ano',
      originalPrice: '684',
      features: [
        'Tudo do plano mensal',
        'Economia de R$ 287 por ano',
        'Prioridade no suporte',
        'Acesso antecipado a novidades',
        'Consultoria de implantação',
        'Treinamento para líderes',
        'Backup prioritário',
        'Integrações avançadas',
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
              variants={fadeInUp}
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
    {
      question: 'Como funciona a loja virtual?',
      answer:
        'Você pode cadastrar produtos, definir preços e estoque. Os membros podem comprar diretamente pelo site da igreja e você recebe os pagamentos via Stripe ou PIX.',
    },
    {
      question: 'Posso personalizar o site da minha igreja?',
      answer:
        'Sim! Você pode personalizar cores, logo, descrição e todas as informações do site. Cada igreja tem um subdomínio exclusivo (suaigreja.ekkle.com.br).',
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
                <a href="#screenshots" className="text-zinc-400 hover:text-white transition-colors">
                  Sistema
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
        <ScreenshotsSection />
        <CommunitySection />
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
