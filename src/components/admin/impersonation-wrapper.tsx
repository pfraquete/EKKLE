import { getImpersonationClientData } from '@/lib/impersonation'
import { ImpersonationBanner } from './impersonation-banner'

/**
 * Server component that checks for impersonation and renders the banner
 */
export async function ImpersonationWrapper() {
    const impersonationData = await getImpersonationClientData()

    if (!impersonationData?.isImpersonating) {
        return null
    }

    return (
        <ImpersonationBanner
            adminEmail={impersonationData.adminEmail!}
            adminName={impersonationData.adminName}
            targetEmail={impersonationData.targetEmail!}
            targetName={impersonationData.targetName}
            targetChurchName={impersonationData.targetChurchName}
            expiresAt={impersonationData.expiresAt!}
            reason={impersonationData.reason!}
        />
    )
}
