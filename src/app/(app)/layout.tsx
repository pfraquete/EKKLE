import { redirect } from 'next/navigation'
import { getProfileWithModules } from '@/actions/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { isEkkleHubUser } from '@/lib/ekkle-utils'
import { logger } from '@/lib/logger'
import { ImpersonationWrapper } from '@/components/admin/impersonation-wrapper'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getProfileWithModules()

    logger.debug('[AppLayout] Profile check', { role: profile?.role, hasCell: !!profile?.cell_id })

    if (!profile) {
        redirect('/login')
    }

    // Ekkle Hub users (unaffiliated) should use the Ekkle member area
    if (isEkkleHubUser(profile)) {
        logger.debug('[AppLayout] Redirecting Ekkle Hub user to /ekkle/membro')
        redirect('/ekkle/membro')
    }

    // Only PASTOR can access the dashboard (SUPER_ADMIN is handled by middleware)
    if (profile.role !== 'PASTOR') {
        logger.debug('[AppLayout] Redirecting non-PASTOR to /membro', { role: profile.role })
        redirect('/membro')
    }

    return (
        <>
            {/* Impersonation Banner (shown when admin is impersonating a user) */}
            <ImpersonationWrapper />

            <div className="flex h-screen bg-black-absolute text-white-primary overflow-hidden dark pt-[var(--impersonation-banner-height,0px)]">
                {/* Sidebar */}
                <Sidebar profile={profile} />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Gold Light Effect at Top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] pointer-events-none z-0">
                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center_top,rgba(212,175,55,0.12)_0%,rgba(212,175,55,0.04)_40%,transparent_70%)]" />
                </div>
                
                {/* Header */}
                <Header profile={profile} />
                
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar relative z-10">
                    <div className="max-w-6xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
            
            {/* Mobile Navigation */}
            <MobileNav profile={profile} />
        </div>
        </>
    )
}
