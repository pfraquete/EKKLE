'use client'

import { useState } from 'react'
import { HandCoins } from 'lucide-react'
import { CellOfferingModal } from './cell-offering-modal'

interface Profile {
    id: string
    full_name: string
    email: string | null
    phone: string | null
}

interface CellOfferingButtonProps {
    profile: Profile
}

export function CellOfferingButton({ profile }: CellOfferingButtonProps) {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30"
            >
                <HandCoins className="w-5 h-5" />
                Fazer Oferta
            </button>

            {showModal && (
                <CellOfferingModal
                    profile={profile}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    )
}
