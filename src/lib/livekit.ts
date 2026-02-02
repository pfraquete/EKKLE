import { AccessToken, EgressClient, RoomServiceClient, StreamOutput, StreamProtocol } from 'livekit-server-sdk'

// =====================================================
// LIVEKIT CONFIGURATION
// =====================================================

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || ''
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || ''
const LIVEKIT_URL = process.env.LIVEKIT_URL || ''

// Validate environment variables
function validateEnv() {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    console.warn('LiveKit environment variables not configured')
    return false
  }
  return true
}

// Get WebSocket URL from environment URL
function getWsUrl(): string {
  // LIVEKIT_URL should be like: wss://your-app.livekit.cloud
  return LIVEKIT_URL
}

// Get HTTP URL for API calls
function getHttpUrl(): string {
  // Convert wss:// to https:// for API calls
  return LIVEKIT_URL.replace('wss://', 'https://')
}

// =====================================================
// ROOM SERVICE CLIENT
// =====================================================

let roomServiceClient: RoomServiceClient | null = null

export function getRoomServiceClient(): RoomServiceClient | null {
  if (!validateEnv()) return null

  if (!roomServiceClient) {
    roomServiceClient = new RoomServiceClient(
      getHttpUrl(),
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    )
  }
  return roomServiceClient
}

// =====================================================
// EGRESS CLIENT (for RTMP streaming)
// =====================================================

let egressClient: EgressClient | null = null

export function getEgressClient(): EgressClient | null {
  if (!validateEnv()) return null

  if (!egressClient) {
    egressClient = new EgressClient(
      getHttpUrl(),
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    )
  }
  return egressClient
}

// =====================================================
// TOKEN GENERATION
// =====================================================

export interface TokenOptions {
  roomName: string
  participantName: string
  participantIdentity: string
  metadata?: string
  canPublish?: boolean
  canSubscribe?: boolean
}

/**
 * Generate a LiveKit access token for a participant
 */
export async function generateToken(options: TokenOptions): Promise<string | null> {
  if (!validateEnv()) return null

  const {
    roomName,
    participantName,
    participantIdentity,
    metadata,
    canPublish = true,
    canSubscribe = true,
  } = options

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    metadata,
  })

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe,
    canPublishData: true,
  })

  return await token.toJwt()
}

/**
 * Generate a broadcaster token (can publish video/audio)
 */
export async function generateBroadcasterToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string | null> {
  return generateToken({
    roomName,
    participantIdentity: userId,
    participantName: userName,
    canPublish: true,
    canSubscribe: true,
  })
}

/**
 * Generate a viewer token (can only subscribe)
 */
export async function generateViewerToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string | null> {
  return generateToken({
    roomName,
    participantIdentity: userId,
    participantName: userName,
    canPublish: false,
    canSubscribe: true,
  })
}

// =====================================================
// ROOM MANAGEMENT
// =====================================================

/**
 * Create a new room
 */
export async function createRoom(roomName: string): Promise<boolean> {
  const client = getRoomServiceClient()
  if (!client) return false

  try {
    await client.createRoom({
      name: roomName,
      emptyTimeout: 60 * 10, // 10 minutes
      maxParticipants: 100,
    })
    return true
  } catch (error) {
    console.error('Error creating LiveKit room:', error)
    return false
  }
}

/**
 * Delete a room
 */
export async function deleteRoom(roomName: string): Promise<boolean> {
  const client = getRoomServiceClient()
  if (!client) return false

  try {
    await client.deleteRoom(roomName)
    return true
  } catch (error) {
    console.error('Error deleting LiveKit room:', error)
    return false
  }
}

/**
 * List participants in a room
 */
export async function listParticipants(roomName: string) {
  const client = getRoomServiceClient()
  if (!client) return []

  try {
    const participants = await client.listParticipants(roomName)
    return participants
  } catch (error) {
    console.error('Error listing participants:', error)
    return []
  }
}

// =====================================================
// EGRESS (RTMP STREAMING)
// =====================================================

export interface EgressOptions {
  roomName: string
  rtmpUrl: string
  streamKey: string
}

/**
 * Start RTMP egress from a room to Mux
 */
export async function startRtmpEgress(options: EgressOptions): Promise<string | null> {
  const client = getEgressClient()
  if (!client) return null

  const { roomName, rtmpUrl, streamKey } = options
  const fullUrl = `${rtmpUrl}/${streamKey}`

  try {
    const streamOutput = new StreamOutput({
      protocol: StreamProtocol.RTMP,
      urls: [fullUrl],
    })

    const egress = await client.startRoomCompositeEgress(
      roomName,
      streamOutput,
      {
        layout: 'speaker',
        audioOnly: false,
        videoOnly: false,
      }
    )
    return egress.egressId
  } catch (error) {
    console.error('Error starting RTMP egress:', error)
    return null
  }
}

/**
 * Stop an egress
 */
export async function stopEgress(egressId: string): Promise<boolean> {
  const client = getEgressClient()
  if (!client) return false

  try {
    await client.stopEgress(egressId)
    return true
  } catch (error) {
    console.error('Error stopping egress:', error)
    return false
  }
}

/**
 * Get egress info
 */
export async function getEgressInfo(egressId: string) {
  const client = getEgressClient()
  if (!client) return null

  try {
    const egresses = await client.listEgress({ egressId })
    return egresses[0] || null
  } catch (error) {
    console.error('Error getting egress info:', error)
    return null
  }
}

// =====================================================
// CONSTANTS
// =====================================================

export const LIVEKIT_WS_URL = LIVEKIT_URL

// Mux RTMP URL for egress
export const MUX_RTMP_URL = 'rtmps://global-live.mux.com:443/app'
