import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        // Parse form data
        const formData = await request.formData()
        const file = formData.get('avatar') as File | null
        const fullName = formData.get('fullName') as string
        const currentPhotoUrl = formData.get('currentPhotoUrl') as string

        if (!file || file.size === 0) {
            return NextResponse.json(
                { error: 'Nenhum arquivo enviado' },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'O arquivo deve ser uma imagem' },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'A imagem deve ter no máximo 5MB' },
                { status: 400 }
            )
        }

        // Upload new avatar
        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json(
                { error: 'Falha ao fazer upload da imagem' },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // Update profile with new photo URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                photo_url: publicUrl
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Update profile error:', updateError)
            return NextResponse.json(
                { error: 'Falha ao atualizar perfil' },
                { status: 500 }
            )
        }

        // Delete old avatar if it exists and is from our storage
        if (currentPhotoUrl && currentPhotoUrl.includes('avatars')) {
            try {
                // Extract file path from URL
                const urlParts = currentPhotoUrl.split('/avatars/')
                if (urlParts.length > 1) {
                    const oldFilePath = urlParts[1]
                    await supabase.storage
                        .from('avatars')
                        .remove([oldFilePath])
                }
            } catch (deleteError) {
                // Log but don't fail the request
                console.error('Error deleting old avatar:', deleteError)
            }
        }

        // Revalidate paths
        revalidatePath('/membro')
        revalidatePath('/dashboard')
        revalidatePath('/', 'layout')

        return NextResponse.json({
            success: true,
            photoUrl: publicUrl
        })

    } catch (error) {
        console.error('Upload photo error:', error)
        return NextResponse.json(
            { error: 'Erro interno ao processar upload' },
            { status: 500 }
        )
    }
}
