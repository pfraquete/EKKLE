import dynamic from 'next/dynamic'

// Dynamic imports for client components with animations
// This reduces initial bundle size and improves performance
const LandingHeader = dynamic(() => import('@/components/landing/header').then(m => ({ default: m.LandingHeader })))
const HeroSection = dynamic(() => import('@/components/landing/hero').then(m => ({ default: m.HeroSection })))
const ProblemsSection = dynamic(() => import('@/components/landing/sections').then(m => ({ default: m.ProblemsSection })))
const FeaturesSection = dynamic(() => import('@/components/landing/sections').then(m => ({ default: m.FeaturesSection })))
const ScreenshotsSection = dynamic(() => import('@/components/landing/sections').then(m => ({ default: m.ScreenshotsSection })))
const CommunitySection = dynamic(() => import('@/components/landing/sections').then(m => ({ default: m.CommunitySection })))
const HowItWorksSection = dynamic(() => import('@/components/landing/sections').then(m => ({ default: m.HowItWorksSection })))
const BenefitsSection = dynamic(() => import('@/components/landing/sections').then(m => ({ default: m.BenefitsSection })))
const TestimonialsSection = dynamic(() => import('@/components/landing/pricing-faq').then(m => ({ default: m.TestimonialsSection })))
const PricingSection = dynamic(() => import('@/components/landing/pricing-faq').then(m => ({ default: m.PricingSection })))
const FAQSection = dynamic(() => import('@/components/landing/pricing-faq').then(m => ({ default: m.FAQSection })))
const FinalCTASection = dynamic(() => import('@/components/landing/footer').then(m => ({ default: m.FinalCTASection })))
const LandingFooter = dynamic(() => import('@/components/landing/footer').then(m => ({ default: m.LandingFooter })))

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <LandingHeader />
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
      <LandingFooter />
    </div>
  )
}
