/**
 * API.Bible Integration Service
 *
 * Handles communication with API.Bible for fetching Bible content.
 * Includes caching, rate limiting, and Portuguese Bible support.
 *
 * API Documentation: https://docs.api.bible/
 *
 * NOTE: This module is server-only due to Supabase server client usage.
 * For client components, import from '@/lib/bible-utils' instead.
 */

import { createClient } from '@/lib/supabase/server'

// Re-export client-safe utilities for backwards compatibility
export {
    PORTUGUESE_BIBLES,
    BIBLE_BOOKS,
    getBookName,
    formatReadingReference,
    buildPassageId,
    type BibleVersion,
    type PassageReference
} from './bible-utils'

import { PORTUGUESE_BIBLES, buildPassageId, type PassageReference } from './bible-utils'

const API_BIBLE_BASE_URL = 'https://rest.api.bible/v1'

export interface BibleBook {
    id: string
    bibleId: string
    abbreviation: string
    name: string
    nameLong: string
}

export interface BibleChapter {
    id: string
    bibleId: string
    bookId: string
    number: string
    reference: string
}

export interface BiblePassage {
    id: string
    bibleId: string
    reference: string
    content: string
    copyright: string
}

/**
 * Get API key (lazy initialization)
 */
function getApiKey(): string {
    const apiKey = process.env.API_BIBLE_KEY
    if (!apiKey) {
        throw new Error('API_BIBLE_KEY is not configured')
    }
    return apiKey
}

/**
 * API.Bible Service
 */
export class ApiBibleService {
    /**
     * Check if API.Bible is configured
     */
    static isConfigured(): boolean {
        return !!process.env.API_BIBLE_KEY
    }

    /**
     * Make authenticated request to API.Bible
     */
    private static async request<T>(
        endpoint: string,
        options: { timeout?: number } = {}
    ): Promise<T> {
        const apiKey = getApiKey()
        const url = `${API_BIBLE_BASE_URL}${endpoint}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000)

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'api-key': apiKey,
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))

                // Handle specific API errors
                if (response.status === 401 || response.status === 403) {
                    console.error('[API.Bible] Invalid API key - check API_BIBLE_KEY configuration')
                    throw new Error('API_KEY_INVALID')
                }

                if (response.status === 429) {
                    console.error('[API.Bible] Rate limit exceeded')
                    throw new Error('RATE_LIMIT_EXCEEDED')
                }

                throw new Error(errorData.message || `API.Bible error: ${response.status}`)
            }

            const data = await response.json()
            return data.data as T
        } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('API.Bible request timeout')
            }
            throw error
        }
    }

    /**
     * Get list of available Bibles
     */
    static async getBibles(): Promise<Array<{ id: string; name: string; language: { id: string } }>> {
        return this.request('/bibles')
    }

    /**
     * Get books of a Bible
     */
    static async getBooks(bibleId: string = PORTUGUESE_BIBLES.ARC): Promise<BibleBook[]> {
        return this.request(`/bibles/${bibleId}/books`)
    }

    /**
     * Get chapters of a book
     */
    static async getChapters(bibleId: string, bookId: string): Promise<BibleChapter[]> {
        return this.request(`/bibles/${bibleId}/books/${bookId}/chapters`)
    }

    /**
     * Get a passage (with caching)
     */
    static async getPassage(
        bibleId: string,
        passageId: string,
        options: { useCache?: boolean } = { useCache: true }
    ): Promise<BiblePassage> {
        // Try cache first
        if (options.useCache) {
            const cached = await this.getFromCache(bibleId, passageId)
            if (cached) {
                return cached
            }
        }

        // Fetch from API
        const passage = await this.request<BiblePassage>(
            `/bibles/${bibleId}/passages/${passageId}?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`
        )

        // Cache the result
        await this.saveToCache(bibleId, passageId, passage)

        return passage
    }

    /**
     * Build passage ID from reference (delegate to utility)
     */
    static buildPassageId(ref: PassageReference): string {
        return buildPassageId(ref)
    }

    /**
     * Get passage from cache
     */
    private static async getFromCache(
        bibleId: string,
        passageId: string
    ): Promise<BiblePassage | null> {
        try {
            const supabase = await createClient()

            const { data } = await supabase
                .from('bible_content_cache')
                .select('content_html, content_text, reference')
                .eq('bible_id', bibleId)
                .eq('passage_id', passageId)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle()

            if (data) {
                return {
                    id: passageId,
                    bibleId,
                    reference: data.reference,
                    content: data.content_html,
                    copyright: '',
                }
            }
        } catch (error) {
            console.error('[API.Bible] Cache read error:', error)
        }
        return null
    }

    /**
     * Save passage to cache
     */
    private static async saveToCache(
        bibleId: string,
        passageId: string,
        passage: BiblePassage
    ): Promise<void> {
        try {
            const supabase = await createClient()

            // Strip HTML tags for text version
            const textContent = passage.content
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            await supabase
                .from('bible_content_cache')
                .upsert(
                    {
                        bible_id: bibleId,
                        passage_id: passageId,
                        content_html: passage.content,
                        content_text: textContent,
                        reference: passage.reference,
                        cached_at: new Date().toISOString(),
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                    { onConflict: 'bible_id,passage_id' }
                )
        } catch (error) {
            console.error('[API.Bible] Cache write error:', error)
        }
    }

    /**
     * Clean expired cache entries
     */
    static async cleanExpiredCache(): Promise<number> {
        try {
            const supabase = await createClient()

            // First count, then delete
            const { count } = await supabase
                .from('bible_content_cache')
                .select('id', { count: 'exact', head: true })
                .lt('expires_at', new Date().toISOString())

            if (count && count > 0) {
                await supabase
                    .from('bible_content_cache')
                    .delete()
                    .lt('expires_at', new Date().toISOString())
            }

            return count || 0
        } catch (error) {
            console.error('[API.Bible] Cache cleanup error:', error)
            return 0
        }
    }
}
