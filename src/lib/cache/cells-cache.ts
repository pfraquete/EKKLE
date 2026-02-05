import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CachedCell {
  id: string
  name: string
  leader_id: string | null
  leader_name: string | null
  status: string
  neighborhood: string | null
  meeting_day: string | null
  meeting_time: string | null
}

/**
 * Cached cells list - reduces database queries
 * Cache is revalidated every 5 minutes or when 'cells' tag is invalidated
 */
export const getCachedCellsByChurch = unstable_cache(
  async (churchId: string): Promise<CachedCell[]> => {
    const supabase = await createClient()
    
    const { data: cells, error } = await supabase
      .from('cells')
      .select(`
        id,
        name,
        leader_id,
        status,
        neighborhood,
        meeting_day,
        meeting_time,
        leader:leader_id (full_name)
      `)
      .eq('church_id', churchId)
      .eq('status', 'ACTIVE')
      .order('name')

    if (error) {
      console.error('[cells-cache] Error fetching cells:', error)
      return []
    }

    return (cells || []).map(cell => {
      // Supabase returns relations as arrays, get first item
      const leaderData = cell.leader as unknown as { full_name: string }[] | null
      const leaderName = Array.isArray(leaderData) && leaderData.length > 0 
        ? leaderData[0].full_name 
        : null
      
      return {
        id: cell.id,
        name: cell.name,
        leader_id: cell.leader_id,
        leader_name: leaderName,
        status: cell.status,
        neighborhood: cell.neighborhood,
        meeting_day: cell.meeting_day,
        meeting_time: cell.meeting_time,
      }
    })
  },
  ['cells-by-church'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['cells'],
  }
)
