import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getChurch } from '@/lib/get-church'

export async function POST(request: NextRequest) {
  try {
    // Get church context
    const church = await getChurch()

    if (!church) {
      return NextResponse.json(
        { error: 'Igreja não identificada' },
        { status: 400 }
      )
    }

    const churchId = church.id

    // Parse request body
    const body = await request.json()
    const { fullName, email, phone, message } = body

    // Validate required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check if email already registered
    const { data: existingRegistration } = await supabase
      .from('pending_registrations')
      .select('id')
      .eq('church_id', churchId)
      .eq('email', email)
      .eq('status', 'PENDING')
      .single()

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Já existe uma solicitação pendente com este email' },
        { status: 400 }
      )
    }

    // Check if email already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('church_id', churchId)
      .eq('email', email)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Insert pending registration
    const { data, error } = await supabase
      .from('pending_registrations')
      .insert({
        church_id: churchId,
        full_name: fullName,
        email,
        phone,
        message,
        status: 'PENDING',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating registration:', error)
      return NextResponse.json(
        { error: 'Erro ao criar solicitação' },
        { status: 500 }
      )
    }

    // TODO: Send notification to church admin

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
