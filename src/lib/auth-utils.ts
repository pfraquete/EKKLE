/**
 * Authentication Utilities
 * Helper functions for authentication and user management
 */

import crypto from 'crypto'

/**
 * Get a cryptographically secure random character from a string
 */
function getSecureRandomChar(chars: string): string {
  return chars[crypto.randomInt(chars.length)]
}

/**
 * Fisher-Yates shuffle with cryptographically secure randomness
 */
function secureShuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Generates a cryptographically secure temporary password
 * Format: 12 characters with uppercase, lowercase, numbers, and special chars
 *
 * Uses crypto.randomInt() instead of Math.random() for security.
 *
 * @returns {string} A secure random password
 */
export function generateTempPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%&*'

  const allChars = uppercase + lowercase + numbers + special

  // Ensure at least one character from each category
  let password = ''
  password += getSecureRandomChar(uppercase)
  password += getSecureRandomChar(lowercase)
  password += getSecureRandomChar(numbers)
  password += getSecureRandomChar(special)

  // Fill remaining characters (12 total)
  for (let i = password.length; i < 12; i++) {
    password += getSecureRandomChar(allChars)
  }

  // Shuffle the password using Fisher-Yates with crypto
  return secureShuffleArray(password.split('')).join('')
}
