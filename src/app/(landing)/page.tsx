'use client'

import {
  LandingHeader,
  HeroSection,
  ProblemsSection,
  FeaturesSection,
  ScreenshotsSection,
  CommunitySection,
  HowItWorksSection,
  BenefitsSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  FinalCTASection,
  LandingFooter,
} from '@/components/landing'

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
