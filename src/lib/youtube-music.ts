/**
 * YouTube Music API Service
 *
 * Handles communication with YouTube Data API v3 for worship music integration.
 * Note: YouTube Music doesn't have a dedicated API, so we use YouTube Data API.
 *
 * Environment variables required:
 * - YOUTUBE_CLIENT_ID
 * - YOUTUBE_CLIENT_SECRET
 * - NEXT_PUBLIC_APP_URL (for redirect URI)
 *
 * @see https://developers.google.com/youtube/v3
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const GOOGLE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Types
export interface YouTubePlaylist {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default?: { url: string; width: number; height: number }
      medium?: { url: string; width: number; height: number }
      high?: { url: string; width: number; height: number }
    }
    channelTitle: string
    publishedAt: string
  }
  contentDetails?: {
    itemCount: number
  }
}

export interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default?: { url: string; width: number; height: number }
      medium?: { url: string; width: number; height: number }
      high?: { url: string; width: number; height: number }
    }
    channelTitle: string
    publishedAt: string
  }
  contentDetails?: {
    duration: string // ISO 8601 duration
  }
}

export interface YouTubeTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

/**
 * YouTube Music API Service
 */
export class YouTubeMusicService {
  /**
   * Check if YouTube is configured
   */
  static isConfigured(): boolean {
    return !!(YOUTUBE_CLIENT_ID && YOUTUBE_CLIENT_SECRET)
  }

  /**
   * Check if YouTube API key is configured (for public data)
   */
  static isApiKeyConfigured(): boolean {
    return !!YOUTUBE_API_KEY
  }

  /**
   * Get the OAuth authorization URL
   *
   * @param state - Random state for CSRF protection
   * @returns Authorization URL to redirect user to
   */
  static getAuthUrl(state: string): string {
    const redirectUri = `${APP_URL}/api/auth/youtube/callback`
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: YOUTUBE_CLIENT_ID!,
      scope: scopes,
      redirect_uri: redirectUri,
      state,
      access_type: 'offline',
      prompt: 'consent',
    })

    return `${GOOGLE_OAUTH_BASE}/v2/auth?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   *
   * @param code - Authorization code from callback
   * @returns Access and refresh tokens
   */
  static async exchangeCode(code: string): Promise<YouTubeTokens> {
    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
      throw new Error('YouTube credentials not configured')
    }

    const redirectUri = `${APP_URL}/api/auth/youtube/callback`

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('YouTube token exchange error:', error)
      throw new Error('Failed to exchange YouTube code')
    }

    return response.json()
  }

  /**
   * Refresh access token
   *
   * @param refreshToken - Refresh token
   * @returns New tokens
   */
  static async refreshToken(refreshToken: string): Promise<YouTubeTokens> {
    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
      throw new Error('YouTube credentials not configured')
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('YouTube token refresh error:', error)
      throw new Error('Failed to refresh YouTube token')
    }

    const data = await response.json()
    return {
      ...data,
      refresh_token: refreshToken, // Keep the old refresh token
    }
  }

  /**
   * Make an authenticated request to YouTube API
   */
  private static async request<T>(
    endpoint: string,
    accessToken?: string,
    options: RequestInit = {}
  ): Promise<T> {
    let url = `${YOUTUBE_API_BASE}${endpoint}`

    // Add API key or access token
    const separator = url.includes('?') ? '&' : '?'
    if (accessToken) {
      // Use OAuth token
    } else if (YOUTUBE_API_KEY) {
      url += `${separator}key=${YOUTUBE_API_KEY}`
    } else {
      throw new Error('YouTube authentication required')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('YouTube API error:', error)
      throw new Error(error.error?.message || `YouTube API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get user's playlists
   *
   * @param accessToken - User's access token
   * @param maxResults - Number of playlists to return (max 50)
   * @returns List of user's playlists
   */
  static async getUserPlaylists(
    accessToken: string,
    maxResults: number = 50
  ): Promise<{ items: YouTubePlaylist[]; pageInfo: { totalResults: number } }> {
    return this.request(
      `/playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`,
      accessToken
    )
  }

  /**
   * Search for worship playlists (public)
   *
   * @param query - Search query (default: "louvor adoracao")
   * @param accessToken - Optional access token for personalized results
   * @returns List of matching playlists
   */
  static async searchWorshipPlaylists(
    query: string = 'louvor adoracao',
    accessToken?: string
  ): Promise<{ items: YouTubePlaylist[] }> {
    const encodedQuery = encodeURIComponent(query)
    return this.request(
      `/search?part=snippet&type=playlist&q=${encodedQuery}&maxResults=20&regionCode=BR`,
      accessToken
    )
  }

  /**
   * Get playlist items (videos)
   *
   * @param playlistId - Playlist ID
   * @param accessToken - Optional access token
   * @param maxResults - Number of items to return
   * @returns List of videos in the playlist
   */
  static async getPlaylistItems(
    playlistId: string,
    accessToken?: string,
    maxResults: number = 50
  ): Promise<{
    items: Array<{
      snippet: {
        resourceId: { videoId: string }
        title: string
        description: string
        thumbnails: YouTubeVideo['snippet']['thumbnails']
        channelTitle: string
      }
    }>
    pageInfo: { totalResults: number }
  }> {
    return this.request(
      `/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}`,
      accessToken
    )
  }

  /**
   * Get video details
   *
   * @param videoId - Video ID
   * @param accessToken - Optional access token
   * @returns Video details including duration
   */
  static async getVideo(
    videoId: string,
    accessToken?: string
  ): Promise<{ items: YouTubeVideo[] }> {
    return this.request(
      `/videos?part=snippet,contentDetails&id=${videoId}`,
      accessToken
    )
  }

  /**
   * Get featured worship playlists (public, using API key)
   */
  static async getFeaturedWorshipPlaylists(): Promise<YouTubePlaylist[]> {
    if (!YOUTUBE_API_KEY) {
      return []
    }

    try {
      const result = await this.searchWorshipPlaylists('louvor adoracao gospel brasileiro')
      return result.items.slice(0, 10)
    } catch {
      return []
    }
  }

  /**
   * Get YouTube embed URL for a video
   *
   * @param videoId - Video ID
   * @returns Embed URL
   */
  static getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`
  }

  /**
   * Get YouTube watch URL for a video
   *
   * @param videoId - Video ID
   * @returns Watch URL
   */
  static getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  /**
   * Parse ISO 8601 duration to seconds
   *
   * @param duration - ISO 8601 duration string (e.g., "PT4M13S")
   * @returns Duration in seconds
   */
  static parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    const seconds = parseInt(match[3] || '0', 10)

    return hours * 3600 + minutes * 60 + seconds
  }
}
