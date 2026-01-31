/**
 * Distributed Rate Limiter using Upstash Redis
 *
 * Implements sliding window rate limiting that works across multiple server instances.
 * Falls back to in-memory rate limiting if Redis is not configured.
 *
 * Usage:
 * ```ts
 * const result = await rateLimit.check('pastor-id-123');
 * if (!result.success) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash is configured
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client only if configured
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * In-memory fallback for development without Redis
 */
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    // Cleanup every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  async limit(key: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: now + windowMs,
      };
    }

    entry.count++;

    if (entry.count > maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: entry.resetAt,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Create a rate limiter with specified limits
 */
function createRateLimiter(maxRequests: number, windowSeconds: number) {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: true,
      prefix: 'ekkle:ratelimit',
    });
  }
  return null;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Generic rate limit function
 */
async function checkLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!redis) {
    // Use in-memory fallback
    console.warn('[Rate Limiter] Using in-memory fallback. Configure UPSTASH_REDIS for production.');
    return inMemoryLimiter.limit(key, maxRequests, windowMs);
  }

  const limiter = createRateLimiter(maxRequests, Math.floor(windowMs / 1000));
  if (!limiter) {
    return inMemoryLimiter.limit(key, maxRequests, windowMs);
  }

  const result = await limiter.limit(key);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  /**
   * WhatsApp messages: 10 messages per minute per pastor
   */
  whatsapp: async (key: string): Promise<RateLimitResult> => {
    return checkLimit(`whatsapp:${key}`, 10, 60 * 1000);
  },

  /**
   * API calls: 30 requests per minute per user
   */
  api: async (key: string): Promise<RateLimitResult> => {
    return checkLimit(`api:${key}`, 30, 60 * 1000);
  },

  /**
   * Church registration: 5 requests per hour per IP
   */
  churchRegistration: async (key: string): Promise<RateLimitResult> => {
    return checkLimit(`register:church:${key}`, 5, 60 * 60 * 1000);
  },

  /**
   * Member registration: 10 requests per hour per IP
   */
  memberRegistration: async (key: string): Promise<RateLimitResult> => {
    return checkLimit(`register:member:${key}`, 10, 60 * 60 * 1000);
  },

  /**
   * Login attempts: 5 attempts per 15 minutes per IP
   */
  login: async (key: string): Promise<RateLimitResult> => {
    return checkLimit(`login:${key}`, 5, 15 * 60 * 1000);
  },

  /**
   * Password reset: 3 requests per hour per email
   */
  passwordReset: async (key: string): Promise<RateLimitResult> => {
    return checkLimit(`password:reset:${key}`, 3, 60 * 60 * 1000);
  },

  /**
   * Photo upload: 10 uploads per hour per user
   */
  photoUpload: async (key: string): Promise<RateLimitResult> => {
    return checkLimit(`upload:photo:${key}`, 10, 60 * 60 * 1000);
  },

  /**
   * Custom rate limit
   */
  custom: async (
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> => {
    return checkLimit(key, maxRequests, windowMs);
  },
};

/**
 * Error class for rate limit exceeded
 */
export class RateLimitError extends Error {
  constructor(
    public resetAt: number,
    public limit: number
  ) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    super(`Rate limit exceeded. Try again in ${retryAfter}s`);
    this.name = 'RateLimitError';
  }
}

/**
 * Helper to get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check common headers for proxied requests
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Legacy compatibility exports
 */

// Legacy class-based rate limiter (for backwards compatibility)
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;

  constructor(config: { maxRequests: number; windowMs: number }) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  async checkLimit(key: string): Promise<boolean> {
    const result = await checkLimit(key, this.maxRequests, this.windowMs);
    return result.success;
  }

  async getUsage(key: string): Promise<number> {
    const result = await checkLimit(key, this.maxRequests, this.windowMs);
    return this.maxRequests - result.remaining;
  }

  getRemaining(key: string): number {
    // Note: This is approximate since we can't do sync calls to Redis
    return this.maxRequests;
  }

  reset(_key: string): void {
    // Redis TTL handles automatic reset
    console.log('[Rate Limiter] Reset called - Redis TTL handles automatic cleanup');
  }
}

// Legacy global rate limiters
export const whatsappRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
});

// Export default rate limit function
export default rateLimiters;
