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

    if (!profile) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
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
