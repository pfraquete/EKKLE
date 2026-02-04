import { NextRequest, NextResponse } from 'next/server'
import { endImpersonation, isImpersonating } from '@/lib/impersonation'

export async function POST(request: NextRequest) {
    try {
        // Check if there's an active impersonation session
        const isActive = await isImpersonating()

        if (!isActive) {
            return NextResponse.json({
                success: true,
                message: 'Nenhuma sessão de impersonação ativa'
            })
        }

        const result = await endImpersonation('manual')

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            redirectUrl: '/admin'
        })
    } catch (error) {
        console.error('[API] Impersonation end error:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
