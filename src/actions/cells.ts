'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendLeaderWelcomeEmail } from '@/lib/email'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Create a service role client for administrative tasks
const getAdminClient = () => {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function getPotentialLeaders(churchId: string) {
    const supabase = await createClient()

    // Find users that are not already leading a cell or are marked as potential leaders
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('full_name')

    return data || []
}

export async function createCell(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = getAdminClient()

    const name = formData.get('name') as string
    const churchId = formData.get('churchId') as string
    const leaderEmail = formData.get('leaderEmail') as string
    const leaderName = formData.get('leaderName') as string

    let leaderId: string | null = null

    // 1. Check if user already exists
    const { data: existingUser } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('email', leaderEmail)
        .single()

    if (existingUser) {
        leaderId = existingUser.id
    } else {
        // 2. Create new user via Admin API
        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email: leaderEmail,
            password: 'videirasjc',
            email_confirm: true,
            user_metadata: {
                full_name: leaderName,
                role: 'LEADER',
                church_id: churchId
            }
        })

        if (createError) throw createError
        leaderId = newUser.user.id

        // The profile is usually created via trigger, but let's ensure it's there and updated
        // Wait a bit or retry if trigger is slow
        await new Promise(resolve => setTimeout(resolve, 500))

        // 3. Send welcome email
        await sendLeaderWelcomeEmail(leaderEmail, leaderName)
    }

    // 4. Create the cell
    const { data: cell, error: cellError } = await supabase
        .from('cells')
        .insert({
            name,
            leader_id: leaderId,
            church_id: churchId,
            status: 'ACTIVE'
        })
        .select()
        .single()

    if (cellError) throw cellError

    // 5. Update profile role and link cell
    await adminSupabase
        .from('profiles')
        .update({
            role: 'LEADER',
            cell_id: cell.id,
            full_name: leaderName // Ensure name is correct
        })
        .eq('id', leaderId)

    revalidatePath('/dashboard')
    revalidatePath('/configuracoes')
    return cell
}
