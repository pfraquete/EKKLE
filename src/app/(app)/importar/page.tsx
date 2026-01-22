export const dynamic = 'force-dynamic'

import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import ImportPage from '@/components/import/import-page'

export default async function ImportRoute() {
    const profile = await getProfile()
    if (!profile) redirect('/login')
    if (profile.role !== 'PASTOR') redirect('/dashboard')

    return (
        <div className="p-6 pb-24">
            <ImportPage />
        </div>
    )
}
