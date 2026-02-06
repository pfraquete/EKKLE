'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

export interface Department {
    id: string
    church_id: string
    name: string
    description: string | null
    leader_id: string | null
    status: 'ACTIVE' | 'INACTIVE'
    color: string | null
    created_at: string
    updated_at: string
    leader?: {
        id: string
        full_name: string
        photo_url: string | null
    } | null
    members_count?: number
}

export interface DepartmentMember {
    id: string
    department_id: string
    profile_id: string
    role: 'LEADER' | 'MEMBER'
    joined_at: string
    profile?: {
        id: string
        full_name: string
        email: string | null
        phone: string | null
        photo_url: string | null
    }
}

export async function getDepartments(): Promise<Department[]> {
    const profile = await getProfile()
    if (!profile) return []

    const supabase = await createClient()

    const { data: departments, error } = await supabase
        .from('departments')
        .select(`
            *,
            leader:profiles!departments_leader_id_fkey(id, full_name, photo_url)
        `)
        .eq('church_id', profile.church_id)
        .order('name')

    if (error) {
        console.error('Error fetching departments:', error)
        return []
    }

    // Get member counts
    const deptIds = departments.map(d => d.id)
    if (deptIds.length > 0) {
        const { data: counts } = await supabase
            .from('department_members')
            .select('department_id')
            .in('department_id', deptIds)

        const countMap: Record<string, number> = {}
        counts?.forEach(c => {
            countMap[c.department_id] = (countMap[c.department_id] || 0) + 1
        })

        return departments.map(d => ({
            ...d,
            members_count: countMap[d.id] || 0
        }))
    }

    return departments.map(d => ({ ...d, members_count: 0 }))
}

export async function getDepartmentById(id: string): Promise<{ department: Department; members: DepartmentMember[] } | null> {
    const profile = await getProfile()
    if (!profile) return null

    const supabase = await createClient()

    const { data: department, error } = await supabase
        .from('departments')
        .select(`
            *,
            leader:profiles!departments_leader_id_fkey(id, full_name, photo_url)
        `)
        .eq('id', id)
        .eq('church_id', profile.church_id)
        .single()

    if (error || !department) {
        console.error('Error fetching department:', error)
        return null
    }

    const { data: members, error: membersError } = await supabase
        .from('department_members')
        .select(`
            *,
            profile:profiles(id, full_name, email, phone, photo_url)
        `)
        .eq('department_id', id)
        .order('joined_at', { ascending: false })

    if (membersError) {
        console.error('Error fetching department members:', membersError)
        return { department, members: [] }
    }

    // Count members
    department.members_count = members?.length || 0

    return { department, members: members || [] }
}

export async function createDepartment(formData: FormData) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const leaderId = formData.get('leader_id') as string | null
    const color = formData.get('color') as string | null

    if (!name?.trim()) {
        return { success: false, error: 'Nome é obrigatório' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('departments')
        .insert({
            church_id: profile.church_id,
            name: name.trim(),
            description: description?.trim() || null,
            leader_id: leaderId || null,
            color: color || null,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Error creating department:', error)
        return { success: false, error: 'Erro ao criar departamento' }
    }

    revalidatePath('/departamentos')
    return { success: true, id: data.id }
}

export async function updateDepartment(id: string, formData: FormData) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const leaderId = formData.get('leader_id') as string | null
    const color = formData.get('color') as string | null
    const status = formData.get('status') as string | null

    if (!name?.trim()) {
        return { success: false, error: 'Nome é obrigatório' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('departments')
        .update({
            name: name.trim(),
            description: description?.trim() || null,
            leader_id: leaderId || null,
            color: color || null,
            status: status || 'ACTIVE',
        })
        .eq('id', id)
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('Error updating department:', error)
        return { success: false, error: 'Erro ao atualizar departamento' }
    }

    revalidatePath('/departamentos')
    revalidatePath(`/departamentos/${id}`)
    return { success: true }
}

export async function deleteDepartment(id: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('Error deleting department:', error)
        return { success: false, error: 'Erro ao excluir departamento' }
    }

    revalidatePath('/departamentos')
    return { success: true }
}

export async function addDepartmentMember(departmentId: string, profileId: string, role: 'LEADER' | 'MEMBER' = 'MEMBER') {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('department_members')
        .insert({
            department_id: departmentId,
            profile_id: profileId,
            role,
        })

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Membro já faz parte deste departamento' }
        }
        console.error('Error adding department member:', error)
        return { success: false, error: 'Erro ao adicionar membro' }
    }

    revalidatePath(`/departamentos/${departmentId}`)
    return { success: true }
}

export async function removeDepartmentMember(departmentId: string, profileId: string) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Sem permissão')

    const supabase = await createClient()

    const { error } = await supabase
        .from('department_members')
        .delete()
        .eq('department_id', departmentId)
        .eq('profile_id', profileId)

    if (error) {
        console.error('Error removing department member:', error)
        return { success: false, error: 'Erro ao remover membro' }
    }

    revalidatePath(`/departamentos/${departmentId}`)
    return { success: true }
}
