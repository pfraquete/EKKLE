import { requireSuperAdmin, getUnresolvedAlertsCount } from '@/lib/admin-auth'
import { AdminSidebar, AdminHeader } from '@/components/admin/layout'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // This will redirect if not a super admin
    const profile = await requireSuperAdmin()
    const alertsCount = await getUnresolvedAlertsCount()

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
            <AdminSidebar profile={profile} alertsCount={alertsCount} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader profile={profile} alertsCount={alertsCount} />
                <main className="flex-1 overflow-y-auto p-6 bg-zinc-950">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
