import { unstable_cache } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'

export interface SubscriptionStatus {
  isActive: boolean
  plan: string | null
  expiresAt: string | null
  daysRemaining: number | null
}

/**
 * Cached subscription status - reduces database queries
 * Cache is revalidated every hour or when 'subscription' tag is invalidated
 * Uses createStaticClient to avoid cookies() conflict with unstable_cache
 */
export const getCachedSubscriptionStatus = unstable_cache(
  async (churchId: string): Promise<SubscriptionStatus> => {
    // Use static client (no cookies) to avoid conflict with unstable_cache
    const supabase = createStaticClient()
    
    const { data: subStatus, error } = await supabase
      .rpc('check_church_subscription_status', { p_church_id: churchId })
      .single()

    if (error) {
      console.error('[subscription-cache] Error checking subscription:', error)
      return {
        isActive: false,
        plan: null,
        expiresAt: null,
        daysRemaining: null,
      }
    }

    const status = subStatus as { 
      is_active: boolean
      plan_name?: string
      current_period_end?: string
      days_remaining?: number
    } | null

    return {
      isActive: status?.is_active ?? false,
      plan: status?.plan_name || null,
      expiresAt: status?.current_period_end || null,
      daysRemaining: status?.days_remaining || null,
    }
  },
  ['subscription-status'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['subscription'],
  }
)

/**
 * Get subscription with shorter cache for billing pages
 * Uses createStaticClient to avoid cookies() conflict with unstable_cache
 */
export const getSubscriptionForBilling = unstable_cache(
  async (churchId: string) => {
    // Use static client (no cookies) to avoid conflict with unstable_cache
    const supabase = createStaticClient()
    
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('[subscription-cache] Error fetching subscription:', error)
      return null
    }

    return subscription
  },
  ['subscription-for-billing'],
  {
    revalidate: 60, // Cache for 1 minute (billing needs fresher data)
    tags: ['subscription'],
  }
)
