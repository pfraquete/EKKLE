import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/actions/auth'
import { exportRegistrantsToCsv } from '@/actions/event-registrations'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const result = await exportRegistrantsToCsv(id)

    if (!result.success || !result.csv) {
      return new NextResponse('No data found', { status: 404 })
    }

    return new NextResponse(result.csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inscricoes-${id}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
