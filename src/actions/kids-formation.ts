'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface FormationStage {
  id: string
  church_id: string
  name: string
  description: string | null
  stage_order: number
  icon_name: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChildFormationProgress {
  id: string
  church_id: string
  child_id: string
  stage_id: string
  completed_at: string
  notes: string | null
  completed_by: string | null
  created_at: string
  stage?: FormationStage
  completed_by_profile?: {
    id: string
    full_name: string
  }
}

export interface ChildWithProgress {
  id: string
  full_name: string
  photo_url: string | null
  current_stage: FormationStage | null
  completed_stages: ChildFormationProgress[]
  next_stage: FormationStage | null
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createStageSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional().nullable(),
  icon_name: z.string().default('star'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').default('#3B82F6'),
})

const updateStageSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  description: z.string().optional().nullable(),
  stage_order: z.number().min(1).optional(),
  icon_name: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  is_active: z.boolean().optional(),
})

const markProgressSchema = z.object({
  childId: z.string().uuid('ID da criança inválido'),
  stageId: z.string().uuid('ID da etapa inválido'),
  notes: z.string().optional().nullable(),
})

// =====================================================
// HELPER: Check Permission
// =====================================================

async function checkKidsPermission(requiredRoles: string[] = ['PASTOR']) {
  const profile = await getProfile()
  if (!profile) {
    return { error: 'Não autenticado', profile: null }
  }

  // Pastor sempre tem acesso
  if (profile.role === 'PASTOR') {
    return { error: null, profile }
  }

  // Verificar se tem papel na rede kids
  if (requiredRoles.includes(profile.kids_role || '')) {
    return { error: null, profile }
  }

  return { error: 'Sem permissão para esta ação', profile: null }
}

// =====================================================
// FORMATION STAGES - CRUD
// =====================================================

/**
 * Get all formation stages for the church
 */
export async function getFormationStages(): Promise<FormationStage[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_formation_stages')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('stage_order', { ascending: true })

  if (error) {
    console.error('Error fetching formation stages:', error)
    return []
  }

  return data as FormationStage[]
}

/**
 * Get active formation stages only
 */
export async function getActiveFormationStages(): Promise<FormationStage[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_formation_stages')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('stage_order', { ascending: true })

  if (error) {
    console.error('Error fetching active formation stages:', error)
    return []
  }

  return data as FormationStage[]
}

/**
 * Create a new formation stage (Pastor only)
 */
export async function createFormationStage(data: z.infer<typeof createStageSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = createStageSchema.parse(data)
    const supabase = await createClient()

    // Get the next stage_order
    const { data: lastStage } = await supabase
      .from('kids_formation_stages')
      .select('stage_order')
      .eq('church_id', profile.church_id)
      .order('stage_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastStage?.stage_order || 0) + 1

    const { data: stage, error } = await supabase
      .from('kids_formation_stages')
      .insert({
        church_id: profile.church_id,
        name: validated.name,
        description: validated.description || null,
        stage_order: nextOrder,
        icon_name: validated.icon_name,
        color: validated.color,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating formation stage:', error)
      return { success: false, error: 'Erro ao criar etapa' }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/configuracoes/trilho')

    return { success: true, data: stage }
  } catch (error) {
    console.error('Error in createFormationStage:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar etapa' }
  }
}

/**
 * Update a formation stage (Pastor only)
 */
export async function updateFormationStage(id: string, data: z.infer<typeof updateStageSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = updateStageSchema.parse(data)
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.stage_order !== undefined) updateData.stage_order = validated.stage_order
    if (validated.icon_name !== undefined) updateData.icon_name = validated.icon_name
    if (validated.color !== undefined) updateData.color = validated.color
    if (validated.is_active !== undefined) updateData.is_active = validated.is_active

    const { data: stage, error } = await supabase
      .from('kids_formation_stages')
      .update(updateData)
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating formation stage:', error)
      return { success: false, error: 'Erro ao atualizar etapa' }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/configuracoes/trilho')

    return { success: true, data: stage }
  } catch (error) {
    console.error('Error in updateFormationStage:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar etapa' }
  }
}

/**
 * Delete a formation stage (Pastor only)
 */
