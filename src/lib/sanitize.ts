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
 * Uses RFC 5322 compliant regex for better validation
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  const trimmed = input.trim().toLowerCase();

  // Max length check (RFC 5321)
  if (trimmed.length > 254) return null;

  // RFC 5322 compliant email regex
  const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])$/;

  if (!emailRegex.test(trimmed)) return null;

  // Additional checks
  const [localPart, domain] = trimmed.split('@');
  if (!localPart || !domain) return null;
  if (localPart.length > 64) return null; // RFC 5321
  if (domain.length > 253) return null;

  // Ensure domain has valid TLD (at least 2 chars)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) return null;

  return trimmed;
}

/**
 * Sanitize a phone number (Brazilian format)
 * Returns cleaned number in E.164 format (+55...) or null if invalid
 */
export function sanitizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  // Remove everything except digits and leading +
  let cleaned = input.replace(/[^\d+]/g, '');

  // Remove leading + for processing
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) cleaned = cleaned.slice(1);

  // Handle different input formats
  let digits = cleaned;

  // If starts with 55 (Brazil country code), normalize
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2); // Remove country code for validation
  }

  // Brazilian phone validation
  // DDD (2 digits) + number (8-9 digits) = 10-11 digits
  if (digits.length < 10 || digits.length > 11) return null;

  // Validate DDD (11-99, excluding invalid ranges)
  const ddd = parseInt(digits.slice(0, 2), 10);
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF
    62, 64, // GO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 82, 83, 84, 85, 86, 87, 88, 89, // NE
    91, 92, 93, 94, 95, 96, 97, 98, 99, // N
  ];
  if (!validDDDs.includes(ddd)) return null;

  // Mobile numbers (9 digits) must start with 9
  if (digits.length === 11 && digits[2] !== '9') return null;

  // Return in E.164 format
  return `+55${digits}`;
}

/**
 * Format phone for display (Brazilian format)
 */
export function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return '';

  // Remove +55 if present
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    // Mobile: (XX) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
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
  formatPhoneDisplay,
  sanitizeSettings,
  sanitizeWebsiteSettings,
};

export default sanitizeUtils;
