import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import crypto from 'crypto'
import { rateLimiters, getClientIP } from '@/lib/rate-limiter'

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

// Generate unique slug with crypto-safe random suffix
async function generateUniqueSlug(supabase: any, churchName: string): Promise<string> {
  const baseSlug = slugify(churchName, { lower: true, strict: true })

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0
      ? baseSlug
      : `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`

    const { data: existing } = await supabase
      .from('churches')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) return slug
  }

  // Fallback: use UUID
  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimiters.churchRegistration(clientIP)

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

    // Parse request body
    const body = await request.json()
    const { churchName, fullName, email, password, phone } = body

    // 1. Basic Validation
    if (!churchName || !fullName || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
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

    // 2. Slug Generation & Uniqueness (with crypto-safe collision handling)
    const slug = await generateUniqueSlug(supabase, churchName)

    // 3. Create Auth User
    // We use admin.createUser to skip email confirmation if desired, or handle it manually.
    // For now, auto-confirm for immediate access (SaaS style).
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (authError || !authUser.user) {
      console.error('Auth create error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário de autenticação' },
        { status: 400 }
      )
    }

    const userId = authUser.user.id

    // 4. Create Church
    const { data: newChurch, error: churchError } = await supabase
      .from('churches')
      .insert({
        name: churchName,
        slug: slug,
        website_settings: {} // Initialize empty settings
      })
      .select()
      .single()

    if (churchError || !newChurch) {
      // Rollback user creation if church fails (manual compensation since no distributed transaction)
      await supabase.auth.admin.deleteUser(userId)
      console.error('Church create error:', churchError)
      return NextResponse.json(
        { error: 'Erro ao criar estrutura da igreja' },
        { status: 500 }
      )
    }

    // 5. Create Profile (PASTOR)
    // Note: Trigger might create a profile automatically on auth.users insert depending on setup.
    // We explicitly insert/upsert to ensure correct role and church_id.

    // First, check if profile was auto-created by a trigger (common pattern in Supabase starter kits)
    // If so, update it. If not, insert it.

    // Let's try upsert to cover both cases. Be careful not to overwrite other fields if auto-created.
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        church_id: newChurch.id,
        full_name: fullName,
        email: email,
        phone: phone,
        role: 'PASTOR',
        member_stage: 'LEADER', // Pastors are leaders
        is_active: true,
        // updated_at: new Date().toISOString() // handled by db
      })

    if (profileError) {
      console.error('Profile create error:', profileError)
      // Severe error: User and Church created, but profile failed. 
      // Manual cleanup might be needed or user is in inconsistent state.
      // For this MVP step, we log and return error.
      return NextResponse.json(
        { error: 'Erro ao configurar perfil de administrador' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, churchSlug: slug })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar cadastro' },
      { status: 500 }
    )
  }
}
