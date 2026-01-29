import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getProfile()

    console.log('[AppLayout] Profile:', profile?.email, 'Role:', profile?.role, 'Cell:', profile?.cell_id)

    if (!profile) {
        redirect('/login')
    }

    // MEMBER role with a cell should use member area
    // MEMBER without cell needs dashboard access to choose a cell
    if (profile.role === 'MEMBER' && profile.cell_id) {
        console.log('[AppLayout] Redirecting MEMBER to /membro')
        redirect('/membro')
    }

    // LEADER role also redirects to member area (they manage their cell from there)
    if (profile.role === 'LEADER') {
        console.log('[AppLayout] Redirecting LEADER to /membro')
        redirect('/membro')
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
