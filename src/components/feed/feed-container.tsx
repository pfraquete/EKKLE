'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFeedPosts } from '@/actions/feed'
import { FeedPost, FeedSettings } from '@/types/feed'
import { FeedPostCard } from './feed-post-card'
import { FeedPostForm } from './feed-post-form'
import { FeedEmptyState } from './feed-empty-state'
import { Loader2 } from 'lucide-react'

interface FeedContainerProps {
    initialPosts: FeedPost[]
    initialHasMore: boolean
    settings: FeedSettings
    currentUserId: string
    currentUserRole: string
    currentUserName: string
    currentUserPhoto: string | null
}

export function FeedContainer({
    initialPosts,
    initialHasMore,
    settings,
    currentUserId,
    currentUserRole,
    currentUserName,
    currentUserPhoto,
}: FeedContainerProps) {
    const [posts, setPosts] = useState<FeedPost[]>(initialPosts)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // Subscribe to realtime updates
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('feed-posts-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'feed_posts',
                },
                async (payload) => {
                    // Only show approved posts or own posts
                    if (payload.new.status !== 'approved' && payload.new.author_id !== currentUserId) {
                        return
                    }

                    // Fetch the full post with relations
                    const { data: newPost } = await supabase
                        .from('feed_posts')
                        .select(`
                            *,
                            author:profiles!author_id(id, full_name, photo_url, role),
                            media:feed_post_media(*),
                            reactions:feed_post_reactions(*)
                        `)
                        .eq('id', payload.new.id)
                        .single()

                    if (newPost) {
                        // Check if post already exists
                        setPosts((prev) => {
                            if (prev.some(p => p.id === newPost.id)) {
                                return prev
                            }
                            return [{ ...newPost, user_reaction: null } as FeedPost, ...prev]
                        })
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'feed_posts',
                },
                (payload) => {
                    setPosts((prev) => prev.filter((p) => p.id !== payload.old.id))
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'feed_posts',
                },
                async (payload) => {
                    // If status changed to approved, fetch and add
                    if (payload.new.status === 'approved' && payload.old.status !== 'approved') {
                        const { data: updatedPost } = await supabase
                            .from('feed_posts')
                            .select(`
                                *,
                                author:profiles!author_id(id, full_name, photo_url, role),
                                media:feed_post_media(*),
                                reactions:feed_post_reactions(*)
                            `)
                            .eq('id', payload.new.id)
                            .single()

                        if (updatedPost) {
                            setPosts((prev) => {
                                const exists = prev.some(p => p.id === updatedPost.id)
                                if (exists) {
                                    return prev.map((p) =>
                                        p.id === updatedPost.id
                                            ? { ...updatedPost, user_reaction: p.user_reaction } as FeedPost
                                            : p
                                    )
                                }
                                return [{ ...updatedPost, user_reaction: null } as FeedPost, ...prev]
                            })
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUserId])

    // Infinite scroll
    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return

        setLoading(true)
        const nextPage = page + 1

        try {
            const { posts: newPosts, hasMore: more } = await getFeedPosts({ page: nextPage })

            setPosts((prev) => {
                // Deduplicate posts
                const existingIds = new Set(prev.map(p => p.id))
                const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id))
                return [...prev, ...uniqueNewPosts]
            })
            setHasMore(more)
            setPage(nextPage)
        } catch (error) {
            console.error('Error loading more posts:', error)
        } finally {
            setLoading(false)
        }
    }, [loading, hasMore, page])

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            observerRef.current?.disconnect()
        }
    }, [loadMore, hasMore, loading])

    const handlePostCreated = (newPost: FeedPost) => {
        // Add to the beginning of the list
        setPosts((prev) => [newPost, ...prev])
    }

    const handlePostDeleted = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
    }

    // Sort posts: pinned first, then by date
    const sortedPosts = [...posts].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Post creation form */}
            <FeedPostForm
                settings={settings}
                currentUserRole={currentUserRole}
                currentUserName={currentUserName}
                currentUserPhoto={currentUserPhoto}
                onPostCreated={handlePostCreated}
            />

            {/* Posts list */}
            {sortedPosts.length === 0 ? (
                <FeedEmptyState />
            ) : (
                <div className="space-y-4">
                    {sortedPosts.map((post) => (
                        <FeedPostCard
                            key={post.id}
                            post={post}
                            settings={settings}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            onDeleted={() => handlePostDeleted(post.id)}
                        />
                    ))}
                </div>
            )}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                {!loading && !hasMore && posts.length > 0 && (
                    <p className="text-sm text-muted-foreground">Você chegou ao fim do feed</p>
                )}
            </div>
        </div>
    )
}
