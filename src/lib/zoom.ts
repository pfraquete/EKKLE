/**
 * Zoom API Service
 *
 * Handles communication with Zoom API for creating and managing prayer room meetings.
 *
 * Environment variables required:
 * - ZOOM_CLIENT_ID
 * - ZOOM_CLIENT_SECRET
 * - ZOOM_ACCOUNT_ID (for Server-to-Server OAuth)
 *
 * @see https://developers.zoom.us/docs/api/
 */

const ZOOM_API_BASE = 'https://api.zoom.us/v2'
const ZOOM_OAUTH_BASE = 'https://zoom.us/oauth'

const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID

// Types
export interface ZoomMeeting {
  id: number
  uuid: string
  host_id: string
  topic: string
  type: number
  status: string
  start_time?: string
  duration?: number
  timezone?: string
  created_at: string
  join_url: string
  start_url: string
  password?: string
}

export interface CreateMeetingInput {
  topic: string
  duration?: number // in minutes
  password?: string
  startTime?: string // ISO 8601 format
  timezone?: string
}

// Token cache
let accessToken: string | null = null
let tokenExpiry: number = 0

/**
 * Zoom API Service using Server-to-Server OAuth
 */
export class ZoomService {
  /**
   * Check if Zoom is configured
   */
  static isConfigured(): boolean {
    return !!(ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET && ZOOM_ACCOUNT_ID)
  }

  /**
   * Get access token using Server-to-Server OAuth
   */
  private static async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (accessToken && Date.now() < tokenExpiry - 60000) {
      return accessToken
    }

    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      throw new Error('Zoom credentials not configured')
    }

    const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')

    const response = await fetch(`${ZOOM_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: ZOOM_ACCOUNT_ID,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Zoom OAuth error:', error)
      throw new Error('Failed to get Zoom access token')
    }

    const data = await response.json()
    accessToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in * 1000)

    return data.access_token as string
  }

  /**
   * Make an authenticated request to Zoom API
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken()

    const response = await fetch(`${ZOOM_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Zoom API error:', error)
      throw new Error(error.message || `Zoom API error: ${response.status}`)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  /**
   * Create a new Zoom meeting
   *
   * @param input - Meeting details
   * @returns Created meeting info including join URL
   *
   * @example
   * ```ts
   * const meeting = await ZoomService.createMeeting({
   *   topic: 'Sala de Oracao - Igreja ABC',
   *   duration: 60,
   * });
   * console.log(meeting.join_url);
   * ```
   */
  static async createMeeting(input: CreateMeetingInput): Promise<ZoomMeeting> {
    const body: Record<string, unknown> = {
      topic: input.topic,
      type: input.startTime ? 2 : 1, // 1 = instant, 2 = scheduled
      duration: input.duration || 60,
      timezone: input.timezone || 'America/Sao_Paulo',
      settings: {
        host_video: false,
        participant_video: false,
        join_before_host: true,
        mute_upon_entry: true,
        waiting_room: false,
        audio: 'voip',
        auto_recording: 'none',
      },
    }

    if (input.startTime) {
      body.start_time = input.startTime
    }

    if (input.password) {
      body.password = input.password
    }

    const meeting = await this.request<ZoomMeeting>('/users/me/meetings', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    console.log('[Zoom] Meeting created:', {
      id: meeting.id,
      topic: meeting.topic,
      join_url: meeting.join_url,
    })

    return meeting
  }

  /**
   * Get meeting details
   *
   * @param meetingId - Zoom meeting ID
   * @returns Meeting info
   */
  static async getMeeting(meetingId: string | number): Promise<ZoomMeeting> {
    return this.request<ZoomMeeting>(`/meetings/${meetingId}`)
  }

  /**
   * Update meeting details
   *
   * @param meetingId - Zoom meeting ID
   * @param input - Updated meeting details
   */
  static async updateMeeting(
    meetingId: string | number,
    input: Partial<CreateMeetingInput>
  ): Promise<void> {
    const body: Record<string, unknown> = {}

    if (input.topic) body.topic = input.topic
    if (input.duration) body.duration = input.duration
    if (input.startTime) body.start_time = input.startTime
    if (input.timezone) body.timezone = input.timezone

    await this.request(`/meetings/${meetingId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })

    console.log('[Zoom] Meeting updated:', meetingId)
  }

  /**
   * Delete/End a meeting
   *
   * @param meetingId - Zoom meeting ID
   */
  static async deleteMeeting(meetingId: string | number): Promise<void> {
    await this.request(`/meetings/${meetingId}`, {
      method: 'DELETE',
    })

    console.log('[Zoom] Meeting deleted:', meetingId)
  }

  /**
   * End a meeting in progress
   *
   * @param meetingId - Zoom meeting ID
   */
  static async endMeeting(meetingId: string | number): Promise<void> {
    await this.request(`/meetings/${meetingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'end' }),
    })

    console.log('[Zoom] Meeting ended:', meetingId)
  }

  /**
   * Get meeting participants (for active meetings)
   *
   * @param meetingId - Zoom meeting ID
   * @returns List of participants
   */
  static async getParticipants(meetingId: string | number): Promise<{
    participants: Array<{
      id: string
      user_id: string
      user_name: string
      join_time: string
    }>
    page_count: number
    page_size: number
    total_records: number
  }> {
    return this.request(`/meetings/${meetingId}/participants`)
  }

  /**
   * Generate a random meeting password
   */
  static generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
}
