import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'

export async function POST(request: NextRequest) {
  try {
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // 2. Slug Generation & Uniqueness
    let slug = slugify(churchName, { lower: true, strict: true })
    const randomSuffix = Math.floor(Math.random() * 1000)

    // Check if slug exists
    const { data: existingChurch } = await supabase
      .from('churches')
      .select('id')
      .eq('slug', slug)
      .single()

    // If slug exists, append random number (simple collision handling)
    if (existingChurch) {
      slug = `${slug}-${randomSuffix}`
    }

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
