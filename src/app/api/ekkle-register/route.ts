import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email'
import { rateLimiters, getClientIP } from '@/lib/rate-limiter'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'

// Force dynamic rendering - prevents build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Password validation function
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um número' }
  }
  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiters.memberRegistration(clientIP)

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: `Muitas tentativas de cadastro. Tente novamente em ${retryAfter} segundos.` },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { fullName, email, phone, password } = body

    // Validate required fields
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validate name length
    if (fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome deve ter pelo menos 2 caracteres' },
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

    // Check if email already exists in profiles (globally - across all churches)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, church_id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado. Se esqueceu sua senha, use a opção "Esqueci minha senha" no login.' },
        { status: 400 }
      )
    }

    // 1. Create user in Supabase Auth with user's chosen password
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        church_id: EKKLE_HUB_ID,
        is_ekkle_user: true,
      },
    })

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: 'Erro ao criar conta de usuário. Verifique se o email é válido.' },
        { status: 500 }
      )
    }

    try {
      // 2. Create profile in profiles table - belongs to Ekkle Hub
      const profileData = {
        id: authUser.user.id,
        church_id: EKKLE_HUB_ID,
        full_name: fullName.trim(),
        email,
        phone: phone || null,
        member_stage: 'VISITOR',
        role: 'MEMBER',
        cell_id: null,
        is_active: true,
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return NextResponse.json(
          { error: 'Erro ao criar perfil de usuário' },
          { status: 500 }
        )
      }

      // 3. Send welcome email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.com.br'
      const loginUrl = `${appUrl}/login`

      const emailResult = await sendWelcomeEmail({
        to: email,
        name: fullName,
        churchName: 'Ekkle',
        loginUrl,
      })

      if (!emailResult.success) {
        console.error('Error sending welcome email:', emailResult.error)
        // Don't rollback user creation if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Cadastro concluído com sucesso! Bem-vindo ao Ekkle. Agora você pode encontrar sua comunidade de fé.',
      })
    } catch (error) {
      console.error('Error in registration process:', error)
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'Erro ao processar cadastro' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
