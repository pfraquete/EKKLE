/**
 * Webhook Retry System
 *
 * Handles failed webhook processing with automatic retry queue.
 * Uses database to store failed events for later reprocessing.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Dead letter queue for permanently failed events
 * - Configurable retry limits per webhook type
 *
 * @example
 * ```ts
 * const retry = new WebhookRetryService(supabase, 'stripe');
 * await retry.processWithRetry(event, async () => {
 *   await handleStripeEvent(event);
 * });
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface WebhookRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_CONFIG: Record<string, WebhookRetryConfig> = {
  stripe: { maxRetries: 5, initialDelayMs: 5000, maxDelayMs: 3600000 }, // 5 retries, up to 1h delay
  mux: { maxRetries: 3, initialDelayMs: 2000, maxDelayMs: 60000 }, // 3 retries, up to 1min delay
  twilio: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 30000 }, // 3 retries, up to 30s delay
};

export interface FailedWebhookEvent {
  id?: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  retry_count: number;
  last_error: string | null;
  next_retry_at: string | null;
  status: 'pending' | 'processing' | 'failed' | 'dead_letter';
  created_at?: string;
  updated_at?: string;
}

/**
 * Process webhook with automatic retry on failure
 *
 * @param supabase - Supabase client
 * @param provider - Webhook provider (stripe, mux, twilio)
 * @param eventId - Unique event ID
 * @param eventType - Event type (e.g., 'invoice.paid')
 * @param payload - Event payload (sanitized)
 * @param handler - Async function to process the webhook
 */
export async function processWebhookWithRetry(
  supabase: SupabaseClient,
  provider: string,
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>,
  handler: () => Promise<void>
): Promise<{ success: boolean; error?: string }> {
  const config = DEFAULT_CONFIG[provider] || DEFAULT_CONFIG.stripe;

  try {
    await handler();
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Webhook Retry] ${provider} webhook failed:`, errorMessage);

    // Store failed event for retry
    await storeFailedWebhook(supabase, {
      provider,
      event_id: eventId,
      event_type: eventType,
      payload,
      retry_count: 0,
      last_error: errorMessage,
      next_retry_at: calculateNextRetry(0, config),
      status: 'pending',
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Store a failed webhook event for later retry
 */
async function storeFailedWebhook(
  supabase: SupabaseClient,
  event: Omit<FailedWebhookEvent, 'id' | 'created_at' | 'updated_at'>
): Promise<void> {
  const { error } = await supabase.from('failed_webhook_events').upsert(
    {
      ...event,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'provider,event_id',
    }
  );

  if (error) {
    console.error('[Webhook Retry] Failed to store webhook for retry:', error);
  }
}

/**
 * Calculate next retry time with exponential backoff
 */
function calculateNextRetry(retryCount: number, config: WebhookRetryConfig): string {
  const delayMs = Math.min(
    config.initialDelayMs * Math.pow(2, retryCount),
    config.maxDelayMs
  );
  return new Date(Date.now() + delayMs).toISOString();
}

/**
 * Process pending retry events (call this from a cron job or scheduled task)
 *
 * @param supabase - Supabase client
 * @param handlers - Map of provider to handler function
 * @param limit - Maximum events to process in one batch
 */
export async function processPendingRetries(
  supabase: SupabaseClient,
  handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>>,
  limit: number = 10
): Promise<{ processed: number; succeeded: number; failed: number }> {
  // Get pending events that are due for retry
  const { data: events, error } = await supabase
    .from('failed_webhook_events')
    .select('*')
    .eq('status', 'pending')
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(limit);

  if (error || !events) {
    console.error('[Webhook Retry] Failed to fetch pending events:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const event of events) {
    const handler = handlers[event.provider];
    if (!handler) {
      console.warn(`[Webhook Retry] No handler for provider: ${event.provider}`);
      continue;
    }

    const config = DEFAULT_CONFIG[event.provider] || DEFAULT_CONFIG.stripe;

    // Mark as processing
    await supabase
      .from('failed_webhook_events')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', event.id);

    try {
      await handler(event.payload);

      // Success - delete from retry queue
      await supabase.from('failed_webhook_events').delete().eq('id', event.id);
      succeeded++;
      console.log(`[Webhook Retry] Successfully reprocessed ${event.provider}:${event.event_id}`);
    } catch (retryError) {
      const errorMessage = retryError instanceof Error ? retryError.message : String(retryError);
      const newRetryCount = event.retry_count + 1;

      if (newRetryCount >= config.maxRetries) {
        // Move to dead letter queue
        await supabase
          .from('failed_webhook_events')
          .update({
            status: 'dead_letter',
            last_error: errorMessage,
            retry_count: newRetryCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id);

        console.error(
          `[Webhook Retry] Event moved to dead letter queue: ${event.provider}:${event.event_id}`
        );
      } else {
        // Schedule next retry
        await supabase
          .from('failed_webhook_events')
          .update({
            status: 'pending',
            last_error: errorMessage,
            retry_count: newRetryCount,
            next_retry_at: calculateNextRetry(newRetryCount, config),
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id);
      }
      failed++;
    }
  }

  return { processed: events.length, succeeded, failed };
}

/**
 * Get dead letter events for manual review
 */
export async function getDeadLetterEvents(
  supabase: SupabaseClient,
  provider?: string,
  limit: number = 50
): Promise<FailedWebhookEvent[]> {
  let query = supabase
    .from('failed_webhook_events')
    .select('*')
    .eq('status', 'dead_letter')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Webhook Retry] Failed to fetch dead letter events:', error);
    return [];
  }

  return data || [];
}

/**
 * Manually retry a dead letter event
 */
export async function retryDeadLetterEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  const config = DEFAULT_CONFIG.stripe; // Use default config

  await supabase
    .from('failed_webhook_events')
    .update({
      status: 'pending',
      retry_count: 0,
      next_retry_at: calculateNextRetry(0, config),
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId);
}
