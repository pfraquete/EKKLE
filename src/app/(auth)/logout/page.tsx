import { signOut } from '@/actions/auth'

export const dynamic = 'force-dynamic'

export default async function LogoutPage() {
    // Call signOut action which will redirect to /login
    await signOut()
}
