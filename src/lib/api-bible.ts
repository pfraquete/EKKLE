/**
 * API.Bible Integration Service (DEPRECATED)
 *
 * This module has been replaced by A Bíblia Digital API which provides
 * complete Old and New Testament in Portuguese.
 * 
 * This file is kept for backwards compatibility and re-exports from
 * the new abibliadigital.ts module.
 *
 * @deprecated Use '@/lib/abibliadigital' instead
 */

// Re-export everything from the new module for backwards compatibility
export {
    PORTUGUESE_BIBLES,
    DEFAULT_BIBLE,
    BIBLE_BOOKS,
    getBookName,
    formatReadingReference,
    buildPassageId,
    type BibleVersion,
    type PassageReference
} from './bible-utils'

// Re-export the service with a compatible interface
export {
    ABibliaDigitalService as ApiBibleService,
    DEFAULT_VERSION as DEFAULT_BIBLE_ID,
    BIBLE_VERSIONS,
} from './abibliadigital'

// Legacy types for backwards compatibility
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
