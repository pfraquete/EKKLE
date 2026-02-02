/**
 * A Bíblia Digital API Integration Service
 *
 * Handles communication with A Bíblia Digital API for fetching Bible content.
 * This API provides complete Old and New Testament in Portuguese.
 *
 * API Documentation: https://www.abibliadigital.com.br/en
 * GitHub: https://github.com/omarciovsena/abibliadigital
 *
 * NOTE: This module is server-only due to Supabase server client usage.
 */

import { createClient } from '@/lib/supabase/server'

const API_BASE_URL = 'https://www.abibliadigital.com.br/api'

// Available Bible versions
export const BIBLE_VERSIONS = {
    NVI: 'nvi',      // Nova Versão Internacional
    ACF: 'acf',      // Almeida Corrigida Fiel
    RA: 'ra',        // Revista e Atualizada
    KJV: 'kjv',      // King James Version
    BBE: 'bbe',      // Bible in Basic English
    APEE: 'apee',    // Português Europeu
} as const

export type BibleVersion = keyof typeof BIBLE_VERSIONS

// Default version for reading
export const DEFAULT_VERSION = BIBLE_VERSIONS.NVI

// Book abbreviation mapping (API.Bible format to A Bíblia Digital format)
export const BOOK_ABBREV_MAP: Record<string, string> = {
    // Old Testament
    GEN: 'gn', EXO: 'ex', LEV: 'lv', NUM: 'nm', DEU: 'dt',
    JOS: 'js', JDG: 'jz', RUT: 'rt', '1SA': '1sm', '2SA': '2sm',
    '1KI': '1rs', '2KI': '2rs', '1CH': '1cr', '2CH': '2cr',
    EZR: 'ed', NEH: 'ne', EST: 'et', JOB: 'jó', PSA: 'sl',
    PRO: 'pv', ECC: 'ec', SNG: 'ct', ISA: 'is', JER: 'jr',
    LAM: 'lm', EZK: 'ez', DAN: 'dn', HOS: 'os', JOL: 'jl',
    AMO: 'am', OBA: 'ob', JON: 'jn', MIC: 'mq', NAM: 'na',
    HAB: 'hc', ZEP: 'sf', HAG: 'ag', ZEC: 'zc', MAL: 'ml',
    // New Testament
    MAT: 'mt', MRK: 'mc', LUK: 'lc', JHN: 'jo', ACT: 'at',
    ROM: 'rm', '1CO': '1co', '2CO': '2co', GAL: 'gl', EPH: 'ef',
    PHP: 'fp', COL: 'cl', '1TH': '1ts', '2TH': '2ts',
    '1TI': '1tm', '2TI': '2tm', TIT: 'tt', PHM: 'fm',
    HEB: 'hb', JAS: 'tg', '1PE': '1pe', '2PE': '2pe',
    '1JN': '1jo', '2JN': '2jo', '3JN': '3jo', JUD: 'jd', REV: 'ap',
}

// Reverse mapping for display
export const ABBREV_TO_BOOK_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(BOOK_ABBREV_MAP).map(([k, v]) => [v, k])
)

/**
 * Bible book mapping (English ID to Portuguese name)
 */
export const BIBLE_BOOKS: Record<string, string> = {
    GEN: 'Gênesis', EXO: 'Êxodo', LEV: 'Levítico', NUM: 'Números', DEU: 'Deuteronômio',
    JOS: 'Josué', JDG: 'Juízes', RUT: 'Rute', '1SA': '1 Samuel', '2SA': '2 Samuel',
    '1KI': '1 Reis', '2KI': '2 Reis', '1CH': '1 Crônicas', '2CH': '2 Crônicas',
    EZR: 'Esdras', NEH: 'Neemias', EST: 'Ester', JOB: 'Jó', PSA: 'Salmos',
    PRO: 'Provérbios', ECC: 'Eclesiastes', SNG: 'Cânticos', ISA: 'Isaías', JER: 'Jeremias',
    LAM: 'Lamentações', EZK: 'Ezequiel', DAN: 'Daniel', HOS: 'Oséias', JOL: 'Joel',
    AMO: 'Amós', OBA: 'Obadias', JON: 'Jonas', MIC: 'Miquéias', NAM: 'Naum',
    HAB: 'Habacuque', ZEP: 'Sofonias', HAG: 'Ageu', ZEC: 'Zacarias', MAL: 'Malaquias',
    MAT: 'Mateus', MRK: 'Marcos', LUK: 'Lucas', JHN: 'João', ACT: 'Atos',
    ROM: 'Romanos', '1CO': '1 Coríntios', '2CO': '2 Coríntios', GAL: 'Gálatas', EPH: 'Efésios',
    PHP: 'Filipenses', COL: 'Colossenses', '1TH': '1 Tessalonicenses', '2TH': '2 Tessalonicenses',
    '1TI': '1 Timóteo', '2TI': '2 Timóteo', TIT: 'Tito', PHM: 'Filemom',
    HEB: 'Hebreus', JAS: 'Tiago', '1PE': '1 Pedro', '2PE': '2 Pedro',
    '1JN': '1 João', '2JN': '2 João', '3JN': '3 João', JUD: 'Judas', REV: 'Apocalipse',
}

export interface BibleVerse {
    number: number
    text: string
}

export interface BibleChapterResponse {
    book: {
        abbrev: { pt: string; en: string }
        name: string
        author: string
        group: string
        version: string
    }
    chapter: {
        number: number
        verses: number
    }
    verses: BibleVerse[]
}

