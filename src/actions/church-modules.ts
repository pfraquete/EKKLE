'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

export interface ChurchModulesData {
    cells_enabled: boolean
    departments_enabled: boolean
    ebd_enabled: boolean
}

export async function getChurchModules(): Promise<ChurchModulesData | null> {
    const profile = await getProfile()
    if (!profile) return null

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('church_modules')
        .select('cells_enabled, departments_enabled, ebd_enabled')
        .eq('church_id', profile.church_id)
        .single()

    if (error) {
        console.error('Error fetching church modules:', error)
        return null
    }

    return data
}

export async function updateChurchModules(modules: ChurchModulesData) {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Apenas pastores podem alterar módulos')

    const supabase = await createClient()

    const { error } = await supabase
        .from('church_modules')
        .update({
            cells_enabled: modules.cells_enabled,
            departments_enabled: modules.departments_enabled,
            ebd_enabled: modules.ebd_enabled,
        })
        .eq('church_id', profile.church_id)

    if (error) {
        console.error('Error updating church modules:', error)
        return { success: false, error: 'Erro ao atualizar módulos' }
    }

    revalidatePath('/configuracoes/modulos')
    revalidatePath('/', 'layout')

    return { success: true }
}

export async function isModuleEnabled(moduleName: 'cells' | 'departments' | 'ebd'): Promise<boolean> {
    const profile = await getProfile()
    if (!profile) return false

    const supabase = await createClient()

    const { data } = await supabase
        .from('church_modules')
        .select('cells_enabled, departments_enabled, ebd_enabled')
        .eq('church_id', profile.church_id)
        .single()

    if (!data) return moduleName === 'cells'

    const key = `${moduleName}_enabled` as keyof typeof data
    return (data[key] as boolean) ?? (moduleName === 'cells')
}
