import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getFeedPosts, getFeedSettings } from '@/actions/feed'
import { FeedContainer } from '@/components/feed/feed-container'
import { isEkkleHubUser } from '@/lib/ekkle-utils'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    // Ekkle Hub users go to their area
    if (isEkkleHubUser(profile)) {
        redirect('/ekkle/membro')
    }

    const [settings, { posts, hasMore }] = await Promise.all([
        getFeedSettings(),
        getFeedPosts({ page: 1 }),
    ])

    if (!settings) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Erro ao carregar configurações do feed</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-foreground">Feed</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Acompanhe as novidades da sua igreja
                </p>
            </div>

            <FeedContainer
                initialPosts={posts}
                initialHasMore={hasMore}
                settings={settings}
                currentUserId={profile.id}
                currentUserRole={profile.role}
                currentUserName={profile.full_name}
                currentUserPhoto={profile.photo_url}
            />
        </div>
    )
}
