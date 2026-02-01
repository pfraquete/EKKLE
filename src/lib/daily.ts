/**
 * Daily.co Video API Service
 *
 * Provides embedded video calls directly in the app
 * No redirect to external sites - better UX than Zoom
 *
 * @see https://docs.daily.co/reference/rest-api
 */

const DAILY_API_BASE = 'https://api.daily.co/v1'
const DAILY_API_KEY = process.env.DAILY_API_KEY || ''
const DAILY_DOMAIN = process.env.DAILY_DOMAIN || '' // e.g., 'your-church' for your-church.daily.co

interface DailyRoomConfig {
    name?: string
    privacy?: 'public' | 'private'
    properties?: {
        nbf?: number // not before (unix timestamp)
        exp?: number // expires (unix timestamp)
        max_participants?: number
        enable_screenshare?: boolean
        enable_chat?: boolean
        enable_knocking?: boolean
        start_video_off?: boolean
        start_audio_off?: boolean
        lang?: string
        enable_recording?: 'cloud' | 'local' | false
        eject_at_room_exp?: boolean
    }
}

interface DailyRoom {
    id: string
    name: string
    api_created: boolean
    privacy: 'public' | 'private'
    url: string
    created_at: string
    config: {
        nbf?: number
        exp?: number
        max_participants?: number
        enable_screenshare?: boolean
        enable_chat?: boolean
        enable_knocking?: boolean
        start_video_off?: boolean
        start_audio_off?: boolean
        lang?: string
        enable_recording?: string
        eject_at_room_exp?: boolean
    }
}

interface DailyMeetingToken {
    token: string
}

interface DailyTokenConfig {
    room_name: string
    properties?: {
        user_name?: string
        user_id?: string
        is_owner?: boolean
        enable_screenshare?: boolean
        start_video_off?: boolean
        start_audio_off?: boolean
        exp?: number
        nbf?: number
        eject_at_token_exp?: boolean
    }
}

interface CreateRoomInput {
    name?: string
    expiresAt?: Date
    startsAt?: Date
    maxParticipants?: number
    enableRecording?: boolean
    enableChat?: boolean
    enableScreenshare?: boolean
    isPrivate?: boolean
}

interface CreateTokenInput {
    roomName: string
    userName: string
    odUserId?: string
    isOwner?: boolean
    expiresAt?: Date
}

export class DailyService {
    /**
     * Check if Daily.co is properly configured
     */
    static isConfigured(): boolean {
        return !!(DAILY_API_KEY && DAILY_DOMAIN)
    }

    /**
     * Get the base domain URL
     */
    static getDomainUrl(): string {
        return `https://${DAILY_DOMAIN}.daily.co`
    }

    /**
     * Make authenticated request to Daily API
     */
    private static async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        if (!this.isConfigured()) {
            throw new Error('Daily.co não está configurado. Verifique DAILY_API_KEY e DAILY_DOMAIN.')
        }

        const response = await fetch(`${DAILY_API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(
                `Daily API error: ${response.status} - ${error.error || error.info || 'Unknown error'}`
            )
        }

        return response.json()
    }

    /**
     * Create a new video room
     */
    static async createRoom(input: CreateRoomInput = {}): Promise<DailyRoom> {
        const config: DailyRoomConfig = {
            privacy: input.isPrivate ? 'private' : 'public',
            properties: {
                max_participants: input.maxParticipants || 100,
                enable_screenshare: input.enableScreenshare ?? true,
                enable_chat: input.enableChat ?? true,
                enable_knocking: input.isPrivate ?? false,
                start_video_off: false,
                start_audio_off: true, // Mute on entry like Zoom
                lang: 'pt',
                enable_recording: input.enableRecording ? 'cloud' : false,
                eject_at_room_exp: true,
            },
        }

        // Optional: custom room name (otherwise Daily generates one)
        if (input.name) {
            // Sanitize name: only alphanumeric, dash, underscore
            config.name = input.name
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 128)
        }

        // Set time constraints
        if (input.startsAt) {
            config.properties!.nbf = Math.floor(input.startsAt.getTime() / 1000)
        }
        if (input.expiresAt) {
            config.properties!.exp = Math.floor(input.expiresAt.getTime() / 1000)
        }

        return this.request<DailyRoom>('/rooms', {
            method: 'POST',
            body: JSON.stringify(config),
        })
    }

    /**
     * Get room details
     */
    static async getRoom(roomName: string): Promise<DailyRoom> {
        return this.request<DailyRoom>(`/rooms/${roomName}`)
    }

    /**
     * Delete a room
     */
    static async deleteRoom(roomName: string): Promise<{ deleted: boolean; name: string }> {
        return this.request(`/rooms/${roomName}`, {
            method: 'DELETE',
        })
    }

    /**
     * Create a meeting token for a participant
     * Tokens provide user identity and permissions
     */
    static async createMeetingToken(input: CreateTokenInput): Promise<string> {
        const config: DailyTokenConfig = {
            room_name: input.roomName,
            properties: {
                user_name: input.userName,
                user_id: input.odUserId,
                is_owner: input.isOwner ?? false,
                enable_screenshare: true,
                start_video_off: false,
                start_audio_off: true,
                eject_at_token_exp: true,
            },
        }

        // Token expires in 24 hours by default, or at specified time
        if (input.expiresAt) {
            config.properties!.exp = Math.floor(input.expiresAt.getTime() / 1000)
        } else {
            config.properties!.exp = Math.floor(Date.now() / 1000) + 86400 // 24 hours
        }

        const result = await this.request<DailyMeetingToken>('/meeting-tokens', {
            method: 'POST',
            body: JSON.stringify(config),
        })

        return result.token
    }

    /**
     * Get the full room URL for embedding or direct access
     */
    static getRoomUrl(roomName: string, token?: string): string {
        const baseUrl = `${this.getDomainUrl()}/${roomName}`
        if (token) {
            return `${baseUrl}?t=${token}`
        }
        return baseUrl
    }

    /**
     * Generate a random room name
     */
    static generateRoomName(prefix: string = 'sala'): string {
        const randomPart = Math.random().toString(36).substring(2, 10)
        const timestamp = Date.now().toString(36)
        return `${prefix}-${randomPart}-${timestamp}`.substring(0, 128)
    }

    /**
     * List all active rooms
     */
    static async listRooms(limit: number = 50): Promise<{ data: DailyRoom[] }> {
        return this.request<{ data: DailyRoom[] }>(`/rooms?limit=${limit}`)
    }

    /**
     * Get active participants in a room
     */
    static async getPresence(roomName: string): Promise<{
        total_count: number
        data: Array<{
            id: string
            user_id: string
            user_name: string
            join_time: string
            duration: number
        }>
    }> {
        return this.request(`/rooms/${roomName}/presence`)
    }
}

export type { DailyRoom, CreateRoomInput, CreateTokenInput }
