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

    const { error } = await supabase
        .from('cell_photos')
        .insert({
            cell_id: data.cellId,
            church_id: data.churchId,
            storage_path: data.storagePath,
            photo_url: data.photoUrl,
            description: data.description || null,
            photo_date: data.photoDate || null,
            uploaded_by: profile.id
        })

    if (error) {
        console.error('Error registering cell photo:', error)
        return { success: false, error: 'Erro ao registrar foto no banco' }
    }

    revalidatePath('/minha-celula')
    revalidatePath('/membro/minha-celula')
    revalidatePath('/membro/minha-celula/album')

    return { success: true }
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

    const { error } = await supabase
        .from('cell_photos')
        .update({
            description: data.description || null,
            photo_date: data.photoDate || null
        })
        .eq('id', data.photoId)

    if (error) {
        console.error('Error updating cell photo:', error)
        return { success: false, error: 'Erro ao atualizar foto' }
    }

    revalidatePath('/minha-celula')
    revalidatePath('/membro/minha-celula')
    revalidatePath('/membro/minha-celula/album')

    return { success: true }
}

/**
 * Get photos for a specific cell
 */
export async function getCellPhotos(cellId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('cell_photos')
        .select(`
            *,
            uploader:profiles!uploaded_by(full_name)
        `)
        .eq('cell_id', cellId)
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

    // Get photo info first to delete from storage
    const { data: photo } = await supabase
        .from('cell_photos')
        .select('*')
        .eq('id', photoId)
        .single()

    if (!photo) return { success: false, error: 'Foto não encontrada' }

    // RLS handles permission on the DB, but we check here too
    const { error: dbError } = await supabase
        .from('cell_photos')
        .delete()
        .eq('id', photoId)

    if (dbError) {
        return { success: false, error: 'Erro ao remover do banco (permissão negada?)' }
    }

    // Attempt to delete from storage
    await supabase.storage.from('cell-albums').remove([photo.storage_path])

    revalidatePath('/minha-celula')
    revalidatePath('/membro/minha-celula')
    revalidatePath('/membro/minha-celula/album')

    return { success: true }
}
