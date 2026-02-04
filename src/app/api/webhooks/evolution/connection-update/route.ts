/**
 * Evolution API Webhook - CONNECTION_UPDATE
 * Redireciona para o handler principal
 */

import { NextRequest, NextResponse } from 'next/server'
import { POST as mainHandler } from '../route'

export async function POST(request: NextRequest) {
  console.log('[Webhook] 📥 Received CONNECTION_UPDATE event')
  return mainHandler(request)
}

export async function GET() {
  return NextResponse.json({ status: 'ok', event: 'connection-update' })
}
