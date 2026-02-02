/**
 * Bible API Service (bible-api.com)
 * 
 * Free API with complete Bible in Portuguese (João Ferreira de Almeida)
 * Supports all 66 books - Old and New Testament
 * 
 * API Documentation: https://bible-api.com/
 */

const BASE_URL = 'https://bible-api.com'

// Available versions
export const BIBLE_VERSIONS = {
  almeida: { id: 'almeida', name: 'Almeida', fullName: 'João Ferreira de Almeida' },
  kjv: { id: 'kjv', name: 'KJV', fullName: 'King James Version' },
  asv: { id: 'asv', name: 'ASV', fullName: 'American Standard Version' },
  bbe: { id: 'bbe', name: 'BBE', fullName: 'Bible in Basic English' },
  web: { id: 'web', name: 'WEB', fullName: 'World English Bible' },
} as const

export type BibleVersionId = keyof typeof BIBLE_VERSIONS
export const DEFAULT_VERSION: BibleVersionId = 'almeida'

// Book ID mapping (API uses standard 3-letter codes)
export const BOOK_IDS: Record<string, string> = {
  'GEN': 'GEN', 'EXO': 'EXO', 'LEV': 'LEV', 'NUM': 'NUM', 'DEU': 'DEU',
  'JOS': 'JOS', 'JDG': 'JDG', 'RUT': 'RUT', '1SA': '1SA', '2SA': '2SA',
  '1KI': '1KI', '2KI': '2KI', '1CH': '1CH', '2CH': '2CH', 'EZR': 'EZR',
  'NEH': 'NEH', 'EST': 'EST', 'JOB': 'JOB', 'PSA': 'PSA', 'PRO': 'PRO',
  'ECC': 'ECC', 'SNG': 'SNG', 'ISA': 'ISA', 'JER': 'JER', 'LAM': 'LAM',
  'EZK': 'EZK', 'DAN': 'DAN', 'HOS': 'HOS', 'JOL': 'JOL', 'AMO': 'AMO',
  'OBA': 'OBA', 'JON': 'JON', 'MIC': 'MIC', 'NAM': 'NAM', 'HAB': 'HAB',
  'ZEP': 'ZEP', 'HAG': 'HAG', 'ZEC': 'ZEC', 'MAL': 'MAL',
  'MAT': 'MAT', 'MRK': 'MRK', 'LUK': 'LUK', 'JHN': 'JHN', 'ACT': 'ACT',
  'ROM': 'ROM', '1CO': '1CO', '2CO': '2CO', 'GAL': 'GAL', 'EPH': 'EPH',
  'PHP': 'PHP', 'COL': 'COL', '1TH': '1TH', '2TH': '2TH', '1TI': '1TI',
  '2TI': '2TI', 'TIT': 'TIT', 'PHM': 'PHM', 'HEB': 'HEB', 'JAS': 'JAS',
  '1PE': '1PE', '2PE': '2PE', '1JN': '1JN', '2JN': '2JN', '3JN': '3JN',
  'JUD': 'JUD', 'REV': 'REV',
}

// Book names in Portuguese
export const BOOK_NAMES: Record<string, string> = {
  'GEN': 'Gênesis', 'EXO': 'Êxodo', 'LEV': 'Levítico', 'NUM': 'Números', 'DEU': 'Deuteronômio',
  'JOS': 'Josué', 'JDG': 'Juízes', 'RUT': 'Rute', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Reis', '2KI': '2 Reis', '1CH': '1 Crônicas', '2CH': '2 Crônicas', 'EZR': 'Esdras',
  'NEH': 'Neemias', 'EST': 'Ester', 'JOB': 'Jó', 'PSA': 'Salmos', 'PRO': 'Provérbios',
  'ECC': 'Eclesiastes', 'SNG': 'Cânticos', 'ISA': 'Isaías', 'JER': 'Jeremias', 'LAM': 'Lamentações',
  'EZK': 'Ezequiel', 'DAN': 'Daniel', 'HOS': 'Oséias', 'JOL': 'Joel', 'AMO': 'Amós',
  'OBA': 'Obadias', 'JON': 'Jonas', 'MIC': 'Miquéias', 'NAM': 'Naum', 'HAB': 'Habacuque',
  'ZEP': 'Sofonias', 'HAG': 'Ageu', 'ZEC': 'Zacarias', 'MAL': 'Malaquias',
  'MAT': 'Mateus', 'MRK': 'Marcos', 'LUK': 'Lucas', 'JHN': 'João', 'ACT': 'Atos',
  'ROM': 'Romanos', '1CO': '1 Coríntios', '2CO': '2 Coríntios', 'GAL': 'Gálatas', 'EPH': 'Efésios',
  'PHP': 'Filipenses', 'COL': 'Colossenses', '1TH': '1 Tessalonicenses', '2TH': '2 Tessalonicenses',
  '1TI': '1 Timóteo', '2TI': '2 Timóteo', 'TIT': 'Tito', 'PHM': 'Filemom', 'HEB': 'Hebreus',
  'JAS': 'Tiago', '1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 João', '2JN': '2 João',
  '3JN': '3 João', 'JUD': 'Judas', 'REV': 'Apocalipse',
}

