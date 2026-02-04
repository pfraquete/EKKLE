'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { AnimatedSection, fadeInUp } from './animations'

// =====================================================
// TESTIMONIALS SECTION
// =====================================================

const TESTIMONIALS = [
  {
    name: 'Pr. Carlos Mendes',
    role: 'Igreja Batista Central',
    content: 'O Ekkle transformou a forma como gerenciamos nossa igreja. Antes perdíamos horas com planilhas, agora temos tudo organizado e automatizado.',
    rating: 5,
  },
  {
    name: 'Pra. Ana Paula',
    role: 'Comunidade Vida Nova',
    content: 'A automação do WhatsApp é incrível! Nossos membros nunca mais perderam um evento. A comunicação melhorou 100%.',
    rating: 5,
  },
  {
    name: 'Pr. Roberto Silva',
    role: 'Igreja Presbiteriana',
    content: 'Finalmente um sistema feito por quem entende de igreja. Simples, intuitivo e com tudo que precisamos.',
    rating: 5,
  },
]

export const TestimonialsSection = memo(function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-[#141414]/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#D4AF37] font-medium mb-4 block">
            DEPOIMENTOS
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            O que pastores dizem sobre o Ekkle
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Histórias reais de igrejas que transformaram sua gestão.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>
              <p className="text-[#F5F5F5] mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#F2D675] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {testimonial.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-[#A0A0A0]">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})

// =====================================================
// PRICING SECTION
// =====================================================

const PLANS = [
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
]

export const PricingSection = memo(function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#D4AF37] font-medium mb-4 block">
            PLANOS
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Investimento que se paga
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Escolha o plano ideal para sua igreja. Sem taxas escondidas, sem surpresas.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className={`relative bg-[#141414] border rounded-3xl p-8 ${
                plan.popular ? 'border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20' : 'border-[#2A2A2A]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-white text-sm font-medium px-4 py-1 rounded-full">
                  Mais Popular
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-[#A0A0A0] mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-[#A0A0A0]">R$</span>
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-[#A0A0A0]">{plan.interval}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-[#A0A0A0] line-through mt-2">De R$ {plan.originalPrice}/ano</div>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                    <span className="text-[#F5F5F5]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/registro"
                className={`block w-full py-4 rounded-xl font-semibold text-center transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-white hover:opacity-90 hover:shadow-lg hover:shadow-[#D4AF37]/20'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] border border-[#2A2A2A]'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </AnimatedSection>

        {/* Destaque: Só o pastor paga */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          className="mt-12 max-w-2xl mx-auto bg-gradient-to-r from-[#D4AF37]/10 to-[#F2D675]/10 border border-[#D4AF37]/30 rounded-2xl p-6 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-3xl">👥</span>
            <h4 className="text-xl font-bold text-white">Somente o Pastor Paga!</h4>
          </div>
          <p className="text-[#A0A0A0]">
            Discipuladores, líderes de célula e membros têm <span className="text-[#D4AF37] font-semibold">acesso 100% gratuito</span>. 
            Toda a sua liderança pode usar o sistema sem custo adicional.
          </p>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center text-[#A0A0A0] mt-6">
          Cancele quando quiser. Sem taxas escondidas.
        </motion.p>
      </div>
    </section>
  )
})

// =====================================================
// FAQ SECTION
// =====================================================

const FAQS = [
  { question: 'Preciso ter conhecimento técnico para usar o Ekkle?', answer: 'Não! O Ekkle foi desenvolvido para ser extremamente intuitivo. Se você sabe usar WhatsApp, vai conseguir usar o Ekkle. Além disso, oferecemos suporte completo e tutoriais em vídeo.' },
  { question: 'Posso migrar os dados da minha planilha atual?', answer: 'Sim! Nossa equipe pode ajudar você a importar os dados existentes. Oferecemos suporte gratuito para migração de dados de planilhas Excel ou Google Sheets.' },
  { question: 'Como funciona a automação do WhatsApp?', answer: 'Você conecta o WhatsApp da igreja ao Ekkle e configura mensagens automáticas para lembretes de reuniões, aniversários, eventos e muito mais. Tudo de forma simples e sem precisar de número adicional.' },
  { question: 'Posso cancelar a qualquer momento?', answer: 'Sim! Não temos fidelidade. Você pode cancelar sua assinatura a qualquer momento diretamente pelo painel. Se cancelar, terá acesso até o fim do período pago.' },
  { question: 'Os dados da minha igreja estão seguros?', answer: 'Absolutamente! Usamos criptografia de ponta a ponta e servidores seguros. Seus dados são backupeados diariamente e nunca são compartilhados com terceiros.' },
  { question: 'Vocês oferecem suporte?', answer: 'Sim! Oferecemos suporte via WhatsApp, email e chat. Assinantes do plano anual têm prioridade no atendimento e acesso a consultoria de implantação.' },
  { question: 'Como funciona a loja virtual?', answer: 'Você pode cadastrar produtos, definir preços e estoque. Os membros podem comprar diretamente pelo site da igreja e você recebe os pagamentos via Stripe ou PIX.' },
  { question: 'Posso personalizar o site da minha igreja?', answer: 'Sim! Você pode personalizar cores, logo, descrição e todas as informações do site. Cada igreja tem um subdomínio exclusivo (suaigreja.ekkle.com.br).' },
]

export const FAQSection = memo(function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 bg-[#141414]/50">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <motion.span variants={fadeInUp} className="text-[#D4AF37] font-medium mb-4 block">
            FAQ
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perguntas Frequentes
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Ekkle.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, index) => (
            <motion.div key={index} variants={fadeInUp} className="bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden">
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#1A1A1A]/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-white pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-[#A0A0A0] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#A0A0A0] flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-5"
                >
                  <p className="text-[#A0A0A0]">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  )
})
