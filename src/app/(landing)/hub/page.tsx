import dynamic from 'next/dynamic'

const HubHeader = dynamic(() => import('@/components/landing-hub/header').then((m) => ({ default: m.HubHeader })))
const HeroSection = dynamic(() => import('@/components/landing-hub/hero').then((m) => ({ default: m.HeroSection })))
const PrayerSection = dynamic(() => import('@/components/landing-hub/sections').then((m) => ({ default: m.PrayerSection })))
const BibleSection = dynamic(() => import('@/components/landing-hub/sections').then((m) => ({ default: m.BibleSection })))
const CommunitySection = dynamic(() => import('@/components/landing-hub/sections').then((m) => ({ default: m.CommunitySection })))
const PastorSection = dynamic(() => import('@/components/landing-hub/sections').then((m) => ({ default: m.PastorSection })))
const HowItWorksSection = dynamic(() => import('@/components/landing-hub/sections').then((m) => ({ default: m.HowItWorksSection })))
const HubFAQSection = dynamic(() => import('@/components/landing-hub/faq').then((m) => ({ default: m.HubFAQSection })))
const FinalCTASection = dynamic(() => import('@/components/landing-hub/sections').then((m) => ({ default: m.FinalCTASection })))
const HubFooter = dynamic(() => import('@/components/landing-hub/footer').then((m) => ({ default: m.HubFooter })))

export default function HubLandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#1b1f1d]">
      <HubHeader />
      <main className="pt-2">
        <HeroSection />
        <PrayerSection />
        <BibleSection />
        <CommunitySection />
        <PastorSection />
        <HowItWorksSection />
        <HubFAQSection />
        <FinalCTASection />
      </main>
      <HubFooter />
    </div>
  )
}
