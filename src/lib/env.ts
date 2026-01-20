/**
 * Validates required environment variables
 * Throws descriptive error if any are missing
 */
export function validateEnv() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n\n` +
      `Please configure these variables:\n` +
      `1. Copy .env.example to .env.local\n` +
      `2. Fill in your Supabase credentials from https://supabase.com/dashboard/project/_/settings/api\n` +
      `3. If deploying to Railway, add these variables in the Railway dashboard\n\n` +
      `See README.md for detailed setup instructions.`
    )
  }

  // Validate URL formats
  try {
    new URL(requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!)
    new URL(requiredEnvVars.NEXT_PUBLIC_APP_URL!)
  } catch {
    throw new Error(
      'Invalid URL format in environment variables. ' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_APP_URL must be valid URLs.'
    )
  }
}

// Validate on module import (will run when server starts)
if (typeof window === 'undefined') {
  validateEnv()
}
