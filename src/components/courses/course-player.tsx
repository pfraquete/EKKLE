'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, CheckCircle, Clock } from 'lucide-react'
import { updateVideoProgress } from '@/actions/courses'
import { useChurchNavigation } from '@/hooks/use-church-navigation'
import { CommentSection } from '@/components/courses/comment-section'

type Profile = {
  id: string
  role: string
  full_name: string
}

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
  profile: Profile
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
  profile,
}: CoursePlayerProps) {
  const { push } = useChurchNavigation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const progressUpdateInterval = useRef<NodeJS.Timeout | undefined>(undefined)

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
  }, [currentVideo.id, currentProgress])

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
    push(`/membro/cursos/${course.id}?video=${video.id}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Video Player */}
      <div className="lg:col-span-3 space-y-8">
        <div className="bg-card rounded-[2.5rem] border border-border/50 overflow-hidden shadow-2xl">
          {/* Video */}
          <div className="relative bg-black aspect-video group">
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
          <div className="p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-black text-foreground tracking-tighter leading-tight mb-2">{currentVideo.title}</h1>
                <div className="flex items-center gap-4">
                  {currentProgress?.completed ? (
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                      <CheckCircle className="w-4 h-4" />
                      <span>Concluído</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>
                        {currentProgress
                          ? `${formatDuration(currentProgress.watched_seconds)} assistido`
                          : 'Não iniciado'}
                      </span>
                    </div>
                  )}
                  <div className="w-px h-3 bg-border" />
                  {currentVideo.duration_seconds > 0 && (
                    <span className="text-muted-foreground/60 font-black uppercase tracking-widest text-[10px]">
                      Duração: {formatDuration(currentVideo.duration_seconds)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="bg-muted px-4 py-2 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Aula {currentVideo.order_index + 1} de {videos.length}</span>
                </div>
              </div>
            </div>

            {currentVideo.description && (
              <p className="text-muted-foreground font-medium leading-[1.8] whitespace-pre-wrap max-w-4xl">
                {currentVideo.description}
              </p>
            )}
          </div>
        </div>

        {/* Interaction Area */}
        <div className="bg-card/50 rounded-[2.5rem] border border-border/40 p-10">
          <CommentSection
            videoId={currentVideo.id}
            userId={profile.id}
            userRole={profile.role}
          />
        </div>
      </div>

      {/* Video List Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-2xl sticky top-8 overflow-hidden">
          <div className="p-8 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">Conteúdo</h2>
              <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                {enrollment.progress_percentage}%
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                style={{ width: `${enrollment.progress_percentage}%` }}
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-250px)] overflow-y-auto no-scrollbar">
            {videos.map((video, index) => {
              const progress = progressMap.get(video.id)
              const isActive = video.id === currentVideo.id
              const isCompleted = progress?.completed

              return (
                <button
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className={`w-full text-left p-6 border-b border-border/40 last:border-0 transition-all duration-500 hover:bg-muted/30 ${isActive ? 'bg-primary/5' : ''
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black tracking-widest transition-all duration-500 ${isCompleted
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                          : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-black text-sm mb-1 line-clamp-2 leading-snug transition-colors ${isActive ? 'text-primary' : 'text-foreground'
                          }`}
                      >
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {video.duration_seconds > 0 && (
                          <span>{formatDuration(video.duration_seconds)}</span>
                        )}
                        {progress && !progress.completed && (
                          <>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="text-primary italic">{formatDuration(progress.watched_seconds)} visto</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isActive && isPlaying && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-0.5 h-3 bg-primary animate-[bounce_1s_infinite]" />
                        <div className="w-0.5 h-4 bg-primary animate-[bounce_1s_infinite_0.2s]" />
                        <div className="w-0.5 h-2 bg-primary animate-[bounce_1s_infinite_0.4s]" />
                      </div>
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
