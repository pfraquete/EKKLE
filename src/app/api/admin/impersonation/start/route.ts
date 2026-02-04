import { NextRequest, NextResponse } from 'next/server'
import { startImpersonation } from '@/lib/impersonation'
import { requireSuperAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
    try {
        // Verify super admin
        await requireSuperAdmin()

        const body = await request.json()
        const { targetUserId, reason } = body

        if (!targetUserId) {
            return NextResponse.json(
                { error: 'ID do usuário é obrigatório' },
                { status: 400 }
            )
        }

        if (!reason || reason.trim().length < 5) {
            return NextResponse.json(
                { error: 'Motivo é obrigatório (mínimo 5 caracteres)' },
                { status: 400 }
            )
        }

        const result = await startImpersonation(targetUserId, reason.trim(), {
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            redirectUrl: result.redirectUrl,
            session: result.session ? {
                sessionId: result.session.sessionId,
                targetUserEmail: result.session.targetUserEmail,
                targetUserName: result.session.targetUserName,
                targetChurchName: result.session.targetChurchName,
                expiresAt: result.session.expiresAt.toISOString(),
            } : null,
        })
    } catch (error) {
        console.error('[API] Impersonation start error:', error)

        // Check if it's a redirect (from requireSuperAdmin)
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
