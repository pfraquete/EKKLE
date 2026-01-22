'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface Profile {
    id: string
    church_id: string
    full_name: string
    email: string | null
    phone: string | null
    photo_url: string | null
    member_stage: 'VISITOR' | 'REGULAR_VISITOR' | 'MEMBER' | 'LEADER'
    role: 'PASTOR' | 'LEADER' | 'MEMBER'
    cell_id: string | null
    is_active: boolean
    joined_at: string | null
}

export async function getProfile(): Promise<Profile | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return profile
}

export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
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
