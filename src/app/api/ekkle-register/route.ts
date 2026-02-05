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
    const { fullName, email, phone, nickname, password, churchId } = body

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

    // Validate nickname if provided
    if (nickname) {
      const nicknameRegex = /^[a-zA-Z0-9_]{3,20}$/
      if (!nicknameRegex.test(nickname)) {
        return NextResponse.json(
          { error: 'Nickname deve ter 3-20 caracteres (apenas letras, números e _)' },
          { status: 400 }
        )
      }
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

    // Determine effective church: if churchId provided, validate it; otherwise use Ekkle Hub
    let effectiveChurchId = EKKLE_HUB_ID
    let effectiveChurchName = 'Ekkle'

    if (churchId) {
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('id, name, is_public_listed')
        .eq('id', churchId)
        .eq('is_public_listed', true)
        .neq('id', EKKLE_HUB_ID)
        .single()

      if (churchError || !church) {
        return NextResponse.json(
          { error: 'Igreja selecionada não encontrada ou não está aceitando membros' },
          { status: 400 }
        )
      }

      effectiveChurchId = church.id
      effectiveChurchName = church.name
    }

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

    // Check if nickname is already taken (if provided)
    if (nickname) {
      const { data: existingNickname } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname.toLowerCase())
        .single()

      if (existingNickname) {
        return NextResponse.json(
          { error: 'Este nickname já está em uso. Escolha outro.' },
          { status: 400 }
        )
      }
    }

    // 1. Create user in Supabase Auth with user's chosen password
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        church_id: effectiveChurchId,
        is_ekkle_user: !churchId,
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
      // 2. Create profile in profiles table
      const profileData = {
        id: authUser.user.id,
        church_id: effectiveChurchId,
        full_name: fullName.trim(),
        email,
        phone: phone || null,
        nickname: nickname ? nickname.toLowerCase() : null,
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
        churchName: effectiveChurchName,
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
