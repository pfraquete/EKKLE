'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendLeaderWelcomeEmail } from '@/lib/email'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generateSecurePassword } from '@/lib/utils'
import { getProfile } from './auth'

// Create a service role client for administrative tasks
const getAdminClient = () => {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function getPotentialLeaders() {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    const churchId = profile.church_id
    const supabase = await createClient()

    // Find users that are not already leading a cell or are marked as potential leaders
    const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('full_name')

    return data || []
}

export async function createCell(formData: FormData) {
    try {
        const profile = await getProfile()
        if (!profile) throw new Error('Não autenticado')
        const churchId = profile.church_id

        const supabase = await createClient()
        const adminSupabase = getAdminClient()

        const name = formData.get('name') as string
        const leaderEmail = formData.get('leaderEmail') as string
        const leaderName = formData.get('leaderName') as string

        let leaderId: string | null = null
        let generatedPassword: string | null = null

        // 1. Check if profile already exists IN THIS CHURCH
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, church_id')
            .eq('email', leaderEmail)
            .eq('church_id', churchId)
            .maybeSingle()

        if (existingProfile) {
            leaderId = existingProfile.id
        } else {
            // 2. Check if user exists in AUTH and then check their PROFILE church_id
            // We use adminSupabase ONLY for the auth check, but we still respect tenant privacy
            const { data: userData, error: listError } = await adminSupabase.auth.admin.listUsers()
            if (listError) {
                console.error('Error listing auth users:', listError)
                throw new Error('Falha ao buscar usuários')
            }

            const authUser = userData.users.find(user => user.email === leaderEmail)

            if (authUser) {
                // If user exists in Auth, check if they belong to THIS church's profiles
                const { data: otherChurchProfile } = await adminSupabase
                    .from('profiles')
                    .select('church_id')
                    .eq('id', authUser.id)
                    .single()

                if (otherChurchProfile && otherChurchProfile.church_id !== churchId) {
                    throw new Error('Este email já está em uso em outra organização')
                }

                leaderId = authUser.id
            } else {
                // 3. Generate secure random password
                generatedPassword = generateSecurePassword(12)

                // 4. Create new user via Admin API
                const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
                    email: leaderEmail,
                    password: generatedPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: leaderName,
                        role: 'LEADER',
                        church_id: churchId
                    }
                })

                if (createError) {
                    console.error('Error creating leader user:', createError)
                    throw new Error('Falha ao criar usuário líder')
                }
                leaderId = newUser.user.id
            }

            // Ensure profile exists and is linked to correct church
            const { data: checkProfile } = await adminSupabase
                .from('profiles')
                .select('id, church_id')
                .eq('id', leaderId)
                .maybeSingle()

            if (!checkProfile) {
                await adminSupabase.from('profiles').insert({
                    id: leaderId,
                    email: leaderEmail,
                    full_name: leaderName,
                    role: 'LEADER',
                    church_id: churchId
                })
            } else if (checkProfile.church_id !== churchId) {
                // Security check should have caught this above, but double check here
                throw new Error('Não é possível adicionar um usuário de outra organização')
            }

            // Wait a bit for consistency
            await new Promise(resolve => setTimeout(resolve, 800))

            // 5. Send welcome email with generated password (non-blocking)
            if (generatedPassword) {
                sendLeaderWelcomeEmail(leaderEmail, leaderName, generatedPassword).catch(e => console.error('Silent email error:', e))
            }
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

        if (cellError) {
            console.error('Error creating cell record:', cellError)
            throw new Error('Falha ao criar registro da célula: ' + cellError.message)
        }

        // 5. Update profile role and link cell
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .update({
                role: 'LEADER',
                cell_id: cell.id,
                full_name: leaderName
            })
            .eq('id', leaderId)

        if (profileError) {
            console.error('Error updating leader profile:', profileError)
        }

        revalidatePath('/dashboard')
        revalidatePath('/celulas')
        revalidatePath('/membros')
        revalidatePath('/configuracoes')
        return cell
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('CRITICAL ERROR in createCell:', message)
        throw error
    }
}
export async function updateCell(cellId: string, formData: FormData) {
    try {
        const profile = await getProfile()
        if (!profile) throw new Error('Não autenticado')
        const churchId = profile.church_id

        const supabase = await createClient()
        const adminSupabase = getAdminClient()

        const name = formData.get('name') as string
        const address = formData.get('address') as string
        const neighborhood = formData.get('neighborhood') as string
        const dayOfWeek = formData.get('dayOfWeek') ? parseInt(formData.get('dayOfWeek') as string) : null
        const meetingTime = formData.get('meetingTime') as string || null
        const leaderId = formData.get('leaderId') as string

        // 1. Get current cell data to check if leader changed
        const { data: currentCell } = await supabase
            .from('cells')
            .select('leader_id')
            .eq('id', cellId)
            .single()

        const oldLeaderId = currentCell?.leader_id

        // 2. Update cell
        const { error: cellError } = await supabase
            .from('cells')
            .update({
                name,
                address,
                neighborhood,
                day_of_week: dayOfWeek,
                meeting_time: meetingTime,
                leader_id: leaderId
            })
            .eq('id', cellId)
            .eq('church_id', churchId)

        if (cellError) throw new Error('Falha ao atualizar célula: ' + cellError.message)

        // 3. Handle leader change in profiles
        if (oldLeaderId !== leaderId) {
            // New leader: ensure they have the role and are linked to this cell
            await adminSupabase
                .from('profiles')
                .update({
                    role: 'LEADER',
                    cell_id: cellId
                })
                .eq('id', leaderId)

            // Old leader: if they were only leading this cell, we don't necessarily strip their role 
            // but we might want to update their cell_id if they are no longer in this cell.
            // For now, let's just make sure the new leader is correctly set.
        }

        revalidatePath('/celulas')
        revalidatePath(`/celulas/${cellId}`)
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error) {
        console.error('Error in updateCell:', error)
        throw error
    }
}
