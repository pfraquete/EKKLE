'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isEkkleHubUser } from '@/lib/ekkle-utils'

export interface ChurchModules {
    cells_enabled: boolean
    departments_enabled: boolean
    ebd_enabled: boolean
}

export interface Profile {
    id: string
    church_id: string
    full_name: string
    email: string | null
    phone: string | null
    photo_url: string | null
    member_stage: 'VISITOR' | 'REGULAR_VISITOR' | 'MEMBER' | 'LEADER'
    role: 'PASTOR' | 'DISCIPULADOR' | 'LEADER' | 'MEMBER'
    cell_id: string | null
    is_active: boolean
    is_teacher: boolean
    is_finance_team: boolean
    // Rede Kids fields
    is_kids_network: boolean
    kids_role: 'PASTORA_KIDS' | 'DISCIPULADORA_KIDS' | 'LEADER_KIDS' | 'MEMBER_KIDS' | null
    kids_cell_id: string | null
    // Module configuration
    modules?: ChurchModules
}

/**
 * Get the current user's profile.
 * Uses React.cache() to deduplicate across the same server request.
 * This avoids 7+ redundant auth.getUser() + profiles.select() calls per page load.
 */
export async function getProfile(): Promise<Profile | null> {
    // Import dynamically to avoid circular deps in non-RSC contexts
    const { getCachedProfile } = await import('@/lib/cache/profile-cache')
    return getCachedProfile()
}

/**
 * Get the current user's profile with church module configuration.
 * Used by layout/navigation components that need to know which modules are active.
 */
export async function getProfileWithModules(): Promise<Profile | null> {
    const { getCachedProfileWithModules } = await import('@/lib/cache/profile-cache')
    return getCachedProfileWithModules()
}

export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // Get user profile to determine redirect
    if (authData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('church_id, role')
            .eq('id', authData.user.id)
            .single()

        revalidatePath('/', 'layout')

        // Ekkle Hub users go to /ekkle/membro
        if (profile && isEkkleHubUser(profile)) {
            redirect('/ekkle/membro')
        }

        // Regular users go to dashboard (which will redirect based on role)
        redirect('/dashboard')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signUp(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const churchId = formData.get('church_id') as string

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    })

    if (authError) {
        return redirect(`/cadastro?error=${encodeURIComponent(authError.message)}`)
    }

    if (!authData.user) {
        return redirect(`/cadastro?error=${encodeURIComponent('Erro ao criar usuário')}`)
    }

    // Create profile
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: authData.user.id,
            church_id: churchId,
            full_name: fullName,
            email: email,
            phone: phone || null,
            role: 'MEMBER',
            member_stage: 'VISITOR',
            is_active: true,
        })

    if (profileError) {
        console.error('Error creating profile:', profileError)
        return redirect(`/cadastro?error=${encodeURIComponent('Erro ao criar perfil')}`)
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Conta criada com sucesso! Faça login para continuar.')
}


export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}


export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
        redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
    }

    redirect(`/forgot-password?message=${encodeURIComponent('Link de recuperação enviado! Verifique seu email.')}`)
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return redirect('/reset-password?error=As senhas não coincidem')
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/dashboard?message=Senha atualizada com sucesso')
}
export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const file = formData.get('avatar') as File | null

    let photoUrl = formData.get('currentPhotoUrl') as string || null

    if (file && file.size > 0) {
        // Upload new avatar
        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            throw new Error('Falha ao fazer upload da imagem')
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        photoUrl = publicUrl
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            phone: phone,
            photo_url: photoUrl
        })
        .eq('id', user.id)

    if (error) {
        console.error('Update profile error:', error)
        throw new Error('Falha ao atualizar perfil')
    }

    revalidatePath('/configuracoes')
    revalidatePath('/dashboard')
    revalidatePath('/', 'layout')

    return { success: true }
}

export async function updateMyProfile(data: {
    full_name: string
    phone?: string
    birthday?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const updateData: Record<string, string | null> = {
        full_name: data.full_name,
        phone: data.phone || null,
    }

    if (data.birthday !== undefined) {
        updateData.birthday = data.birthday || null
    }

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    if (error) {
        console.error('Update profile error:', error)
        return { success: false, error: 'Falha ao atualizar perfil' }
    }

    revalidatePath('/membro')
    revalidatePath('/', 'layout')

    return { success: true }
}

export async function getChurchMembers() {
    try {
        const profile = await getProfile()
        if (!profile) return []

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('church_id', profile.church_id)
            .eq('is_active', true)
            .order('full_name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting church members:', error)
        return []
    }
}
