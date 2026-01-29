'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
    loadModels,
    areModelsLoaded,
    detectFaces,
    detectSingleFace,
    loadImage,
    calculateSimilarity,
    FaceDetection,
} from '@/lib/face-recognition'
import {
    saveMemberEmbedding,
    savePhotoDetections,
    getChurchEmbeddings,
    FaceDetectionData,
} from '@/actions/face-recognition'

interface UseFaceRecognitionOptions {
    autoLoadModels?: boolean
}

interface ProcessingState {
    isLoading: boolean
    isProcessing: boolean
    progress: number
    error: string | null
}

interface KnownFace {
    profileId: string
    embedding: number[]
    fullName: string
    photoUrl: string | null
}

export function useFaceRecognition(options: UseFaceRecognitionOptions = {}) {
    const { autoLoadModels = false } = options

    const [state, setState] = useState<ProcessingState>({
        isLoading: false,
        isProcessing: false,
        progress: 0,
        error: null,
    })

    const [modelsReady, setModelsReady] = useState(false)
    const knownFacesRef = useRef<KnownFace[]>([])
    const knownFacesLoadedRef = useRef(false)

    // Load models on mount if autoLoadModels is true
    useEffect(() => {
        if (autoLoadModels) {
            loadModelsAsync()
        }
    }, [autoLoadModels])

    /**
     * Load face-api.js models
     */
    const loadModelsAsync = useCallback(async () => {
        if (areModelsLoaded()) {
            setModelsReady(true)
            return true
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            await loadModels()
            setModelsReady(true)
            setState(prev => ({ ...prev, isLoading: false }))
            return true
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar modelos'
            setState(prev => ({ ...prev, isLoading: false, error: message }))
            return false
        }
    }, [])

    /**
     * Load known faces from church members
     */
    const loadKnownFaces = useCallback(async () => {
        if (knownFacesLoadedRef.current && knownFacesRef.current.length > 0) {
            return knownFacesRef.current
        }

        const result = await getChurchEmbeddings()

        if (result.success && result.data) {
            // Parse embeddings from string format to arrays
            knownFacesRef.current = result.data.map(item => ({
                ...item,
                embedding: typeof item.embedding === 'string'
                    ? JSON.parse(item.embedding.replace(/^\[|\]$/g, '').split(',').map(Number).join(','))
                    : item.embedding,
            }))
            knownFacesLoadedRef.current = true
        }

        return knownFacesRef.current
    }, [])

    /**
     * Process profile photo and save embedding
     */
    const processProfilePhoto = useCallback(async (imageUrl: string) => {
        setState(prev => ({ ...prev, isProcessing: true, error: null, progress: 0 }))

        try {
            // Ensure models are loaded
            if (!areModelsLoaded()) {
                setState(prev => ({ ...prev, progress: 10 }))
                await loadModels()
            }

            setState(prev => ({ ...prev, progress: 30 }))

            // Load and process image
            const img = await loadImage(imageUrl)
            setState(prev => ({ ...prev, progress: 50 }))

            const detection = await detectSingleFace(img)
            setState(prev => ({ ...prev, progress: 70 }))

            if (!detection) {
                setState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: 'Nenhum rosto detectado na foto',
                }))
                return { success: false, error: 'Nenhum rosto detectado' }
            }

            // Save embedding to database
            const saveResult = await saveMemberEmbedding(detection.embedding)
            setState(prev => ({ ...prev, progress: 100 }))

            if (!saveResult.success) {
                setState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: saveResult.error || 'Erro ao salvar',
                }))
                return saveResult
            }

            setState(prev => ({ ...prev, isProcessing: false }))
            return { success: true, detection }

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao processar foto'
            setState(prev => ({ ...prev, isProcessing: false, error: message }))
            return { success: false, error: message }
        }
    }, [])

    /**
     * Process album photo and save face detections
     */
    const processAlbumPhoto = useCallback(async (
        photoId: string,
        imageUrl: string
    ) => {
        setState(prev => ({ ...prev, isProcessing: true, error: null, progress: 0 }))

        try {
            // Ensure models are loaded
            if (!areModelsLoaded()) {
                setState(prev => ({ ...prev, progress: 10 }))
                await loadModels()
            }

            setState(prev => ({ ...prev, progress: 20 }))

            // Load known faces for matching
            const knownFaces = await loadKnownFaces()
            setState(prev => ({ ...prev, progress: 30 }))

            // Load and process image
            const img = await loadImage(imageUrl)
            setState(prev => ({ ...prev, progress: 50 }))

            const detections = await detectFaces(img)
            setState(prev => ({ ...prev, progress: 70 }))

            // Match each detection to known faces
            const detectionsWithMatches: FaceDetectionData[] = detections.map(detection => {
                let bestMatch: { profileId: string; confidence: number } | null = null

                for (const known of knownFaces) {
                    const similarity = calculateSimilarity(detection.embedding, known.embedding)

                    if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.confidence)) {
                        bestMatch = {
                            profileId: known.profileId,
                            confidence: similarity,
                        }
                    }
                }

                return {
                    embedding: detection.embedding,
                    box: detection.box,
                    profileId: bestMatch?.profileId,
                    confidence: bestMatch?.confidence,
                }
            })

            setState(prev => ({ ...prev, progress: 85 }))

            // Save detections to database
            const saveResult = await savePhotoDetections(photoId, detectionsWithMatches)
            setState(prev => ({ ...prev, progress: 100 }))

            if (!saveResult.success) {
                setState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: saveResult.error || 'Erro ao salvar detecções',
                }))
                return { success: false, error: saveResult.error, faceCount: 0 }
            }

            setState(prev => ({ ...prev, isProcessing: false }))
            return {
                success: true,
                faceCount: detections.length,
                matchedCount: detectionsWithMatches.filter(d => d.profileId).length,
                detections: detectionsWithMatches,
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao processar foto'
            setState(prev => ({ ...prev, isProcessing: false, error: message }))
            return { success: false, error: message, faceCount: 0 }
        }
    }, [loadKnownFaces])

    /**
     * Process multiple photos in batch
     */
    const processPhotoBatch = useCallback(async (
        photos: Array<{ id: string; url: string }>
    ) => {
        setState(prev => ({ ...prev, isProcessing: true, error: null, progress: 0 }))

        const results: Array<{
            photoId: string
            success: boolean
            faceCount: number
            matchedCount: number
        }> = []

        try {
            // Ensure models are loaded
            if (!areModelsLoaded()) {
                await loadModels()
            }

            // Load known faces once
            await loadKnownFaces()

            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i]
                const progress = Math.round(((i + 1) / photos.length) * 100)

                setState(prev => ({ ...prev, progress }))

                const result = await processAlbumPhoto(photo.id, photo.url)

                results.push({
                    photoId: photo.id,
                    success: result.success,
                    faceCount: result.faceCount || 0,
                    matchedCount: result.matchedCount || 0,
                })
            }

            setState(prev => ({ ...prev, isProcessing: false }))
            return { success: true, results }

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao processar fotos'
            setState(prev => ({ ...prev, isProcessing: false, error: message }))
            return { success: false, error: message, results }
        }
    }, [processAlbumPhoto, loadKnownFaces])

    /**
     * Reset error state
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }))
    }, [])

    return {
        // State
        isLoading: state.isLoading,
        isProcessing: state.isProcessing,
        progress: state.progress,
        error: state.error,
        modelsReady,

        // Actions
        loadModels: loadModelsAsync,
        processProfilePhoto,
        processAlbumPhoto,
        processPhotoBatch,
        loadKnownFaces,
        clearError,
    }
}
