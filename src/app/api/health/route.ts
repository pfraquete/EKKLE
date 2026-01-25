/**
 * Health Check Endpoint
 *
 * Used by load balancers and monitoring systems to verify
 * the application is running and responsive.
 *
 * GET /api/health
 * Returns: { status: 'ok', timestamp: ISO date string }
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  })
}

// Disable caching for health checks
export const dynamic = 'force-dynamic'
