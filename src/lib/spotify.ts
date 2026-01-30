/**
 * Spotify API Service
 *
 * Handles communication with Spotify Web API for worship music integration.
 *
 * Environment variables required:
 * - SPOTIFY_CLIENT_ID
 * - SPOTIFY_CLIENT_SECRET
 * - NEXT_PUBLIC_APP_URL (for redirect URI)
 *
 * @see https://developer.spotify.com/documentation/web-api
 */

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Types
export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: Array<{ url: string; height: number; width: number }>
  owner: {
    display_name: string
    id: string
  }
  tracks: {
    total: number
    href: string
  }
  external_urls: {
    spotify: string
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
  artists: Array<{
    id: string
    name: string
  }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
  }
}

export interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

/**
 * Spotify API Service
 */
export class SpotifyService {
  /**
   * Check if Spotify is configured
   */
  static isConfigured(): boolean {
    return !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)
  }

  /**
   * Get the OAuth authorization URL
   *
   * @param state - Random state for CSRF protection
   * @returns Authorization URL to redirect user to
   */
  static getAuthUrl(state: string): string {
    const redirectUri = `${APP_URL}/api/auth/spotify/callback`
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID!,
      scope: scopes,
      redirect_uri: redirectUri,
      state,
    })

    return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   *
   * @param code - Authorization code from callback
   * @returns Access and refresh tokens
   */
  static async exchangeCode(code: string): Promise<SpotifyTokens> {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured')
    }

    const redirectUri = `${APP_URL}/api/auth/spotify/callback`
    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')

    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Spotify token exchange error:', error)
      throw new Error('Failed to exchange Spotify code')
    }

    return response.json()
  }

  /**
   * Refresh access token
   *
   * @param refreshToken - Refresh token
   * @returns New tokens
   */
  static async refreshToken(refreshToken: string): Promise<SpotifyTokens> {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured')
    }

    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')

    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Spotify token refresh error:', error)
      throw new Error('Failed to refresh Spotify token')
    }

    const data = await response.json()
    // Keep the old refresh token if a new one wasn't provided
    return {
      ...data,
      refresh_token: data.refresh_token || refreshToken,
    }
  }

  /**
   * Make an authenticated request to Spotify API
   */
  private static async request<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Spotify API error:', error)
      throw new Error(error.error?.message || `Spotify API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get user's playlists
   *
   * @param accessToken - User's access token
   * @param limit - Number of playlists to return (max 50)
   * @returns List of user's playlists
   */
  static async getUserPlaylists(
    accessToken: string,
    limit: number = 50
  ): Promise<{ items: SpotifyPlaylist[]; total: number }> {
    return this.request(`/me/playlists?limit=${limit}`, accessToken)
  }

  /**
   * Search for worship playlists
   *
   * @param accessToken - User's access token
   * @param query - Search query (default: "louvor adoracao")
   * @returns List of matching playlists
   */
  static async searchWorshipPlaylists(
    accessToken: string,
    query: string = 'louvor adoracao'
  ): Promise<{ playlists: { items: SpotifyPlaylist[]; total: number } }> {
    const encodedQuery = encodeURIComponent(query)
    return this.request(
      `/search?q=${encodedQuery}&type=playlist&limit=20&market=BR`,
      accessToken
    )
  }

  /**
   * Get playlist tracks
   *
   * @param accessToken - User's access token
   * @param playlistId - Playlist ID
   * @param limit - Number of tracks to return
   * @returns List of tracks in the playlist
   */
  static async getPlaylistTracks(
    accessToken: string,
    playlistId: string,
    limit: number = 50
  ): Promise<{
    items: Array<{
      track: SpotifyTrack
      added_at: string
    }>
    total: number
  }> {
    return this.request(`/playlists/${playlistId}/tracks?limit=${limit}`, accessToken)
  }

  /**
   * Get playlist details
   *
   * @param accessToken - User's access token
   * @param playlistId - Playlist ID
   * @returns Playlist details
   */
  static async getPlaylist(
    accessToken: string,
    playlistId: string
  ): Promise<SpotifyPlaylist> {
    return this.request(`/playlists/${playlistId}`, accessToken)
  }

  /**
   * Get featured worship playlists (public)
   * Uses client credentials flow for public data
   */
  static async getFeaturedWorshipPlaylists(): Promise<SpotifyPlaylist[]> {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return []
    }

    // Get client credentials token
    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')

    const tokenResponse = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    })

    if (!tokenResponse.ok) {
      return []
    }

    const { access_token } = await tokenResponse.json()

    // Search for popular worship playlists
    try {
      const result = await this.searchWorshipPlaylists(access_token, 'louvor adoracao gospel')
      return result.playlists.items.slice(0, 10)
    } catch {
      return []
    }
  }
}
