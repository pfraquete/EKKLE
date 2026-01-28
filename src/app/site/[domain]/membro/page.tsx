// RESCUE MODE - Simplified Membro Page
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MembroPage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // If user is authenticated, redirect to their profile
    redirect('/login')
  } catch (error) {
    console.error('[MembroPage] Error:', error)
    redirect('/login')
  }
}
