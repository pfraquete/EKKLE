'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Gera um token temporário para acessar credenciais do Zoom
 * Token é válido por 48 horas
 *
 * @param serviceId - ID do culto/serviço
 * @returns Token gerado ou erro
 */
export async function generateZoomAccessToken(serviceId: string): Promise<{
  success: boolean
  token?: string
  error?: string
}> {
  const supabase = await createClient()

  // Gerar token via função do banco de dados
  const { data, error } = await supabase.rpc('generate_zoom_access_token', {
    p_service_id: serviceId,
    p_valid_hours: 48
  })

  if (error) {
    console.error('Error generating zoom token:', error)
    return { success: false, error: 'Failed to generate access token' }
  }

  return { success: true, token: data }
}

/**
 * Valida token e retorna credenciais do Zoom
 *
 * @param serviceId - ID do culto/serviço
 * @param token - Token de acesso gerado
 * @returns Credenciais do Zoom ou erro
 */
export async function getZoomCredentials(serviceId: string, token: string): Promise<{
  success: boolean
  credentials?: {
    zoom_meeting_id: string
    zoom_password: string | null
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_zoom_credentials_with_token', {
      p_service_id: serviceId,
      p_token: token
    })
    .single()

  if (error) {
    return { success: false, error: 'Invalid or expired access link' }
  }

  return {
    success: true,
    credentials: {
      zoom_meeting_id: data.zoom_meeting_id,
      zoom_password: data.zoom_password
    }
  }
}
