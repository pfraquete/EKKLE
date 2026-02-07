'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============ TYPES ============

export type ChecklistSection = 'ANTES' | 'DURANTE' | 'FINAL'

export interface ChecklistTemplate {
  id: string
  church_id: string
  title: string
  section: ChecklistSection
  sort_order: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  service_id: string
  template_id: string
  is_completed: boolean
  completed_by: string | null
  completed_at: string | null
  created_at: string
  template?: ChecklistTemplate
}

// ============ SCHEMAS ============

const templateSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  section: z.enum(['ANTES', 'DURANTE', 'FINAL']),
  sort_order: z.number().int().min(0).default(0),
})

// ============ TEMPLATE ACTIONS ============

export async function getChecklistTemplates() {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_checklist_templates')
      .select('*')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('section')
      .order('sort_order')

    if (error) throw new Error('Erro ao buscar templates do checklist')

    return (data || []) as ChecklistTemplate[]
  } catch (error) {
    console.error('Error getting checklist templates:', error)
    return []
  }
}

export async function createChecklistTemplate(data: { title: string; section: ChecklistSection; sort_order?: number }) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Apenas pastores podem gerenciar o checklist')

    const validated = templateSchema.parse({ ...data, sort_order: data.sort_order ?? 0 })
    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('service_checklist_templates')
      .insert({
        ...validated,
        church_id: profile.church_id,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) throw new Error('Erro ao criar item do checklist')

    revalidatePath('/dashboard/cultos')

    return { success: true, template }
  } catch (error: unknown) {
    console.error('Error creating checklist template:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function updateChecklistTemplate(
  templateId: string,
  data: { title?: string; section?: ChecklistSection; sort_order?: number }
) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Apenas pastores podem gerenciar o checklist')

    const supabase = await createClient()

    const { error } = await supabase
      .from('service_checklist_templates')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', templateId)
      .eq('church_id', profile.church_id)

    if (error) throw new Error('Erro ao atualizar item do checklist')

    revalidatePath('/dashboard/cultos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating checklist template:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function deleteChecklistTemplate(templateId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Apenas pastores podem gerenciar o checklist')

    const supabase = await createClient()

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('service_checklist_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', templateId)
      .eq('church_id', profile.church_id)

    if (error) throw new Error('Erro ao remover item do checklist')

    revalidatePath('/dashboard/cultos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting checklist template:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

export async function reorderChecklistTemplates(items: { id: string; sort_order: number }[]) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR') throw new Error('Apenas pastores podem gerenciar o checklist')

    const supabase = await createClient()

    for (const item of items) {
      const { error } = await supabase
        .from('service_checklist_templates')
        .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('church_id', profile.church_id)

      if (error) throw new Error('Erro ao reordenar checklist')
    }

    revalidatePath('/dashboard/cultos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error reordering checklist templates:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}

// ============ CHECKLIST ITEM ACTIONS (per service) ============

export async function getServiceChecklist(serviceId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')

    const supabase = await createClient()

    // Get all active templates for this church
    const { data: templates, error: templatesError } = await supabase
      .from('service_checklist_templates')
      .select('*')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('section')
      .order('sort_order')

    if (templatesError) throw new Error('Erro ao buscar templates')

    if (!templates || templates.length === 0) {
      return { templates: [], items: [] }
    }

    // Get existing checklist items for this service
    const { data: existingItems, error: itemsError } = await supabase
      .from('service_checklist_items')
      .select('*, completed_profile:profiles!completed_by(full_name)')
      .eq('service_id', serviceId)

    if (itemsError) throw new Error('Erro ao buscar itens do checklist')

    // Create items for templates that don't have items yet
    const existingTemplateIds = new Set((existingItems || []).map((item: any) => item.template_id))
    const missingTemplates = (templates as ChecklistTemplate[]).filter((t: ChecklistTemplate) => !existingTemplateIds.has(t.id))

    if (missingTemplates.length > 0) {
      const newItems = missingTemplates.map((t: ChecklistTemplate) => ({
        service_id: serviceId,
        template_id: t.id,
        is_completed: false,
      }))

      const { error: insertError } = await supabase
        .from('service_checklist_items')
        .insert(newItems)

      if (insertError) {
        console.error('Error creating checklist items:', insertError)
      }

      // Re-fetch all items after insert
      const { data: allItems, error: refetchError } = await supabase
        .from('service_checklist_items')
        .select('*, completed_profile:profiles!completed_by(full_name)')
        .eq('service_id', serviceId)

      if (refetchError) throw new Error('Erro ao buscar itens do checklist')

      return {
        templates: templates as ChecklistTemplate[],
        items: (allItems || []) as (ChecklistItem & { completed_profile?: { full_name: string } | null })[],
      }
    }

    return {
      templates: templates as ChecklistTemplate[],
      items: (existingItems || []) as (ChecklistItem & { completed_profile?: { full_name: string } | null })[],
    }
  } catch (error) {
    console.error('Error getting service checklist:', error)
    return { templates: [], items: [] }
  }
}

export async function toggleChecklistItem(itemId: string, serviceId: string) {
  try {
    const profile = await getProfile()
    if (!profile) throw new Error('Não autenticado')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') {
      throw new Error('Sem permissão')
    }

    const supabase = await createClient()

    // Get current state
    const { data: item, error: fetchError } = await supabase
      .from('service_checklist_items')
      .select('is_completed')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) throw new Error('Item não encontrado')

    const newCompleted = !item.is_completed

    const { error } = await supabase
      .from('service_checklist_items')
      .update({
        is_completed: newCompleted,
        completed_by: newCompleted ? profile.id : null,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', itemId)

    if (error) throw new Error('Erro ao atualizar item')

    revalidatePath(`/dashboard/cultos/${serviceId}`)

    return { success: true, is_completed: newCompleted }
  } catch (error: unknown) {
    console.error('Error toggling checklist item:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro desconhecido' }
  }
}
