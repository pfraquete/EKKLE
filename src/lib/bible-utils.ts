/**
 * Bible Utilities
 *
 * Client-safe utilities for Bible references and formatting.
 * These can be imported in both server and client components.
 */

// Portuguese Bible versions
export const PORTUGUESE_BIBLES = {
    ARC: 'b9ce6f04aa8f6fb5-01',      // Almeida Revista e Corrigida
    NVI: 'f72b840c855f362c-04',      // Nova Versao Internacional
} as const

export type BibleVersion = keyof typeof PORTUGUESE_BIBLES

/**
 * Bible book mapping (English ID to Portuguese name)
 */
export const BIBLE_BOOKS: Record<string, string> = {
    GEN: 'Genesis',
    EXO: 'Exodo',
    LEV: 'Levitico',
    NUM: 'Numeros',
    DEU: 'Deuteronomio',
    JOS: 'Josue',
    JDG: 'Juizes',
    RUT: 'Rute',
    '1SA': '1 Samuel',
    '2SA': '2 Samuel',
    '1KI': '1 Reis',
    '2KI': '2 Reis',
    '1CH': '1 Cronicas',
    '2CH': '2 Cronicas',
    EZR: 'Esdras',
    NEH: 'Neemias',
    EST: 'Ester',
    JOB: 'Jó',
    PSA: 'Salmos',
    PRO: 'Proverbios',
    ECC: 'Eclesiastes',
    SNG: 'Canticos',
    ISA: 'Isaias',
    JER: 'Jeremias',
    LAM: 'Lamentacoes',
    EZK: 'Ezequiel',
    DAN: 'Daniel',
    HOS: 'Oseias',
    JOL: 'Joel',
    AMO: 'Amos',
    OBA: 'Obadias',
    JON: 'Jonas',
    MIC: 'Miqueias',
    NAM: 'Naum',
    HAB: 'Habacuque',
    ZEP: 'Sofonias',
    HAG: 'Ageu',
    ZEC: 'Zacarias',
    MAL: 'Malaquias',
    MAT: 'Mateus',
    MRK: 'Marcos',
    LUK: 'Lucas',
    JHN: 'Joao',
    ACT: 'Atos',
    ROM: 'Romanos',
    '1CO': '1 Corintios',
    '2CO': '2 Corintios',
    GAL: 'Galatas',
    EPH: 'Efesios',
    PHP: 'Filipenses',
    COL: 'Colossenses',
    '1TH': '1 Tessalonicenses',
    '2TH': '2 Tessalonicenses',
    '1TI': '1 Timoteo',
    '2TI': '2 Timoteo',
    TIT: 'Tito',
    PHM: 'Filemom',
    HEB: 'Hebreus',
    JAS: 'Tiago',
    '1PE': '1 Pedro',
    '2PE': '2 Pedro',
    '1JN': '1 Joao',
    '2JN': '2 Joao',
    '3JN': '3 Joao',
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