export interface BiblePassage {
    content: string
    reference: string
    verses: BibleVerse[]
}

/**
 * Get Portuguese book name
 */
export function getBookName(bookId: string): string {
    return BIBLE_BOOKS[bookId] || bookId
}

/**
 * Format reading reference for display
 */
export function formatReadingReference(
    bookId: string,
    chapterStart: number,
    chapterEnd?: number | null
): string {
    const bookName = getBookName(bookId)
    if (chapterEnd && chapterEnd !== chapterStart) {
        return `${bookName} ${chapterStart}-${chapterEnd}`
    }
    return `${bookName} ${chapterStart}`
}

/**
 * A Bíblia Digital Service
 */
export class ABibliaDigitalService {
    /**
     * Check if the service is available
     */
    static isConfigured(): boolean {
        // This API doesn't require authentication for basic usage
        return true
    }

    /**
     * Make request to A Bíblia Digital API
     */
    private static async request<T>(
        endpoint: string,
        options: { timeout?: number } = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000)

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED')
                }
                if (response.status === 404) {
                    throw new Error('PASSAGE_NOT_FOUND')
                }
                throw new Error(`API error: ${response.status}`)
            }

            return await response.json() as T
        } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout')
            }
            throw error
        }
    }

    /**
     * Get list of all Bible books
     */
    static async getBooks(): Promise<Array<{ abbrev: { pt: string; en: string }; name: string; chapters: number }>> {
        return this.request('/books')
    }

    /**
     * Get a chapter
     */
    static async getChapter(
        version: string,
        bookAbbrev: string,
        chapter: number
    ): Promise<BibleChapterResponse> {
        return this.request(`/verses/${version}/${bookAbbrev}/${chapter}`)
    }

    /**
     * Get a specific verse
     */
    static async getVerse(
        version: string,
        bookAbbrev: string,
        chapter: number,
        verse: number
    ): Promise<BibleVerse & { book: { name: string } }> {
        return this.request(`/verses/${version}/${bookAbbrev}/${chapter}/${verse}`)
    }

    /**
     * Get a passage (one or more chapters) with caching
     */
    static async getPassage(
        bookId: string,
        chapterStart: number,
        chapterEnd?: number | null,
        version: string = DEFAULT_VERSION,
        options: { useCache?: boolean } = { useCache: true }
    ): Promise<BiblePassage> {
        const abbrev = BOOK_ABBREV_MAP[bookId] || bookId.toLowerCase()
        const cacheKey = `${version}:${abbrev}:${chapterStart}${chapterEnd ? `-${chapterEnd}` : ''}`

        // Try cache first
        if (options.useCache) {
            const cached = await this.getFromCache(version, cacheKey)
            if (cached) {
                return cached
            }
        }

        // Fetch chapter(s) from API
        const allVerses: BibleVerse[] = []
        const endChapter = chapterEnd || chapterStart

        for (let ch = chapterStart; ch <= endChapter; ch++) {
            try {
                const response = await this.getChapter(version, abbrev, ch)
                
                // Add chapter prefix to verses if multiple chapters
                if (chapterStart !== endChapter) {
                    const versesWithPrefix = response.verses.map(v => ({
                        number: v.number,
                        text: `[${ch}:${v.number}] ${v.text}`
                    }))
                    allVerses.push(...versesWithPrefix)
                } else {
                    allVerses.push(...response.verses)
                }
            } catch (error) {
                console.error(`[ABibliaDigital] Error fetching ${abbrev} ${ch}:`, error)
                throw error
            }
        }

        // Format content as HTML
        const content = this.formatVersesToHtml(allVerses)
        const reference = formatReadingReference(bookId, chapterStart, chapterEnd)

        const passage: BiblePassage = {
            content,
            reference,
            verses: allVerses
        }

        // Cache the result
        await this.saveToCache(version, cacheKey, passage)

        return passage
    }

    /**
     * Format verses to HTML content
     */
    private static formatVersesToHtml(verses: BibleVerse[]): string {
        return verses.map(v => {
            // Check if verse already has chapter prefix [ch:v]
            const hasPrefix = v.text.startsWith('[')
            if (hasPrefix) {
                return `<p class="verse">${v.text}</p>`
            }
            return `<p class="verse"><sup class="verse-number">${v.number}</sup> ${v.text}</p>`
        }).join('\n')
    }

    /**
     * Get passage from cache
     */
    private static async getFromCache(
        version: string,
        passageId: string
    ): Promise<BiblePassage | null> {
        try {
            const supabase = await createClient()

            const { data } = await supabase
                .from('bible_content_cache')
                .select('content_html, content_text, reference')
                .eq('bible_id', version)
                .eq('passage_id', passageId)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle()

            if (data) {
                return {
                    content: data.content_html,
                    reference: data.reference,
                    verses: [] // Verses not stored in cache
                }
            }
        } catch (error) {
            console.error('[ABibliaDigital] Cache read error:', error)
        }
        return null
    }

    /**
     * Save passage to cache
     */
    private static async saveToCache(
        version: string,
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
                        bible_id: version,
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
            console.error('[ABibliaDigital] Cache write error:', error)
        }
    }

    /**
     * Clean expired cache entries
     */
    static async cleanExpiredCache(): Promise<number> {
        try {
            const supabase = await createClient()

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
            console.error('[ABibliaDigital] Cache cleanup error:', error)
            return 0
        }
    }
}
