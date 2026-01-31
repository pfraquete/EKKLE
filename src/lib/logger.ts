/**
 * Structured Logging for Ekkle
 *
 * Provides JSON-formatted logging that works well with Railway and other
 * cloud logging services. Logs are structured for easy parsing and searching.
 *
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger'
 *
 * logger.info('User registered', { userId, churchId })
 * logger.error('Payment failed', error, { orderId })
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  env: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Determine if we should log at a given level
 */
function shouldLog(level: LogLevel): boolean {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const currentIndex = levels.indexOf(logLevel as LogLevel);
  const levelIndex = levels.indexOf(level);
  return levelIndex >= currentIndex;
}

/**
 * Sensitive keys that should be fully masked
 */
const SENSITIVE_KEYS = [
  'password', 'senha', 'token', 'secret', 'key', 'apiKey',
  'api_key', 'authorization', 'auth', 'credit_card', 'cpf',
  'cnpj', 'document', 'ssn', 'social_security', 'bearer',
  'cookie', 'cvv', 'card_number', 'cardNumber',
];

/**
 * Keys that should show only last 4 characters
 */
const PARTIAL_MASK_KEYS = [
  'email', 'phone', 'telefone', 'whatsapp', 'celular',
  'subscription_id', 'subscriptionId', 'customer_id', 'customerId',
  'stripe_customer_id', 'stripeCustomerId', 'stripe_subscription_id',
  'stripeSubscriptionId', 'invoice_id', 'invoiceId',
];

/**
 * Patterns to detect and mask in string values
 */
const SENSITIVE_PATTERNS: Array<{
  pattern: RegExp;
  mask: (match: string) => string;
}> = [
  // Email addresses
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (email) => {
      const parts = email.split('@');
      if (parts.length !== 2) return '***@***.***';
      return `${parts[0][0]}***@***`;
    },
  },
  // Brazilian phone numbers
  {
    pattern: /\+?55?\s*\(?\d{2}\)?\s*9?\d{4}[-.\s]?\d{4}/g,
    mask: (phone) => {
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 4 ? `***${digits.slice(-4)}` : '***';
    },
  },
  // Generic phone patterns
  {
    pattern: /\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g,
    mask: (phone) => {
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 4 ? `***${digits.slice(-4)}` : '***';
    },
  },
  // Credit card numbers
  {
    pattern: /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,
    mask: (cc) => `****-****-****-${cc.replace(/\D/g, '').slice(-4)}`,
  },
  // CPF (Brazilian ID)
  {
    pattern: /\b\d{3}[.-]?\d{3}[.-]?\d{3}[.-]?\d{2}\b/g,
    mask: () => '***.***.***-**',
  },
  // API keys/tokens (common prefixes)
  {
    pattern: /\b(sk_|pk_|key_|token_|Bearer\s+)[a-zA-Z0-9_-]{10,}\b/gi,
    mask: (key) => `${key.slice(0, 7)}***`,
  },
];

/**
 * Mask sensitive patterns in a string
 */
function maskString(value: string): string {
  let result = value;
  for (const { pattern, mask } of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, mask);
  }
  return result;
}

/**
 * Mask sensitive data in context
 */
function maskSensitiveData(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  const masked: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    const isFullySensitive = SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk));
    const isPartialMask = PARTIAL_MASK_KEYS.some((pk) => lowerKey.includes(pk));

    if (isFullySensitive && typeof value === 'string') {
      masked[key] = '[REDACTED]';
    } else if (isPartialMask && typeof value === 'string') {
      masked[key] = value.length > 4 ? `***${value.slice(-4)}` : '***';
    } else if (typeof value === 'string') {
      masked[key] = maskString(value);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value as LogContext);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Create a log entry and output it
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'ekkle',
    env: process.env.NODE_ENV || 'development',
    context: maskSensitiveData(context),
  };

  // Output as JSON for Railway/cloud logging
  const output = JSON.stringify(entry);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
  }
}

/**
 * Log with error object
 */
function logError(
  message: string,
  error?: Error | unknown,
  context?: LogContext
): void {
  const errorInfo = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    : error
      ? { name: 'UnknownError', message: String(error) }
      : undefined;

  const entry: LogEntry = {
    level: 'error',
    message,
    timestamp: new Date().toISOString(),
    service: 'ekkle',
    env: process.env.NODE_ENV || 'development',
    context: maskSensitiveData(context),
    error: errorInfo,
  };

  console.error(JSON.stringify(entry));
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * Debug level - detailed information for debugging
   */
  debug: (message: string, context?: LogContext): void => {
    log('debug', message, context);
  },

  /**
   * Info level - general operational information
   */
  info: (message: string, context?: LogContext): void => {
    log('info', message, context);
  },

  /**
   * Warn level - potential issues that should be monitored
   */
  warn: (message: string, context?: LogContext): void => {
    log('warn', message, context);
  },

  /**
   * Error level - errors that need attention
   */
  error: (message: string, error?: Error | unknown, context?: LogContext): void => {
    logError(message, error, context);
  },

  /**
   * Create a child logger with preset context
   */
  child: (defaultContext: LogContext) => ({
    debug: (message: string, context?: LogContext) =>
      log('debug', message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log('info', message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      log('warn', message, { ...defaultContext, ...context }),
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      logError(message, error, { ...defaultContext, ...context }),
  }),

  /**
   * Log an HTTP request (useful for API routes)
   */
  request: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void => {
    log('info', `${method} ${path} ${statusCode}`, {
      ...context,
      http: {
        method,
        path,
        statusCode,
        durationMs: duration,
      },
    });
  },

  /**
   * Log a webhook event
   */
  webhook: (
    source: string,
    eventType: string,
    success: boolean,
    context?: LogContext
  ): void => {
    log(success ? 'info' : 'warn', `Webhook ${source}: ${eventType}`, {
      ...context,
      webhook: {
        source,
        eventType,
        success,
      },
    });
  },

  /**
   * Log an audit event (for compliance)
   */
  audit: (
    action: string,
    entityType: string,
    entityId?: string,
    context?: LogContext
  ): void => {
    log('info', `Audit: ${action} on ${entityType}`, {
      ...context,
      audit: {
        action,
        entityType,
        entityId,
      },
    });
  },
};

export default logger;
