'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, UploadCloud, Loader2, Users } from 'lucide-react'
import { adminUpdateCourse, adminDeleteCourse, adminCreateVideo, adminUpdateVideo, adminDeleteVideo, adminUploadCourseVideo } from '@/actions/courses-admin'

type Course = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  order_index: number
  modules_count: number
  is_paid: boolean
  price_cents: number
  enrollment_start_date: string | null
}
type Video = { id: string; title: string; description: string | null; video_url: string; duration_seconds: number; order_index: number; is_published: boolean }

export function CourseDetailView({ course, videos, canDelete }: { course: Course; videos: Video[]; canDelete: boolean }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [videoForm, setVideoForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [courseData, setCourseData] = useState(course)
  const [videoData, setVideoData] = useState({ title: '', description: '', video_url: '', duration_seconds: 0, order_index: videos.length, is_published: false })
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoUploadError, setVideoUploadError] = useState('')
  const [priceInput, setPriceInput] = useState(course.price_cents ? (course.price_cents / 100).toFixed(2) : '')
  const [enrollmentStartDate, setEnrollmentStartDate] = useState(
    course.enrollment_start_date ? new Date(course.enrollment_start_date).toISOString().split('T')[0] : ''
  )

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : 'Sem data definida'

  const handleUpdateCourse = async () => {
    const result = await adminUpdateCourse(course.id, {
      ...courseData,
      description: courseData.description || undefined,
      thumbnail_url: courseData.thumbnail_url || undefined,
      price_cents: courseData.is_paid ? courseData.price_cents : 0,
      enrollment_start_date: enrollmentStartDate || undefined,
    })
    if (result.success) { setEditMode(false); router.refresh() }
    else alert(result.error)
  }

  const handleDeleteCourse = async () => {
    if (!confirm('Excluir este curso e todos os vídeos?')) return
    const result = await adminDeleteCourse(course.id)
    if (result.success) router.push('/dashboard/cursos')
    else alert(result.error)
  }

  const handleSaveVideo = async () => {
    const result = editingVideo
      ? await adminUpdateVideo(editingVideo.id, videoData)
      : await adminCreateVideo(course.id, videoData)
    if (result.success) { setVideoForm(false); setEditingVideo(null); router.refresh() }
    else alert(result.error)
  }

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Excluir este vídeo?')) return
    const result = await adminDeleteVideo(id)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  const handleVideoUpload = async (file: File) => {
    setVideoUploading(true)
    setVideoUploadError('')
    const result = await adminUploadCourseVideo(course.id, file)
    if (result.success && result.path) {
      setVideoData((prev) => ({ ...prev, video_url: result.path }))
    } else {
      setVideoUploadError(result.error || 'Erro ao fazer upload do vídeo')
    }
    setVideoUploading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cursos" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-3xl font-bold flex-1">{course.title}</h1>
        <button onClick={() => setEditMode(!editMode)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Edit className="w-5 h-5" />
        </button>
        {canDelete && <button onClick={handleDeleteCourse} className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-5 h-5" /></button>}
      </div>

      {editMode ? (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <input type="text" value={courseData.title} onChange={(e) => setCourseData({ ...courseData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Título" />
          <textarea value={courseData.description || ''} onChange={(e) => setCourseData({ ...courseData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Descrição" />
          <input type="url" value={courseData.thumbnail_url || ''} onChange={(e) => setCourseData({ ...courseData, thumbnail_url: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="URL da Thumbnail" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              min={0}
              value={courseData.modules_count}
              onChange={(e) => setCourseData({ ...courseData, modules_count: Number(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Quantidade de módulos"
            />
            <input
              type="date"
              value={enrollmentStartDate}
              onChange={(e) => setEnrollmentStartDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={courseData.is_paid}
                onChange={(e) => setCourseData({ ...courseData, is_paid: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold">Curso pago</label>
            </div>
            {courseData.is_paid && (
              <input
                type="text"
                value={priceInput}
                onChange={(e) => {
                  const value = e.target.value
                  const parsed = Math.round(Number(value.replace(',', '.')) * 100)
                  setPriceInput(value)
                  setCourseData({ ...courseData, price_cents: Number.isNaN(parsed) ? 0 : parsed })
                }}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Preço (R$)"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={courseData.is_published} onChange={(e) => setCourseData({ ...courseData, is_published: e.target.checked })} className="w-4 h-4" />
            <label className="text-sm font-semibold">Publicado</label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUpdateCourse} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold">Salvar</button>
            <button onClick={() => setEditMode(false)} className="px-6 py-2 border rounded-lg">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            {course.is_published ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
            <span className="text-sm font-semibold">{course.is_published ? 'Publicado' : 'Não publicado'}</span>
          </div>
          {course.description && <p className="text-gray-700">{course.description}</p>}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <div><span className="font-semibold text-gray-800">Módulos:</span> {course.modules_count}</div>
            <div><span className="font-semibold text-gray-800">Inscrições:</span> {formatDate(course.enrollment_start_date)}</div>
            <div><span className="font-semibold text-gray-800">Tipo:</span> {course.is_paid ? `Pago (${formatCurrency(course.price_cents)})` : 'Gratuito'}</div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Vídeos ({videos.length})</h2>
          <button onClick={() => { setVideoForm(true); setEditingVideo(null); setVideoData({ title: '', description: '', video_url: '', duration_seconds: 0, order_index: videos.length, is_published: false }) }} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-bold">
            <Plus className="w-5 h-5" />
            Adicionar Vídeo
          </button>
        </div>

        {videoForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
            <input type="text" value={videoData.title} onChange={(e) => setVideoData({ ...videoData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Título do vídeo" />
            <textarea value={videoData.description} onChange={(e) => setVideoData({ ...videoData, description: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg" placeholder="Descrição" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <UploadCloud className="w-4 h-4" />
                  Upload da aula
                </label>
                {videoUploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void handleVideoUpload(file)
                  }
                }}
                className="w-full"
              />
              {videoUploadError && <p className="text-sm text-red-600">{videoUploadError}</p>}
              <input
                type="text"
                value={videoData.video_url}
                onChange={(e) => setVideoData({ ...videoData, video_url: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="URL do vídeo (Supabase Storage path)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={videoData.duration_seconds} onChange={(e) => setVideoData({ ...videoData, duration_seconds: parseInt(e.target.value) })} className="px-4 py-2 border rounded-lg" placeholder="Duração (segundos)" />
              <input type="number" value={videoData.order_index} onChange={(e) => setVideoData({ ...videoData, order_index: parseInt(e.target.value) })} className="px-4 py-2 border rounded-lg" placeholder="Ordem" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={videoData.is_published} onChange={(e) => setVideoData({ ...videoData, is_published: e.target.checked })} className="w-4 h-4" />
              <label className="text-sm font-semibold">Publicar vídeo</label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveVideo} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold">Salvar Vídeo</button>
              <button onClick={() => { setVideoForm(false); setEditingVideo(null) }} className="px-6 py-2 border rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {videos.map((video, i) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">{i + 1}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{video.title}</h3>
                <p className="text-sm text-gray-600">{video.duration_seconds}s</p>
              </div>
              {video.is_published ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
              <button onClick={() => { setEditingVideo(video); setVideoData({ ...video, description: video.description || '' }); setVideoForm(true) }} className="p-2 hover:bg-gray-100 rounded"><Edit className="w-4 h-4" /></button>
              {canDelete && <button onClick={() => handleDeleteVideo(video.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Inscrições
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe a lista de inscritos e o progresso geral do curso.
            </p>
          </div>
          <Link
            href={`/dashboard/cursos/${course.id}/inscricoes`}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-semibold"
          >
            Ver inscrições
          </Link>
        </div>
      </div>
    </div>
  )
}
