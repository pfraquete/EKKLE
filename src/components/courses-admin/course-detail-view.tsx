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
        <Link href="/dashboard/cursos" className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <h1 className="text-3xl font-black text-foreground flex-1 tracking-tight">{course.title}</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground transition-all"
        >
          <Edit className="w-5 h-5" />
        </button>
        {canDelete && (
          <button
            onClick={handleDeleteCourse}
            className="p-2 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {editMode ? (
        <div className="bg-card rounded-3xl shadow-xl p-8 border border-border space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Título do Curso</label>
              <input type="text" value={courseData.title} onChange={(e) => setCourseData({ ...courseData, title: e.target.value })} className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground" placeholder="Título" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Descrição</label>
              <textarea value={courseData.description || ''} onChange={(e) => setCourseData({ ...courseData, description: e.target.value })} rows={3} className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none placeholder:text-muted-foreground/30 text-foreground" placeholder="Descrição" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">URL da Thumbnail</label>
              <input type="url" value={courseData.thumbnail_url || ''} onChange={(e) => setCourseData({ ...courseData, thumbnail_url: e.target.value })} className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Módulos</label>
                <input
                  type="number"
                  min={0}
                  value={courseData.modules_count}
                  onChange={(e) => setCourseData({ ...courseData, modules_count: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Início das Inscrições</label>
                <input
                  type="date"
                  value={enrollmentStartDate}
                  onChange={(e) => setEnrollmentStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_paid"
                checked={courseData.is_paid}
                onChange={(e) => setCourseData({ ...courseData, is_paid: e.target.checked })}
                className="w-5 h-5 rounded-md border-border bg-background text-primary focus:ring-primary"
              />
              <label htmlFor="is_paid" className="text-sm font-bold text-foreground">Este é um curso pago</label>
            </div>
            {courseData.is_paid && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Preço (R$)</label>
                <input
                  type="text"
                  value={priceInput}
                  onChange={(e) => {
                    const value = e.target.value
                    const parsed = Math.round(Number(value.replace(',', '.')) * 100)
                    setPriceInput(value)
                    setCourseData({ ...courseData, price_cents: Number.isNaN(parsed) ? 0 : parsed })
                  }}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              id="is_published"
              checked={courseData.is_published}
              onChange={(e) => setCourseData({ ...courseData, is_published: e.target.checked })}
              className="w-5 h-5 rounded-md border-border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="is_published" className="text-sm font-bold text-foreground">Publicado</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleUpdateCourse} className="flex-1 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Salvar Alterações
            </button>
            <button onClick={() => setEditMode(false)} className="px-8 py-4 border border-border rounded-2xl font-bold hover:bg-muted text-foreground transition-all">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-xl p-8 border border-border">
          <div className="flex items-center gap-2 mb-6">
            {course.is_published ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Publicado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground rounded-full border border-border">
                <EyeOff className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Rascunho</span>
              </div>
            )}
          </div>

          {course.description && <p className="text-foreground text-lg font-medium leading-relaxed mb-8">{course.description}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/30 rounded-2xl p-6 border border-border">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Módulos</span>
              <p className="text-lg font-bold text-foreground">{course.modules_count}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inscrições</span>
              <p className="text-lg font-bold text-foreground">{formatDate(course.enrollment_start_date)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Investimento</span>
              <p className="text-lg font-bold text-primary">{course.is_paid ? formatCurrency(course.price_cents) : 'Gratuito'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground tracking-tight">Vídeos do Curso <span className="text-muted-foreground ml-2 text-xl">({videos.length})</span></h2>
          <button
            onClick={() => { setVideoForm(true); setEditingVideo(null); setVideoData({ title: '', description: '', video_url: '', duration_seconds: 0, order_index: videos.length, is_published: false }) }}
            className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            Adicionar Aula
          </button>
        </div>

        {videoForm && (
          <div className="bg-card rounded-3xl shadow-xl p-8 border border-border animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Título da Aula</label>
                <input type="text" value={videoData.title} onChange={(e) => setVideoData({ ...videoData, title: e.target.value })} className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground" placeholder="Título do vídeo" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Descrição</label>
                <textarea value={videoData.description || ''} onChange={(e) => setVideoData({ ...videoData, description: e.target.value })} rows={2} className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none placeholder:text-muted-foreground/30 text-foreground" placeholder="O que será ensinado nesta aula?" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <UploadCloud className="w-4 h-4" />
                    Arquivo de Vídeo
                  </label>
                  {videoUploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                </div>
                <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors group relative cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleVideoUpload(file)
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-sm font-bold text-foreground">Clique ou arraste o vídeo aqui</p>
                    <p className="text-xs text-muted-foreground font-medium">MP4, WebM ou Ogg</p>
                  </div>
                </div>
                {videoUploadError && <p className="text-xs text-red-500 font-bold px-1">{videoUploadError}</p>}

                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">URL Alternativa / Caminho</label>
                  <input
                    type="text"
                    value={videoData.video_url}
                    onChange={(e) => setVideoData({ ...videoData, video_url: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                    placeholder="URL do vídeo ou caminho no Supabase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Duração (segundos)</label>
                  <input type="number" value={videoData.duration_seconds} onChange={(e) => setVideoData({ ...videoData, duration_seconds: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Ordem de Exibição</label>
                  <input type="number" value={videoData.order_index} onChange={(e) => setVideoData({ ...videoData, order_index: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <input
                  type="checkbox"
                  id="pub_video"
                  checked={videoData.is_published}
                  onChange={(e) => setVideoData({ ...videoData, is_published: e.target.checked })}
                  className="w-5 h-5 rounded-md border-border bg-background text-primary focus:ring-primary"
                />
                <label htmlFor="pub_video" className="text-sm font-bold text-foreground">Vídeo disponível para alunos</label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button onClick={handleSaveVideo} className="flex-1 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Salvar Aula
              </button>
              <button onClick={() => { setVideoForm(false); setEditingVideo(null) }} className="px-8 py-4 border border-border rounded-2xl font-bold hover:bg-muted text-foreground transition-all">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {videos.length === 0 ? (
            <div className="bg-muted/10 border-2 border-dashed border-border rounded-3xl p-12 text-center">
              <p className="text-muted-foreground font-bold">Nenhuma aula cadastrada ainda.</p>
            </div>
          ) : (
            videos.map((video, i) => (
              <div key={video.id} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5 hover:bg-muted/30 transition-all group">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{video.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded">
                      {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                    </p>
                    {!video.is_published && (
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Rascunho
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingVideo(video); setVideoData({ ...video, description: video.description || '' }); setVideoForm(true) }}
                    className="p-2.5 hover:bg-muted rounded-xl text-muted-foreground transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-xl p-8 border border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-black text-foreground flex items-center justify-center sm:justify-start gap-3 tracking-tight">
              <Users className="w-6 h-6 text-primary" />
              Gestão de Alunos
            </h2>
            <p className="text-muted-foreground font-medium mt-2 max-w-md">
              Visualize quem se inscreveu neste curso e acompanhe o progresso individual de cada aluno.
            </p>
          </div>
          <Link
            href={`/dashboard/cursos/${course.id}/inscricoes`}
            className="w-full sm:w-auto bg-foreground text-background px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Ver Inscrições
          </Link>
        </div>
      </div>
    </div>
  )
}
