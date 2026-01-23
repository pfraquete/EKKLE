/**
 * Authentication Utilities
 * Helper functions for authentication and user management
 */

/**
 * Generates a secure temporary password
 * Format: 12 characters with uppercase, lowercase, numbers, and special chars
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
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    // Fill remaining characters (12 total)
    for (let i = password.length; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle the password to randomize position of required chars
    return password.split('').sort(() => Math.random() - 0.5).join('')
}
