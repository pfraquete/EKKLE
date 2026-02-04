'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface LibraryCategory {
  id: string
  church_id: string
  name: string
  description: string | null
  icon_name: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  content_count?: number
}

export interface LibraryContent {
  id: string
  church_id: string
  category_id: string | null
  title: string
  description: string | null
  content_type: 'lesson' | 'story' | 'music' | 'activity' | 'video' | 'document' | 'image' | 'other'
  content_text: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  target_age_min: number | null
  target_age_max: number | null
  duration_minutes: number | null
  bible_reference: string | null
  tags: string[] | null
  is_active: boolean
  is_featured: boolean
  view_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  category?: LibraryCategory
  attachments?: LibraryAttachment[]
  created_by_profile?: { full_name: string }
}

export interface LibraryAttachment {
  id: string
  content_id: string
  file_url: string
  file_name: string
  file_size: number | null
  file_type: string | null
  sort_order: number
  created_at: string
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional().nullable(),
  icon_name: z.string().default('folder'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').default('#3B82F6'),
})

const createContentSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string().optional().nullable(),
  content_type: z.enum(['lesson', 'story', 'music', 'activity', 'video', 'document', 'image', 'other']),
  content_text: z.string().optional().nullable(),
  file_url: z.string().url().optional().nullable(),
  file_name: z.string().optional().nullable(),
  file_size: z.number().optional().nullable(),
  file_type: z.string().optional().nullable(),
  target_age_min: z.number().min(0).max(18).optional().nullable(),
  target_age_max: z.number().min(0).max(18).optional().nullable(),
  duration_minutes: z.number().min(1).optional().nullable(),
  bible_reference: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
})

// =====================================================
// HELPER: Check Permission
// =====================================================

async function checkKidsPermission(requiredRoles: string[] = ['PASTOR']) {
  const profile = await getProfile()
  if (!profile) {
    return { error: 'Não autenticado', profile: null }
  }

  if (profile.role === 'PASTOR') {
    return { error: null, profile }
  }

  if (requiredRoles.includes(profile.kids_role || '')) {
    return { error: null, profile }
  }

  return { error: 'Sem permissão para esta ação', profile: null }
}

// =====================================================
// CATEGORIES
// =====================================================

/**
 * Get all library categories
 */
export async function getLibraryCategories(): Promise<LibraryCategory[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_library_categories')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching library categories:', error)
    return []
  }

  // Get content count for each category
  const categoriesWithCount = await Promise.all(
    (data as LibraryCategory[]).map(async (category) => {
      const { count } = await supabase
        .from('kids_library_content')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('is_active', true)

      return { ...category, content_count: count || 0 }
    })
  )

  return categoriesWithCount
}

/**
 * Create a new category (Pastor only)
 */
export async function createLibraryCategory(data: z.infer<typeof createCategorySchema>) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const validated = createCategorySchema.parse(data)
    const supabase = await createClient()

    // Get next sort_order
    const { data: lastCategory } = await supabase
      .from('kids_library_categories')
      .select('sort_order')
      .eq('church_id', profile.church_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastCategory?.sort_order || 0) + 1

    const { data: category, error } = await supabase
      .from('kids_library_categories')
      .insert({
        church_id: profile.church_id,
        name: validated.name,
        description: validated.description || null,
        icon_name: validated.icon_name,
        color: validated.color,
        sort_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return { success: false, error: 'Erro ao criar categoria' }
    }

    revalidatePath('/rede-kids/biblioteca')
    return { success: true, data: category }
  } catch (error) {
    console.error('Error in createLibraryCategory:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar categoria' }
  }
}

/**
 * Seed default categories
 */
