/**
 * Face Recognition Library
 *
 * Biblioteca para reconhecimento facial usando face-api.js
 * Processa faces no lado do cliente para preservar privacidade
 */

import * as faceapi from 'face-api.js'

// Types
export interface FaceDetection {
    embedding: number[]
    box: {
        x: number
        y: number
        width: number
        height: number
    }
}

export interface FaceMatch {
    profileId: string
    fullName: string
    photoUrl: string | null
    similarity: number
}

// State
let modelsLoaded = false
let isLoading = false

/**
 * Load face-api.js models
 * Models are loaded from /public/models/
 */
export async function loadModels(): Promise<void> {
    if (modelsLoaded) return
    if (isLoading) {
        // Wait for loading to complete
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        return
    }

    isLoading = true

    try {
        const MODEL_URL = '/models'

        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])

        modelsLoaded = true
        console.log('[FaceRecognition] Models loaded successfully')
    } catch (error) {
        console.error('[FaceRecognition] Failed to load models:', error)
        throw new Error('Failed to load face recognition models')
    } finally {
        isLoading = false
    }
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
    return modelsLoaded
}

/**
 * Detect all faces in an image and extract embeddings
 */
export async function detectFaces(
    imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<FaceDetection[]> {
    if (!modelsLoaded) {
        await loadModels()
    }

    const detections = await faceapi
        .detectAllFaces(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptors()

    // Get image dimensions for normalization
    const imageWidth = imageElement instanceof HTMLImageElement
        ? imageElement.naturalWidth
        : imageElement.width
    const imageHeight = imageElement instanceof HTMLImageElement
        ? imageElement.naturalHeight
        : imageElement.height

    return detections.map(detection => ({
        embedding: Array.from(detection.descriptor),
        box: {
            // Normalize coordinates to 0-1 range
            x: detection.detection.box.x / imageWidth,
            y: detection.detection.box.y / imageHeight,
            width: detection.detection.box.width / imageWidth,
            height: detection.detection.box.height / imageHeight,
        },
    }))
}

/**
 * Detect single face in an image (for profile photos)
 * Returns null if no face or multiple faces detected
 */
export async function detectSingleFace(
    imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<FaceDetection | null> {
    if (!modelsLoaded) {
        await loadModels()
    }

    const detection = await faceapi
        .detectSingleFace(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptor()

    if (!detection) {
        return null
    }

    const imageWidth = imageElement instanceof HTMLImageElement
        ? imageElement.naturalWidth
        : imageElement.width
    const imageHeight = imageElement instanceof HTMLImageElement
        ? imageElement.naturalHeight
        : imageElement.height

    return {
        embedding: Array.from(detection.descriptor),
        box: {
            x: detection.detection.box.x / imageWidth,
            y: detection.detection.box.y / imageHeight,
            width: detection.detection.box.width / imageWidth,
            height: detection.detection.box.height / imageHeight,
        },
    }
}

/**
 * Calculate euclidean distance between two embeddings
 * Lower distance = more similar faces
 */
export function calculateDistance(
    embedding1: number[],
    embedding2: number[]
): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length')
    }

    let sum = 0
    for (let i = 0; i < embedding1.length; i++) {
        sum += Math.pow(embedding1[i] - embedding2[i], 2)
    }
    return Math.sqrt(sum)
}

/**
 * Calculate similarity score between two embeddings
 * Returns value between 0-1, where 1 = identical faces
 * Uses cosine similarity
 */
export function calculateSimilarity(
    embedding1: number[],
    embedding2: number[]
): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i]
        norm1 += embedding1[i] * embedding1[i]
        norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Load an image from URL and create HTMLImageElement
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`))

        img.src = url
    })
}

/**
 * Process an image URL and detect all faces
 */
export async function processImageUrl(
    imageUrl: string
): Promise<FaceDetection[]> {
    const img = await loadImage(imageUrl)
    return detectFaces(img)
}

/**
 * Process a profile photo URL and extract single face embedding
 */
export async function processProfilePhoto(
    imageUrl: string
): Promise<FaceDetection | null> {
    const img = await loadImage(imageUrl)
    return detectSingleFace(img)
}

/**
 * Find best match for a face embedding from a list of known embeddings
 */
export function findBestMatch(
    queryEmbedding: number[],
    knownEmbeddings: Array<{ profileId: string; embedding: number[]; fullName: string; photoUrl: string | null }>,
    threshold: number = 0.6
): FaceMatch | null {
    let bestMatch: FaceMatch | null = null
    let bestSimilarity = 0

    for (const known of knownEmbeddings) {
        const similarity = calculateSimilarity(queryEmbedding, known.embedding)

        if (similarity > threshold && similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestMatch = {
                profileId: known.profileId,
                fullName: known.fullName,
                photoUrl: known.photoUrl,
                similarity,
            }
        }
    }

    return bestMatch
}