interface BibleVerse {
  book_id: string
  book: string
  chapter: number
  verse: number
  text: string
}

interface BibleApiResponse {
  reference: string
  verses: BibleVerse[]
  text: string
  translation_id: string
  translation_name: string
  translation_note: string
}

interface ChapterResponse {
  translation_id: string
  book_id: string
  book_name: string
  chapter: number
  verses: BibleVerse[]
}

export interface PassageResult {
  reference: string
  content: string
  verses: Array<{
    number: number
    text: string
  }>
  copyright: string
}

export class BibleApiService {
  private version: BibleVersionId

  constructor(version: BibleVersionId = DEFAULT_VERSION) {
    this.version = version
  }

  /**
   * Fetch a chapter from the Bible
   */
  async getChapter(bookId: string, chapter: number): Promise<PassageResult> {
    const normalizedBookId = bookId.toUpperCase()
    const url = `${BASE_URL}/data/${this.version}/${normalizedBookId}/${chapter}`
    
    console.log(`[BibleAPI] Fetching: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data: ChapterResponse = await response.json()
    
    if (!data.verses || data.verses.length === 0) {
      throw new Error(`No verses found for ${bookId} ${chapter}`)
    }

    const bookName = BOOK_NAMES[normalizedBookId] || data.book_name || bookId
    const reference = `${bookName} ${chapter}`

    // Clean up verse text (remove extra whitespace)
    const verses = data.verses.map(v => ({
      number: v.verse,
      text: v.text.replace(/\s+/g, ' ').trim()
    }))

    // Build content as formatted HTML
    const content = verses
      .map(v => `<span class="verse-number">${v.number}</span> ${v.text}`)
      .join(' ')

    return {
      reference,
      content,
      verses,
      copyright: 'João Ferreira de Almeida - Domínio Público'
    }
  }

  /**
   * Fetch a passage (range of verses)
   */
  async getPassage(bookId: string, chapterStart: number, chapterEnd?: number): Promise<PassageResult> {
    const normalizedBookId = bookId.toUpperCase()
    const bookName = BOOK_NAMES[normalizedBookId] || bookId

    // If single chapter or no end specified
    if (!chapterEnd || chapterEnd === chapterStart) {
      return this.getChapter(normalizedBookId, chapterStart)
    }

    // Multiple chapters - fetch each and combine
    const chapters: PassageResult[] = []
    for (let ch = chapterStart; ch <= chapterEnd; ch++) {
      try {
        const chapter = await this.getChapter(normalizedBookId, ch)
        chapters.push(chapter)
      } catch (error) {
        console.error(`[BibleAPI] Error fetching ${bookId} ${ch}:`, error)
      }
    }

    if (chapters.length === 0) {
      throw new Error(`No chapters found for ${bookId} ${chapterStart}-${chapterEnd}`)
    }

    const reference = `${bookName} ${chapterStart}-${chapterEnd}`
    
    // Combine all chapters
    const allVerses = chapters.flatMap((ch, idx) => 
      ch.verses.map(v => ({
        ...v,
        chapter: chapterStart + idx
      }))
    )

    const content = chapters
      .map((ch, idx) => {
        const chNum = chapterStart + idx
        return `<h3 class="chapter-title">Capítulo ${chNum}</h3>${ch.content}`
      })
      .join('\n')

    return {
      reference,
      content,
      verses: allVerses,
      copyright: 'João Ferreira de Almeida - Domínio Público'
    }
  }

  /**
   * Get book name in Portuguese
   */
  getBookName(bookId: string): string {
    return BOOK_NAMES[bookId.toUpperCase()] || bookId
  }

  /**
   * Set the Bible version
   */
  setVersion(version: BibleVersionId): void {
    this.version = version
  }

  /**
   * Get current version
   */
  getVersion(): BibleVersionId {
    return this.version
  }
}

// Export singleton instance
export const bibleApi = new BibleApiService()
