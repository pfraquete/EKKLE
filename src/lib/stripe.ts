import Stripe from 'stripe'

// Initialize Stripe with a fallback key for build time
// The check for valid key will happen when making actual calls or can be handled by Stripe SDK
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock_key', {
    apiVersion: '2025-12-15.clover',
    typescript: true,
})
