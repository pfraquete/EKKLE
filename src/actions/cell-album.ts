'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * Handle photo upload metadata registration
 */
export async function registerCellPhoto(data: {
    cellId: string
    churchId: string
    storagePath: string
    photoUrl: string
    description?: string
    photoDate?: string // ISO date string (YYYY-MM-DD)
}) {
    const profile = await getProfile()
    if (!profile) return { success: false, error: 'Não autenticado' }

    const supabase = await createClient()

    // Additional check for leader status (RLS will also handle this)
    const { data: cell } = await supabase
        .from('cells')
        .select('id')
        .eq('id', data.cellId)
        .eq('leader_id', profile.id)
        .single()

    if (!cell && profile.role !== 'PASTOR') {
        return { success: false, error: 'Apenas líderes podem postar fotos no álbum' }
    }

    // Ensure empty strings are converted to null
    const description = data.description?.trim() || null
    const photoDate = data.photoDate || null

    console.log('[registerCellPhoto] Saving with:', { description, photoDate })

    const { data: insertedData, error } = await supabase
        .from('cell_photos')
        .insert({
            cell_id: data.cellId,
            church_id: data.churchId,
            storage_path: data.storagePath,
            photo_url: data.photoUrl,
            description,
            photo_date: photoDate,
            uploaded_by: profile.id
        })
        .select()

    if (error) {
        console.error('Error registering cell photo:', error)
        return { success: false, error: 'Erro ao registrar foto no banco' }
    }

    console.log('[registerCellPhoto] Inserted successfully:', insertedData?.[0])

    revalidatePath('/minha-celula')
    revalidatePath('/membro/minha-celula')
    revalidatePath('/membro/minha-celula/album')

    return { success: true, photoId: insertedData?.[0]?.id }
}

/**
 * Update photo description and date
 */
export async function updateCellPhoto(data: {
    photoId: string
    description?: string
    photoDate?: string | null
}) {
    const profile = await getProfile()
    if (!profile) return { success: false, error: 'Não autenticado' }

    const supabase = await createClient()

    // Get the photo to verify ownership/permissions
    const { data: photo } = await supabase
        .from('cell_photos')
        .select('*, cell:cells!cell_id(leader_id)')
        .eq('id', data.photoId)
        .single()

    if (!photo) {
        return { success: false, error: 'Foto não encontrada' }
    }

    // Check if user is the cell leader or pastor
    const isLeader = photo.cell?.leader_id === profile.id
    const isPastor = profile.role === 'PASTOR'

    if (!isLeader && !isPastor) {
        return { success: false, error: 'Apenas líderes podem editar fotos do álbum' }
    }

    // Ensure empty strings are converted to null
    const description = data.description?.trim() || null
    const photoDate = data.photoDate || null

    console.log('[updateCellPhoto] Updating with:', { photoId: data.photoId, description, photoDate })

    const { data: updatedData, error } = await supabase
        .from('cell_photos')
        .update({
            description,
            photo_date: photoDate
        })
        .eq('id', data.photoId)
        .select()

    if (error) {
        console.error('Error updating cell photo:', error)
        return { success: false, error: 'Erro ao atualizar foto' }
    }

    // Check if any row was actually updated (RLS might silently block)
    if (!updatedData || updatedData.length === 0) {
        console.error('No rows updated - RLS may have blocked the operation')
        return { success: false, error: 'Permissão negada para atualizar esta foto' }
    }

    console.log('[updateCellPhoto] Updated successfully:', updatedData[0])

    revalidatePath('/minha-celula')
    revalidatePath('/membro/minha-celula')
    revalidatePath('/membro/minha-celula/album')

    return { success: true }
}

/**
 * Get photos for a specific cell
 */
export async function getCellPhotos(cellId: string) {
    const profile = await getProfile()
    if (!profile) return { data: null, error: 'Não autenticado' }

    const supabase = await createClient()

    // Verify the cell belongs to user's church
    const { data: cell } = await supabase
        .from('cells')
        .select('id, church_id')
        .eq('id', cellId)
        .eq('church_id', profile.church_id)
        .single()

    if (!cell) {
        return { data: null, error: 'Célula não encontrada' }
    }

    const { data, error } = await supabase
        .from('cell_photos')
        .select(`
            *,
            uploader:profiles!uploaded_by(full_name),
            face_processed,
            face_count
        `)
        .eq('cell_id', cellId)
        .eq('church_id', profile.church_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching cell photos:', error)
        return { data: null, error: 'Falha ao buscar fotos' }
    }

    return { data, error: null }
}

/**
 * Delete a photo
 */
export async function deleteCellPhoto(photoId: string) {
    const profile = await getProfile()
    if (!profile) return { success: false, error: 'Não autenticado' }

    const supabase = await createClient()

    // Get photo info first - ensure it belongs to user's church
    const { data: photo } = await supabase
        .from('cell_photos')
        .select('*, cell:cells!cell_id(leader_id)')
        .eq('id', photoId)
        .eq('church_id', profile.church_id)
        .single()

    if (!photo) return { success: false, error: 'Foto não encontrada' }

    // Check if user is the cell leader or pastor
    const isLeader = photo.cell?.leader_id === profile.id
    const isPastor = profile.role === 'PASTOR'

    if (!isLeader && !isPastor) {
        return { success: false, error: 'Apenas líderes podem excluir fotos do álbum' }
    }

    // Delete from database
    const { error: dbError } = await supabase
        .from('cell_photos')
        .delete()
        .eq('id', photoId)
        .eq('church_id', profile.church_id)

    if (dbError) {
        return { success: false, error: 'Erro ao remover do banco' }
    }

    // Attempt to delete from storage
    await supabase.storage.from('cell-albums').remove([photo.storage_path])

    revalidatePath('/minha-celula')
    revalidatePath('/membro/minha-celula')
    revalidatePath('/membro/minha-celula/album')

    return { success: true }
}