export async function deleteFormationStage(id: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    // Check if there are children with progress in this stage
    const { count } = await supabase
      .from('kids_child_formation_progress')
      .select('*', { count: 'exact', head: true })
      .eq('stage_id', id)

    if (count && count > 0) {
      return { 
        success: false, 
        error: `Não é possível excluir: ${count} criança(s) já completaram esta etapa` 
      }
    }

    const { error } = await supabase
      .from('kids_formation_stages')
      .delete()
      .eq('id', id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error deleting formation stage:', error)
      return { success: false, error: 'Erro ao excluir etapa' }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/configuracoes/trilho')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteFormationStage:', error)
    return { success: false, error: 'Erro ao excluir etapa' }
  }
}

/**
 * Reorder formation stages (Pastor only)
 */
export async function reorderFormationStages(stageIds: string[]) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    // Update each stage with its new order
    for (let i = 0; i < stageIds.length; i++) {
      const { error } = await supabase
        .from('kids_formation_stages')
        .update({ stage_order: i + 1 })
        .eq('id', stageIds[i])
        .eq('church_id', profile.church_id)

      if (error) {
        console.error('Error reordering stage:', error)
        return { success: false, error: 'Erro ao reordenar etapas' }
      }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/configuracoes/trilho')

    return { success: true }
  } catch (error) {
    console.error('Error in reorderFormationStages:', error)
    return { success: false, error: 'Erro ao reordenar etapas' }
  }
}

/**
 * Seed default formation stages for a church
 */
export async function seedDefaultFormationStages() {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    // Call the database function
    const { error } = await supabase.rpc('seed_default_kids_formation_stages', {
      target_church_id: profile.church_id,
    })

    if (error) {
      console.error('Error seeding default stages:', error)
      return { success: false, error: 'Erro ao criar etapas padrão' }
    }

    revalidatePath('/rede-kids')
    revalidatePath('/rede-kids/configuracoes/trilho')

    return { success: true }
  } catch (error) {
    console.error('Error in seedDefaultFormationStages:', error)
    return { success: false, error: 'Erro ao criar etapas padrão' }
  }
}

// =====================================================
// CHILD PROGRESS
// =====================================================

/**
 * Get progress for a specific child
 */
export async function getChildProgress(childId: string): Promise<ChildFormationProgress[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_child_formation_progress')
    .select(`
      *,
      stage:kids_formation_stages(*),
      completed_by_profile:profiles!kids_child_formation_progress_completed_by_fkey(id, full_name)
    `)
    .eq('child_id', childId)
    .eq('church_id', profile.church_id)
    .order('completed_at', { ascending: true })

  if (error) {
    console.error('Error fetching child progress:', error)
    return []
  }

  return data as unknown as ChildFormationProgress[]
}

/**
 * Get child with full progress information
 */
export async function getChildWithProgress(childId: string): Promise<ChildWithProgress | null> {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  // Get child info
  const { data: child, error: childError } = await supabase
    .from('kids_children')
    .select('id, full_name, photo_url')
    .eq('id', childId)
    .eq('church_id', profile.church_id)
    .single()

  if (childError || !child) {
    console.error('Error fetching child:', childError)
    return null
  }

  // Get all stages
  const stages = await getActiveFormationStages()

  // Get child's progress
  const progress = await getChildProgress(childId)

  // Determine current and next stage
  const completedStageIds = progress.map(p => p.stage_id)
  const completedStages = stages.filter(s => completedStageIds.includes(s.id))
  const currentStage = completedStages.length > 0 
    ? completedStages[completedStages.length - 1] 
    : null
  
  const nextStageIndex = currentStage 
    ? stages.findIndex(s => s.id === currentStage.id) + 1 
    : 0
  const nextStage = nextStageIndex < stages.length ? stages[nextStageIndex] : null

  return {
    id: child.id,
    full_name: child.full_name,
    photo_url: child.photo_url,
    current_stage: currentStage,
    completed_stages: progress,
    next_stage: nextStage,
  }
}

/**
 * Mark a stage as completed for a child (Leaders and above)
 */
