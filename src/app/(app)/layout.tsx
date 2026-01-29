import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getProfile } from '@/actions/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

// Routes that LEADER role can access in the dashboard
const LEADER_ALLOWED_ROUTES = [
    '/dashboard/cultos',
]

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getProfile()
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''

    console.log('[AppLayout] Profile:', profile?.email, 'Role:', profile?.role, 'Cell:', profile?.cell_id, 'Path:', pathname)

    if (!profile) {
        redirect('/login')
    }

    // MEMBER role with a cell should use member area
    // MEMBER without cell needs dashboard access to choose a cell
    if (profile.role === 'MEMBER' && profile.cell_id) {
        console.log('[AppLayout] Redirecting MEMBER to /membro')
        redirect('/membro')
    }

    // LEADER role redirects to member area, EXCEPT for specific allowed routes
    if (profile.role === 'LEADER') {
        const isAllowedRoute = LEADER_ALLOWED_ROUTES.some(route => pathname.startsWith(route))
        if (!isAllowedRoute) {
            console.log('[AppLayout] Redirecting LEADER to /membro')
            redirect('/membro')
        }
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden dark">
            <Sidebar profile={profile} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header profile={profile} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
                    <div className="max-w-5xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
            <MobileNav profile={profile} />
        </div>
    )
}
