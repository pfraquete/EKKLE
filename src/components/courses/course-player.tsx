'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { updateVideoProgress } from '@/actions/courses'

type Course = {
  id: string
  title: string
  description: string | null
}

type Video = {
  id: string
  title: string
  description: string | null
  video_url: string
  duration_seconds: number
  order_index: number
}

type Enrollment = {
  id: string
  progress_percentage: number
  completed_at: string | null
}

type VideoProgress = {
  id: string
  video_id: string
  watched_seconds: number
  completed: boolean
  last_watched_at: string
}

type CoursePlayerProps = {
  course: Course
  videos: Video[]
  currentVideo: Video
  enrollment: Enrollment
  videoProgress: VideoProgress[]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export function CoursePlayer({
  course,
  videos,
  currentVideo,
  enrollment,
  videoProgress,
}: CoursePlayerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const progressUpdateInterval = useRef<NodeJS.Timeout>()

  // Create progress map
  const progressMap = new Map(videoProgress.map((p) => [p.video_id, p]))
  const currentProgress = progressMap.get(currentVideo.id)

  // Get video URL from Supabase Storage
  const videoUrl = currentVideo.video_url.startsWith('http')
    ? currentVideo.video_url
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${currentVideo.video_url}`

  // Load saved progress when video loads
  useEffect(() => {
    if (videoRef.current && currentProgress) {
      videoRef.current.currentTime = currentProgress.watched_seconds
    }
  }, [currentVideo.id])

  // Setup progress tracking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [currentVideo.id])

  // Save progress periodically
  useEffect(() => {
    if (isPlaying) {
      progressUpdateInterval.current = setInterval(() => {
        const watchedSeconds = Math.floor(currentTime)
        const completed = duration > 0 && currentTime / duration > 0.9 // 90% watched = completed

        updateVideoProgress({
          enrollmentId: enrollment.id,
          videoId: currentVideo.id,
          watchedSeconds,
          completed,
        })
      }, 5000) // Save every 5 seconds
    } else {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
    }

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
    }
  }, [isPlaying, currentTime, duration, currentVideo.id, enrollment.id])

  const handleVideoSelect = (video: Video) => {
    router.push(`/membro/cursos/${course.id}?video=${video.id}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Video */}
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full"
              controlsList="nodownload"
            >
              Seu navegador não suporta vídeo HTML5.
            </video>
          </div>

          {/* Video Info */}
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{currentVideo.title}</h1>
            {currentVideo.description && (
              <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                {currentVideo.description}
              </p>
            )}

            {/* Progress */}
            <div className="flex items-center gap-4 text-sm">
              {currentProgress?.completed ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Concluído</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>
                    {currentProgress
                      ? `${formatDuration(currentProgress.watched_seconds)} assistido`
                      : 'Não iniciado'}
                  </span>
                </div>
              )}
              {currentVideo.duration_seconds > 0 && (
                <span className="text-gray-400">
                  Duração: {formatDuration(currentVideo.duration_seconds)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-2">{course.title}</h2>
          {course.description && (
            <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
          )}
        </div>
      </div>

      {/* Video List Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-lg sticky top-4">
          <div className="p-6 border-b">
            <h2 className="font-bold text-lg mb-2">Conteúdo do Curso</h2>
            <div className="text-sm text-gray-600">
              {enrollment.progress_percentage}% concluído
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${enrollment.progress_percentage}%` }}
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {videos.map((video, index) => {
              const progress = progressMap.get(video.id)
              const isActive = video.id === currentVideo.id
              const isCompleted = progress?.completed

              return (
                <button
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : isActive
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-sm mb-1 line-clamp-2 ${
                          isActive ? 'text-primary' : ''
                        }`}
                      >
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {video.duration_seconds > 0 && (
                          <span>{formatDuration(video.duration_seconds)}</span>
                        )}
                        {progress && !progress.completed && (
                          <span>• {formatDuration(progress.watched_seconds)} assistido</span>
                        )}
                      </div>
                    </div>
                    {isActive && isPlaying && (
                      <Play className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
