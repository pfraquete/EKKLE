import { vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock environment variables
process.env.PAGARME_PLATFORM_RECIPIENT_ID = 'rp_test_platform_123'
process.env.PAGARME_SECRET_KEY = 'sk_test_123'
process.env.PAGARME_API_URL = 'https://api.pagar.me/core/v5'