export async function markStageAsCompleted(data: z.infer<typeof markProgressSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'LEADER_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = markProgressSchema.parse(data)
    const supabase = await createClient()

    // Verify child exists and belongs to the same church
    const { data: child } = await supabase
      .from('kids_children')
      .select('id, full_name, parent_phone, parent_email, parent_name')
      .eq('id', validated.childId)
      .eq('church_id', profile.church_id)
      .single()

    if (!child) {
      return { success: false, error: 'Criança não encontrada' }
    }

    // Verify stage exists and belongs to the same church
    const { data: stage } = await supabase
      .from('kids_formation_stages')
      .select('id, name, description, color, icon_name')
      .eq('id', validated.stageId)
      .eq('church_id', profile.church_id)
      .single()

    if (!stage) {
      return { success: false, error: 'Etapa não encontrada' }
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from('kids_child_formation_progress')
      .select('id')
      .eq('child_id', validated.childId)
      .eq('stage_id', validated.stageId)
      .single()

    if (existing) {
      return { success: false, error: 'Esta etapa já foi concluída' }
    }

    // Create progress record
    const { data: progress, error } = await supabase
      .from('kids_child_formation_progress')
      .insert({
        church_id: profile.church_id,
        child_id: validated.childId,
        stage_id: validated.stageId,
        notes: validated.notes || null,
        completed_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error marking stage as completed:', error)
      return { success: false, error: 'Erro ao marcar etapa como concluída' }
    }

    revalidatePath('/rede-kids')
    revalidatePath(`/rede-kids/criancas/${validated.childId}`)

    // Send notification to parents (async, don't wait)
    sendFormationCompletionNotification({
      childName: child.full_name,
      stageName: stage.name,
      parentPhone: child.parent_phone,
      parentEmail: child.parent_email,
      parentName: child.parent_name,
      churchId: profile.church_id,
    }).catch(err => console.error('Error sending formation notification:', err))

    return { success: true, data: progress }
  } catch (error) {
    console.error('Error in markStageAsCompleted:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao marcar etapa como concluída' }
  }
}

/**
 * Remove a stage completion from a child (Pastor only)
 */
export async function removeStageFromChild(progressId: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR', 'PASTORA_KIDS'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    // Get the progress record to find the child ID for revalidation
    const { data: progress } = await supabase
      .from('kids_child_formation_progress')
      .select('child_id')
      .eq('id', progressId)
      .eq('church_id', profile.church_id)
      .single()

    if (!progress) {
      return { success: false, error: 'Registro não encontrado' }
    }

    const { error } = await supabase
      .from('kids_child_formation_progress')
      .delete()
      .eq('id', progressId)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error removing stage from child:', error)
      return { success: false, error: 'Erro ao remover etapa' }
    }

    revalidatePath('/rede-kids')
    revalidatePath(`/rede-kids/criancas/${progress.child_id}`)

    return { success: true }
  } catch (error) {
    console.error('Error in removeStageFromChild:', error)
    return { success: false, error: 'Erro ao remover etapa' }
  }
}

// =====================================================
// STATISTICS
// =====================================================

/**
 * Get formation statistics for the dashboard
 */
export async function getFormationStats() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  // Get total children
  const { count: totalChildren } = await supabase
    .from('kids_children')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', profile.church_id)
    .eq('is_active', true)

  // Get children with at least one completed stage
  const { data: progressData } = await supabase
    .from('kids_child_formation_progress')
    .select('child_id')
    .eq('church_id', profile.church_id)

  const childrenWithProgress = new Set(progressData?.map(p => p.child_id) || [])

  // Get count per stage
  const stages = await getActiveFormationStages()
  const stageStats = await Promise.all(
    stages.map(async (stage) => {
      const { count } = await supabase
        .from('kids_child_formation_progress')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', profile.church_id)
        .eq('stage_id', stage.id)

      return {
        stage,
        count: count || 0,
      }
    })
  )

  return {
    totalChildren: totalChildren || 0,
    childrenWithProgress: childrenWithProgress.size,
    childrenWithoutProgress: (totalChildren || 0) - childrenWithProgress.size,
    stageStats,
  }
}


// =====================================================
// NOTIFICATIONS
// =====================================================

interface FormationNotificationData {
  childName: string
  stageName: string
  parentPhone: string | null
  parentEmail: string | null
  parentName: string | null
  churchId: string
}

/**
 * Send notification to parents when child completes a formation stage
 */
