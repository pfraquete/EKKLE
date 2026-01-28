import { getProfile } from '@/actions/auth'
import { createCheckoutSession } from '@/actions/subscription'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  // Only pastors can create subscriptions
  if (profile.role !== 'PASTOR') {
    redirect('/dashboard')
  }

  const planId = searchParams.plan
  if (!planId) {
    redirect('/configuracoes/assinatura')
  }

  // Create checkout session
  const result = await createCheckoutSession(profile.church_id, planId)

  if (result.error || !result.url) {
    // Redirect back with error
    redirect(`/configuracoes/assinatura?error=${encodeURIComponent(result.error || 'Erro desconhecido')}`)
  }

  // Redirect to Stripe checkout
  redirect(result.url)
}
