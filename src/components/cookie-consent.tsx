'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Cookie, X } from 'lucide-react'

const COOKIE_CONSENT_KEY = 'ekkle-cookie-consent'

type ConsentValue = 'accepted' | 'declined' | null

export function CookieConsent() {
    const [consent, setConsent] = useState<ConsentValue>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if user has already made a choice
        const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue
        if (savedConsent) {
            setConsent(savedConsent)
        } else {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
        setConsent('accepted')
        setIsVisible(false)
    }

    const handleDecline = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'declined')
        setConsent('declined')
        setIsVisible(false)
    }

    // Don't render if already consented or declined
    if (consent || !isVisible) {
        return null
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-4xl mx-auto bg-card border border-border shadow-xl rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                        <Cookie className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-2">Utilizamos cookies</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Usamos cookies essenciais para o funcionamento do sistema e cookies de análise para
                            melhorar sua experiência. Ao clicar em &quot;Aceitar&quot;, você concorda com o uso de todos os cookies.
                            Saiba mais em nossa{' '}
                            <Link href="/privacidade" className="text-primary hover:underline">
                                Política de Privacidade
                            </Link>.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={handleAccept} size="sm">
                                Aceitar todos
                            </Button>
                            <Button onClick={handleDecline} variant="outline" size="sm">
                                Apenas essenciais
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={handleDecline}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

/**
 * Hook to check if user has accepted analytics cookies
 */
export function useAnalyticsCookies(): boolean {
    const [accepted, setAccepted] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
        setAccepted(consent === 'accepted')
    }, [])

    return accepted
}
