/**
 * Bible Utilities
 *
 * Client-safe utilities for Bible references and formatting.
 * These can be imported in both server and client components.
 * 
 * Updated to use bible-api.com which provides complete
 * Old and New Testament in Portuguese (João Ferreira de Almeida).
 */

// Available Bible versions from bible-api.com
export const PORTUGUESE_BIBLES = {
    ALMEIDA: 'almeida',  // João Ferreira de Almeida (Portuguese)
    KJV: 'kjv',          // King James Version
    ASV: 'asv',          // American Standard Version
    BBE: 'bbe',          // Bible in Basic English
    WEB: 'web',          // World English Bible
} as const

// Default Bible for reading - Almeida is the only Portuguese version with complete OT+NT
export const DEFAULT_BIBLE = PORTUGUESE_BIBLES.ALMEIDA

export type BibleVersion = keyof typeof PORTUGUESE_BIBLES

/**
 * Bible book mapping (English ID to Portuguese name)
 */
export const BIBLE_BOOKS: Record<string, string> = {
    // Old Testament
    GEN: 'Gênesis',
    EXO: 'Êxodo',
    LEV: 'Levítico',
    NUM: 'Números',
    DEU: 'Deuteronômio',
    JOS: 'Josué',
    JDG: 'Juízes',
    RUT: 'Rute',
    '1SA': '1 Samuel',
    '2SA': '2 Samuel',
    '1KI': '1 Reis',
    '2KI': '2 Reis',
    '1CH': '1 Crônicas',
    '2CH': '2 Crônicas',
    EZR: 'Esdras',
    NEH: 'Neemias',
    EST: 'Ester',
    JOB: 'Jó',
    PSA: 'Salmos',
    PRO: 'Provérbios',
    ECC: 'Eclesiastes',
    SNG: 'Cânticos',
    ISA: 'Isaías',
    JER: 'Jeremias',
    LAM: 'Lamentações',
    EZK: 'Ezequiel',
    DAN: 'Daniel',
    HOS: 'Oséias',
    JOL: 'Joel',
    AMO: 'Amós',
    OBA: 'Obadias',
    JON: 'Jonas',
    MIC: 'Miquéias',
    NAM: 'Naum',
    HAB: 'Habacuque',
    ZEP: 'Sofonias',
    HAG: 'Ageu',
    ZEC: 'Zacarias',
    MAL: 'Malaquias',
    // New Testament
    MAT: 'Mateus',
    MRK: 'Marcos',
    LUK: 'Lucas',
    JHN: 'João',
    ACT: 'Atos',
    ROM: 'Romanos',
    '1CO': '1 Coríntios',
    '2CO': '2 Coríntios',
    GAL: 'Gálatas',
    EPH: 'Efésios',
    PHP: 'Filipenses',
    COL: 'Colossenses',
    '1TH': '1 Tessalonicenses',
    '2TH': '2 Tessalonicenses',
    '1TI': '1 Timóteo',
    '2TI': '2 Timóteo',
    TIT: 'Tito',
    PHM: 'Filemom',
    HEB: 'Hebreus',
    JAS: 'Tiago',
    '1PE': '1 Pedro',
    '2PE': '2 Pedro',
    '1JN': '1 João',
    '2JN': '2 João',
    '3JN': '3 João',
    JUD: 'Judas',
    REV: 'Apocalipse',
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

export interface PassageReference {
    bookId: string
    chapterStart: number
    chapterEnd?: number
    verseStart?: number
    verseEnd?: number
}

/**
 * Build passage ID from reference
 * Examples: 'GEN.1', 'GEN.1-GEN.2', 'GEN.1.1-GEN.1.10'
 */
export function buildPassageId(ref: PassageReference): string {
    const { bookId, chapterStart, chapterEnd, verseStart, verseEnd } = ref

    if (verseStart && verseEnd) {
        // Verse range: GEN.1.1-GEN.1.10
        return `${bookId}.${chapterStart}.${verseStart}-${bookId}.${chapterEnd || chapterStart}.${verseEnd}`
    } else if (chapterEnd && chapterEnd !== chapterStart) {
        // Chapter range: GEN.1-GEN.2
        return `${bookId}.${chapterStart}-${bookId}.${chapterEnd}`
    } else {
        // Single chapter: GEN.1
        return `${bookId}.${chapterStart}`
    }
}
