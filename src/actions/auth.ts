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
}

export async function getProfile(): Promise<Profile | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
        return { error: error.message }
    }

    return { success: true }
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
