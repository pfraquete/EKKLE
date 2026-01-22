'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { adminUpdateCourse, adminDeleteCourse, adminCreateVideo, adminUpdateVideo, adminDeleteVideo } from '@/actions/courses-admin'

type Course = { id: string; title: string; description: string | null; thumbnail_url: string | null; is_published: boolean; order_index: number }
type Video = { id: string; title: string; description: string | null; video_url: string; duration_seconds: number; order_index: number; is_published: boolean }

export function CourseDetailView({ course, videos, canDelete }: { course: Course; videos: Video[]; canDelete: boolean }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [videoForm, setVideoForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [courseData, setCourseData] = useState(course)
  const [videoData, setVideoData] = useState({ title: '', description: '', video_url: '', duration_seconds: 0, order_index: videos.length, is_published: false })

  const handleUpdateCourse = async () => {
    const result = await adminUpdateCourse(course.id, {
      ...courseData,
      description: courseData.description || undefined,
      thumbnail_url: courseData.thumbnail_url || undefined,
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
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={courseData.is_published} onChange={(e) => setCourseData({ ...courseData, is_published: e.target.checked })} className="w-4 h-4" />
            <label className="text-sm font-semibold">Publicado</label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUpdateCourse} className="bg-primary text-white px-6 py-2 rounded-lg">Salvar</button>
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
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Vídeos ({videos.length})</h2>
          <button onClick={() => { setVideoForm(true); setEditingVideo(null); setVideoData({ title: '', description: '', video_url: '', duration_seconds: 0, order_index: videos.length, is_published: false }) }} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Vídeo
          </button>
        </div>

        {videoForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
            <input type="text" value={videoData.title} onChange={(e) => setVideoData({ ...videoData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Título do vídeo" />
            <textarea value={videoData.description} onChange={(e) => setVideoData({ ...videoData, description: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg" placeholder="Descrição" />
            <input type="text" value={videoData.video_url} onChange={(e) => setVideoData({ ...videoData, video_url: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="URL do vídeo (Supabase Storage path)" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={videoData.duration_seconds} onChange={(e) => setVideoData({ ...videoData, duration_seconds: parseInt(e.target.value) })} className="px-4 py-2 border rounded-lg" placeholder="Duração (segundos)" />
              <input type="number" value={videoData.order_index} onChange={(e) => setVideoData({ ...videoData, order_index: parseInt(e.target.value) })} className="px-4 py-2 border rounded-lg" placeholder="Ordem" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={videoData.is_published} onChange={(e) => setVideoData({ ...videoData, is_published: e.target.checked })} className="w-4 h-4" />
              <label className="text-sm font-semibold">Publicar vídeo</label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveVideo} className="bg-primary text-white px-6 py-2 rounded-lg">Salvar Vídeo</button>
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
    </div>
  )
}