export async function seedDefaultLibraryCategories() {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase.rpc('seed_default_kids_library_categories', {
      target_church_id: profile.church_id,
    })

    if (error) {
      console.error('Error seeding categories:', error)
      return { success: false, error: 'Erro ao criar categorias padrão' }
    }

    revalidatePath('/rede-kids/biblioteca')
    return { success: true }
  } catch (error) {
    console.error('Error in seedDefaultLibraryCategories:', error)
    return { success: false, error: 'Erro ao criar categorias padrão' }
  }
}

/**
 * Delete a category (Pastor only)
 */
export async function deleteLibraryCategory(id: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_library_categories')
      .delete()
      .eq('id', id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: 'Erro ao excluir categoria' }
    }

    revalidatePath('/rede-kids/biblioteca')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteLibraryCategory:', error)
    return { success: false, error: 'Erro ao excluir categoria' }
  }
}

// =====================================================
// CONTENT
// =====================================================

/**
 * Get library content with filters
 */
export async function getLibraryContent(filters?: {
  category_id?: string
  content_type?: string
  search?: string
  featured_only?: boolean
}): Promise<LibraryContent[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  let query = supabase
    .from('kids_library_content')
    .select(`
      *,
      category:kids_library_categories(*),
      created_by_profile:profiles!kids_library_content_created_by_fkey(full_name)
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  if (filters?.content_type) {
    query = query.eq('content_type', filters.content_type)
  }

  if (filters?.featured_only) {
    query = query.eq('is_featured', true)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching library content:', error)
    return []
  }

  return data as unknown as LibraryContent[]
}

/**
 * Get a single content by ID
 */
export async function getLibraryContentById(id: string): Promise<LibraryContent | null> {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_library_content')
    .select(`
      *,
      category:kids_library_categories(*),
      attachments:kids_library_attachments(*),
      created_by_profile:profiles!kids_library_content_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (error) {
    console.error('Error fetching content:', error)
    return null
  }

  // Increment view count
  await supabase
    .from('kids_library_content')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', id)

  return data as unknown as LibraryContent
}

/**
 * Create new content
 */
export async function createLibraryContent(data: z.infer<typeof createContentSchema>) {
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

    const validated = createContentSchema.parse(data)
    const supabase = await createClient()

    const { data: content, error } = await supabase
      .from('kids_library_content')
      .insert({
        church_id: profile.church_id,
        category_id: validated.category_id || null,
        title: validated.title,
        description: validated.description || null,
        content_type: validated.content_type,
        content_text: validated.content_text || null,
        file_url: validated.file_url || null,
        file_name: validated.file_name || null,
        file_size: validated.file_size || null,
        file_type: validated.file_type || null,
        target_age_min: validated.target_age_min || null,
        target_age_max: validated.target_age_max || null,
        duration_minutes: validated.duration_minutes || null,
        bible_reference: validated.bible_reference || null,
        tags: validated.tags || null,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating content:', error)
      return { success: false, error: 'Erro ao criar conteúdo' }
    }

    revalidatePath('/rede-kids/biblioteca')
    return { success: true, data: content }
  } catch (error) {
    console.error('Error in createLibraryContent:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar conteúdo' }
  }
}

/**
 * Update content
 */
export async function updateLibraryContent(id: string, data: Partial<z.infer<typeof createContentSchema>>) {
  try {
    const { error: permError, profile } = await checkKidsPermission([
      'PASTOR',
      'PASTORA_KIDS',
    ])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { data: content, error } = await supabase
      .from('kids_library_content')
      .update(data)
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating content:', error)
      return { success: false, error: 'Erro ao atualizar conteúdo' }
    }

    revalidatePath('/rede-kids/biblioteca')
    revalidatePath(`/rede-kids/biblioteca/${id}`)
    return { success: true, data: content }
  } catch (error) {
    console.error('Error in updateLibraryContent:', error)
    return { success: false, error: 'Erro ao atualizar conteúdo' }
  }
}

/**
 * Delete content
 */
