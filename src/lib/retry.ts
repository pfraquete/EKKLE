/**
 * Retry Logic with Exponential Backoff
 *
 * Provides resilient HTTP requests with automatic retries and timeouts.
 *
 * Features:
 * - Exponential backoff (2s, 4s, 8s)
 * - Configurable timeouts
 * - Only retries on network errors (not 4xx errors)
 *
 * Usage:
 * ```ts
 * const response = await fetchWithRetry('https://api.example.com', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 * ```
 */

export interface RetryConfig {
  maxRetries?: number; // Default: 3
  initialDelayMs?: number; // Default: 2000 (2s)
  maxDelayMs?: number; // Default: 16000 (16s)
  timeoutMs?: number; // Default: 30000 (30s)
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Fetch with timeout
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise with fetch response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry and exponential backoff
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Promise with fetch response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelayMs = 2000,
    maxDelayMs = 16000,
    timeoutMs = 30000,
    onRetry,
  } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500 && attempt < maxRetries) {
        console.warn(
          `[Retry] Client error ${response.status}, not retrying: ${url}`
        );
        return response;
      }

      // Retry on 5xx errors (server errors)
      if (response.status >= 500 && attempt < maxRetries) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        console.error(`[Retry] Max retries (${maxRetries}) exceeded for ${url}`);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${url}. Retrying in ${delay}ms...`,
        lastError.message
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 *
 * @param error - Error to check
 * @returns true if error should be retried
 */
export function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'network',
    'timeout',
    'aborted',
  ];

  const message = error.message.toLowerCase();
  return retryableMessages.some((msg) => message.includes(msg));
}
