/**
 * Simple In-Memory Rate Limiter
 *
 * Implements sliding window rate limiting to prevent abuse.
 * For production with multiple servers, consider using Redis (Upstash).
 *
 * Usage:
 * ```ts
 * const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
 * const allowed = await limiter.checkLimit('pastor-id-123');
 * ```
 */

interface RateLimiterConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

interface RequestLog {
  timestamps: number[];
}

export class RateLimiter {
  private config: RateLimiterConfig;
  private store: Map<string, RequestLog>;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.store = new Map();

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is within rate limit
   *
   * @param key - Unique identifier (e.g., pastor ID, phone number)
   * @returns true if allowed, false if rate limited
   */
  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request log
    let log = this.store.get(key);
    if (!log) {
      log = { timestamps: [] };
      this.store.set(key, log);
    }

    // Remove timestamps outside the window
    log.timestamps = log.timestamps.filter((ts) => ts > windowStart);

    // Check if within limit
    if (log.timestamps.length >= this.config.maxRequests) {
      console.log(`[Rate Limiter] Rate limit exceeded for key: ${key}`);
      return false;
    }

    // Add current timestamp
    log.timestamps.push(now);
    return true;
  }

  /**
   * Get current usage for a key
   *
   * @param key - Unique identifier
   * @returns Number of requests in current window
   */
  getUsage(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const log = this.store.get(key);

    if (!log) return 0;

    // Count valid timestamps
    return log.timestamps.filter((ts) => ts > windowStart).length;
  }

  /**
   * Get remaining requests for a key
   *
   * @param key - Unique identifier
   * @returns Number of remaining requests
   */
  getRemaining(key: string): number {
    return Math.max(0, this.config.maxRequests - this.getUsage(key));
  }

  /**
   * Reset rate limit for a key (admin use)
   *
   * @param key - Unique identifier
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, log] of this.store.entries()) {
      // Remove old timestamps
      log.timestamps = log.timestamps.filter((ts) => ts > windowStart);

      // Delete empty logs
      if (log.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Global rate limiters for different use cases
 */

// WhatsApp messages: 10 messages per minute per pastor
export const whatsappRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

// API calls: 30 requests per minute per user
export const apiRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
});
