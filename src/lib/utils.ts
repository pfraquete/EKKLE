import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a secure random password
 * @param length - Length of the password (default: 12)
 * @returns A random password with uppercase, lowercase, numbers and special characters
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%&*'

  const allChars = uppercase + lowercase + numbers + special

  // Use crypto for secure random values
  const getRandomChar = (source: string) => {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    return source[values[0] % source.length]
  }

  // Ensure at least one character from each category
  const passwordChars = [
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(numbers),
    getRandomChar(special)
  ]

  // Fill the rest randomly
  while (passwordChars.length < length) {
    passwordChars.push(getRandomChar(allChars))
  }

  // Shuffle securely
  const shuffled = []
  while (passwordChars.length > 0) {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    const index = values[0] % passwordChars.length
    shuffled.push(passwordChars.splice(index, 1)[0])
  }

  return shuffled.join('')
}

/**
 * Formats a number as currency in BRL
 * @param value - The value to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
