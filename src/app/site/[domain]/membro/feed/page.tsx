import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFeedPosts, getFeedSettings } from '@/actions/feed'
import { FeedContainer } from '@/components/feed/feed-container'

export const dynamic = 'force-dynamic'

export default async function MemberFeedPage() {
    try {
        const church = await getChurch()
        const supabase = await createClient()

        if (!church) {
            redirect('/')
        }

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            redirect('/login')
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError || !profile) {
            console.error('[MemberFeedPage] Error fetching profile:', profileError)
            redirect('/login')
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
    } catch (error) {
        console.error('[MemberFeedPage] Error:', error)
        redirect('/login')
    }
}