async function sendFormationCompletionNotification(data: FormationNotificationData) {
  const { childName, stageName, parentPhone, parentEmail, parentName, churchId } = data

  // Skip if no contact info
  if (!parentPhone && !parentEmail) {
    return
  }

  const supabase = await createClient()

  // Get church info
  const { data: church } = await supabase
    .from('churches')
    .select('name')
    .eq('id', churchId)
    .single()

  const churchName = church?.name || 'Igreja'

  // Try WhatsApp first
  if (parentPhone) {
    try {
      const { data: whatsapp } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status')
        .eq('church_id', churchId)
        .eq('status', 'CONNECTED')
        .single()

      if (whatsapp) {
        const { EvolutionService } = await import('@/lib/evolution')
        
        const message = `🎉 *Parabéns!*\n\nOlá${parentName ? `, ${parentName}` : ''}!\n\n${childName} completou a etapa *"${stageName}"* no Trilho de Formação Kids!\n\nEstamos muito felizes com o progresso espiritual do(a) seu(sua) filho(a). Continue acompanhando e incentivando essa jornada de fé! 🙏\n\n_${churchName} - Rede Kids_`

        await EvolutionService.sendText(whatsapp.instance_name, parentPhone, message)
        return // Success via WhatsApp
      }
    } catch (err) {
      console.error('Failed to send WhatsApp notification:', err)
    }
  }

  // Fallback to email
  if (parentEmail) {
    try {
      const { Resend } = await import('resend')
      const apiKey = process.env.RESEND_API_KEY
      
      if (apiKey) {
        const resend = new Resend(apiKey)
        
        await resend.emails.send({
          from: 'Ekkle <contato@ekkle.com.br>',
          to: parentEmail,
          subject: `🎉 ${childName} completou uma etapa no Trilho de Formação!`,
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 20px;">
              <h2 style="color: #4f46e5;">Parabéns! 🎉</h2>
              <p>Olá${parentName ? `, ${parentName}` : ''}!</p>
              <p><strong>${childName}</strong> completou a etapa <strong>"${stageName}"</strong> no Trilho de Formação Kids!</p>
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <p style="margin: 0; color: #166534;">Estamos muito felizes com o progresso espiritual do(a) seu(sua) filho(a). Continue acompanhando e incentivando essa jornada de fé! 🙏</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">${churchName} - Rede Kids • Ekkle</p>
            </div>
          `
        })
      }
    } catch (err) {
      console.error('Failed to send email notification:', err)
    }
  }
}

// =====================================================
// BULK ACTIONS
// =====================================================

const bulkMarkProgressSchema = z.object({
  childIds: z.array(z.string().uuid('ID da criança inválido')).min(1, 'Selecione pelo menos uma criança'),
  stageId: z.string().uuid('ID da etapa inválido'),
  notes: z.string().optional().nullable(),
})

/**
 * Mark a stage as completed for multiple children at once
 */
export async function bulkMarkStageAsCompleted(data: z.infer<typeof bulkMarkProgressSchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
      'DISCIPULADORA_KIDS',
      'LEADER_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão', results: [] }
    }

    const validated = bulkMarkProgressSchema.parse(data)
    const supabase = await createClient()

    // Verify stage exists
    const { data: stage } = await supabase
      .from('kids_formation_stages')
      .select('id, name')
      .eq('id', validated.stageId)
      .eq('church_id', profile.church_id)
      .single()

    if (!stage) {
      return { success: false, error: 'Etapa não encontrada', results: [] }
    }

    // Get all children info
    const { data: children } = await supabase
      .from('kids_children')
      .select('id, full_name, parent_phone, parent_email, parent_name')
      .in('id', validated.childIds)
      .eq('church_id', profile.church_id)

    if (!children || children.length === 0) {
      return { success: false, error: 'Nenhuma criança encontrada', results: [] }
    }

    // Get already completed
    const { data: existingProgress } = await supabase
      .from('kids_child_formation_progress')
      .select('child_id')
      .in('child_id', validated.childIds)
      .eq('stage_id', validated.stageId)

    const alreadyCompletedIds = new Set(existingProgress?.map(p => p.child_id) || [])

    // Filter children that haven't completed yet
    const childrenToMark = children.filter(c => !alreadyCompletedIds.has(c.id))

    if (childrenToMark.length === 0) {
      return { 
        success: false, 
        error: 'Todas as crianças selecionadas já completaram esta etapa',
        results: [] 
      }
    }

    // Insert progress for all children
    const progressRecords = childrenToMark.map(child => ({
      church_id: profile.church_id,
      child_id: child.id,
      stage_id: validated.stageId,
      notes: validated.notes || null,
      completed_by: profile.id,
    }))

    const { data: insertedProgress, error } = await supabase
      .from('kids_child_formation_progress')
      .insert(progressRecords)
      .select()

    if (error) {
      console.error('Error bulk marking stages:', error)
      return { success: false, error: 'Erro ao marcar etapas', results: [] }
    }

    // Send notifications (async, don't wait)
    for (const child of childrenToMark) {
      sendFormationCompletionNotification({
        childName: child.full_name,
        stageName: stage.name,
        parentPhone: child.parent_phone,
        parentEmail: child.parent_email,
        parentName: child.parent_name,
        churchId: profile.church_id,
      }).catch(err => console.error('Error sending formation notification:', err))
    }

    revalidatePath('/rede-kids')

    const results = childrenToMark.map(c => ({
      childId: c.id,
      childName: c.full_name,
      success: true,
    }))

    const skippedResults = children
      .filter(c => alreadyCompletedIds.has(c.id))
      .map(c => ({
        childId: c.id,
        childName: c.full_name,
        success: false,
        reason: 'Já completou esta etapa',
      }))

    return { 
      success: true, 
      markedCount: childrenToMark.length,
      skippedCount: alreadyCompletedIds.size,
      results: [...results, ...skippedResults],
    }
  } catch (error) {
    console.error('Error in bulkMarkStageAsCompleted:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos', results: [] }
    }
    return { success: false, error: 'Erro ao marcar etapas', results: [] }
  }
}

// =====================================================
// REPORTS
// =====================================================

/**
 * Get formation report data for PDF export
 */
export async function getFormationReportData() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  // Get all stages
  const stages = await getActiveFormationStages()

  // Get all children with their progress
  const { data: children } = await supabase
    .from('kids_children')
    .select(`
      id,
      full_name,
      birth_date,
      gender,
      parent_name,
      kids_cell:kids_cells(name)
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('full_name')

  if (!children) return null

  // Get all progress records
  const { data: allProgress } = await supabase
    .from('kids_child_formation_progress')
    .select(`
      child_id,
      stage_id,
      completed_at,
      notes,
      completed_by_profile:profiles!kids_child_formation_progress_completed_by_fkey(full_name)
    `)
    .eq('church_id', profile.church_id)

  // Build report data
  const childrenWithProgress = children.map(child => {
    const childProgress = allProgress?.filter(p => p.child_id === child.id) || []
    const completedStageIds = childProgress.map(p => p.stage_id)
    const completedCount = completedStageIds.length
    const progressPercentage = stages.length > 0 
      ? Math.round((completedCount / stages.length) * 100) 
      : 0

    // Find current stage (last completed)
    const lastCompletedStageId = childProgress.length > 0
      ? childProgress.sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0]?.stage_id
      : null
    const currentStage = stages.find(s => s.id === lastCompletedStageId)

    // Find next stage
    const currentIndex = currentStage ? stages.findIndex(s => s.id === currentStage.id) : -1
    const nextStage = currentIndex >= 0 && currentIndex < stages.length - 1
      ? stages[currentIndex + 1]
      : currentIndex === -1 && stages.length > 0
      ? stages[0]
      : null

    return {
      id: child.id,
      fullName: child.full_name,
      birthDate: child.birth_date,
      gender: child.gender,
      parentName: child.parent_name,
      cellName: (child.kids_cell as { name: string } | null)?.name || 'Sem célula',
      completedCount,
      totalStages: stages.length,
      progressPercentage,
      currentStage: currentStage?.name || 'Não iniciado',
      nextStage: nextStage?.name || 'Concluído',
      stageDetails: stages.map(stage => {
        const progress = childProgress.find(p => p.stage_id === stage.id)
        return {
          stageName: stage.name,
          completed: !!progress,
          completedAt: progress?.completed_at || null,
          completedBy: progress?.completed_by_profile?.full_name || null,
          notes: progress?.notes || null,
        }
      }),
    }
  })

  // Get church info
  const { data: church } = await supabase
    .from('churches')
    .select('name')
    .eq('id', profile.church_id)
    .single()

  return {
    churchName: church?.name || 'Igreja',
    generatedAt: new Date().toISOString(),
    generatedBy: profile.full_name,
    stages: stages.map(s => ({ name: s.name, color: s.color })),
    children: childrenWithProgress,
    summary: {
      totalChildren: children.length,
      childrenWithProgress: childrenWithProgress.filter(c => c.completedCount > 0).length,
      childrenCompleted: childrenWithProgress.filter(c => c.progressPercentage === 100).length,
      averageProgress: childrenWithProgress.length > 0
        ? Math.round(childrenWithProgress.reduce((sum, c) => sum + c.progressPercentage, 0) / childrenWithProgress.length)
        : 0,
    },
  }
}
