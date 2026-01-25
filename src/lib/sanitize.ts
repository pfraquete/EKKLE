/**
 * XSS Sanitization Utilities
 *
 * These functions help sanitize user-provided content before rendering
 * to prevent Cross-Site Scripting (XSS) attacks.
 *
 * Usage:
 * ```ts
 * const safeSettings = sanitizeSettings(church.website_settings)
 * const safeName = sanitizeString(userInput)
 * ```
 */

/**
 * HTML entities that need escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters in a string
 * This is a simple but effective XSS prevention for text content
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string by removing or escaping potentially dangerous content
 * Returns an empty string for non-string inputs
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  // Remove style expressions (IE specific)
  sanitized = sanitized.replace(/expression\s*\(/gi, '');

  // Escape remaining HTML entities for safe display
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Validate and sanitize a URL
 * Returns null if the URL is not valid or safe
 */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);

    // Only allow safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!safeProtocols.includes(url.protocol)) {
      console.warn(`[Sanitize] Blocked unsafe URL protocol: ${url.protocol}`);
      return null;
    }

    return url.toString();
  } catch {
    // If it's not a valid URL, try treating it as a relative path
    if (trimmed.startsWith('/') && !trimmed.includes('://')) {
      // Relative paths are safe if they don't contain protocol
      return trimmed;
    }

    return null;
  }
}

/**
 * Sanitize an email address
 * Returns null if not a valid email format
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  const trimmed = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) return null;

  return trimmed;
}

/**
 * Sanitize a phone number (Brazilian format)
 * Returns cleaned number with only digits or null if invalid
 */
export function sanitizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  // Remove everything except digits
  const digits = input.replace(/\D/g, '');

  // Brazilian phone: 10-11 digits (with DDD)
  if (digits.length < 10 || digits.length > 11) return null;

  return digits;
}

/**
 * Recursively sanitize an object (like JSONB settings)
 * Sanitizes all string values, validates URLs, and removes dangerous keys
 */
export function sanitizeSettings<T extends Record<string, unknown>>(settings: unknown): T {
  if (!settings || typeof settings !== 'object') return {} as T;

  const sanitized: Record<string, unknown> = {};

  // Keys that should be treated as URLs
  const urlKeys = [
    'url', 'href', 'src', 'link',
    'image', 'logo', 'banner', 'background',
    'video', 'youtube', 'instagram', 'facebook',
    'twitter', 'linkedin', 'whatsapp',
  ];

  for (const [key, value] of Object.entries(settings)) {
    // Skip potentially dangerous keys
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (dangerousKeys.includes(key)) continue;

    const lowerKey = key.toLowerCase();

    if (typeof value === 'string') {
      // Check if this key should be treated as a URL
      const isUrlKey = urlKeys.some((uk) => lowerKey.includes(uk));

      if (isUrlKey) {
        const sanitizedUrl = sanitizeUrl(value);
        sanitized[key] = sanitizedUrl || '';
      } else {
        sanitized[key] = sanitizeString(value);
      }
    } else if (Array.isArray(value)) {
      // Sanitize array items
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') return sanitizeString(item);
        if (typeof item === 'object' && item !== null) {
          return sanitizeSettings(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeSettings(value as Record<string, unknown>);
    } else {
      // Numbers, booleans, null - pass through
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Type for website settings after sanitization
 */
export interface SanitizedWebsiteSettings {
  hero?: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };
  about?: {
    title?: string;
    content?: string;
    imageUrl?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    whatsapp?: string;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  [key: string]: unknown;
}

/**
 * Sanitize church website settings
 */
export function sanitizeWebsiteSettings(
  settings: Record<string, unknown> | null | undefined
): SanitizedWebsiteSettings {
  if (!settings) return {};
  return sanitizeSettings<SanitizedWebsiteSettings>(settings);
}

const sanitizeUtils = {
  escapeHtml,
  sanitizeString,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSettings,
  sanitizeWebsiteSettings,
};

export default sanitizeUtils;
