/**
 * Simple in-memory rate limiter for server actions
 * In production, consider using Redis with Upstash for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store rate limit data in memory (will reset on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window
   * @default 10
   */
  max?: number
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  window?: number
  /**
   * Identifier for the rate limit (e.g., userId, IP address)
   */
  identifier: string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check if a request is allowed based on rate limiting
 * @param options Rate limiting options
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { max = 10, window = 60000, identifier } = options
  const now = Date.now()

  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    // First request or window expired, create new entry
    const resetAt = now + window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt
    })

    return {
      success: true,
      limit: max,
      remaining: max - 1,
      resetAt
    }
  }

  // Increment counter
  entry.count++

  if (entry.count > max) {
    // Rate limit exceeded
    return {
      success: false,
      limit: max,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  return {
    success: true,
    limit: max,
    remaining: max - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Utility to throw rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    public resetAt: number,
    public limit: number
  ) {
    super(`Rate limit exceeded. Try again in ${Math.ceil((resetAt - Date.now()) / 1000)}s`)
    this.name = 'RateLimitError'
  }
}

/**
 * Decorator-style wrapper for server actions with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Omit<RateLimitOptions, 'identifier'> & {
    getIdentifier: (...args: Parameters<T>) => string
  }
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = options.getIdentifier(...args)

    const result = await checkRateLimit({
      ...options,
      identifier
    })

    if (!result.success) {
      throw new RateLimitError(result.resetAt, result.limit)
    }

    return fn(...args)
  }) as T
}