export async function deleteLibraryContent(id: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR', 'PASTORA_KIDS'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_library_content')
      .delete()
      .eq('id', id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error deleting content:', error)
      return { success: false, error: 'Erro ao excluir conteúdo' }
    }

    revalidatePath('/rede-kids/biblioteca')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteLibraryContent:', error)
    return { success: false, error: 'Erro ao excluir conteúdo' }
  }
}

/**
 * Toggle featured status
 */
export async function toggleContentFeatured(id: string) {
  try {
    const { error: permError, profile } = await checkKidsPermission(['PASTOR', 'PASTORA_KIDS'])
    if (permError || !profile) {
      return { success: false, error: permError || 'Sem permissão' }
    }

    const supabase = await createClient()

    // Get current status
    const { data: current } = await supabase
      .from('kids_library_content')
      .select('is_featured')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('kids_library_content')
      .update({ is_featured: !current?.is_featured })
      .eq('id', id)
      .eq('church_id', profile.church_id)

    if (error) {
      console.error('Error toggling featured:', error)
      return { success: false, error: 'Erro ao atualizar destaque' }
    }

    revalidatePath('/rede-kids/biblioteca')
    return { success: true }
  } catch (error) {
    console.error('Error in toggleContentFeatured:', error)
    return { success: false, error: 'Erro ao atualizar destaque' }
  }
}

// =====================================================
// MEETING LESSONS
// =====================================================

/**
 * Attach content to a meeting
 */
export async function attachContentToMeeting(meetingId: string, contentId: string, notes?: string) {
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

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_cell_meeting_lessons')
      .insert({
        meeting_id: meetingId,
        content_id: contentId,
        notes: notes || null,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Este conteúdo já está anexado à reunião' }
      }
      console.error('Error attaching content:', error)
      return { success: false, error: 'Erro ao anexar conteúdo' }
    }

    revalidatePath('/rede-kids')
    return { success: true }
  } catch (error) {
    console.error('Error in attachContentToMeeting:', error)
    return { success: false, error: 'Erro ao anexar conteúdo' }
  }
}

/**
 * Get lessons attached to a meeting
 */
export async function getMeetingLessons(meetingId: string): Promise<LibraryContent[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kids_cell_meeting_lessons')
    .select(`
      *,
      content:kids_library_content(
        *,
        category:kids_library_categories(*)
      )
    `)
    .eq('meeting_id', meetingId)

  if (error) {
    console.error('Error fetching meeting lessons:', error)
    return []
  }

  return data.map(d => d.content) as unknown as LibraryContent[]
}

/**
 * Remove content from meeting
 */
export async function removeContentFromMeeting(meetingId: string, contentId: string) {
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

    const supabase = await createClient()

    const { error } = await supabase
      .from('kids_cell_meeting_lessons')
      .delete()
      .eq('meeting_id', meetingId)
      .eq('content_id', contentId)

    if (error) {
      console.error('Error removing content:', error)
      return { success: false, error: 'Erro ao remover conteúdo' }
    }

    revalidatePath('/rede-kids')
    return { success: true }
  } catch (error) {
    console.error('Error in removeContentFromMeeting:', error)
    return { success: false, error: 'Erro ao remover conteúdo' }
  }
}

// =====================================================
// STATISTICS
// =====================================================

/**
 * Get library statistics
 */
export async function getLibraryStats() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { count: totalContent } = await supabase
    .from('kids_library_content')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', profile.church_id)
    .eq('is_active', true)

  const { count: totalCategories } = await supabase
    .from('kids_library_categories')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', profile.church_id)
    .eq('is_active', true)

  const { data: topContent } = await supabase
    .from('kids_library_content')
    .select('id, title, view_count')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('view_count', { ascending: false })
    .limit(5)

  const { data: recentContent } = await supabase
    .from('kids_library_content')
    .select('id, title, created_at')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    totalContent: totalContent || 0,
    totalCategories: totalCategories || 0,
    topContent: topContent || [],
    recentContent: recentContent || [],
  }
}
