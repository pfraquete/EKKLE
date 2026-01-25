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
 * Mask sensitive data in context
 */
function maskSensitiveData(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  const sensitiveKeys = [
    'password', 'senha', 'token', 'secret', 'key', 'apiKey',
    'api_key', 'authorization', 'auth', 'credit_card', 'cpf',
    'cnpj', 'document', 'ssn', 'social_security',
  ];

  const masked: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sk) => lowerKey.includes(sk));

    if (isSensitive && typeof value === 'string') {
      masked[key] = value.length > 4
        ? `${value.slice(0, 2)}***${value.slice(-2)}`
        : '***';
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
