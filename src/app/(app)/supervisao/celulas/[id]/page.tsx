import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getSupervisedCellDetails } from '@/actions/discipulador'
import {
  Users,
  Phone,
  Mail,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  MessageSquare,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AddNoteForm } from './add-note-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CelulaDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'DISCIPULADOR' && profile.role !== 'PASTOR') {
    redirect('/dashboard')
  }

  const data = await getSupervisedCellDetails(id)

  if (!data) {
    notFound()
  }

  const { cell, members, meetings, notes } = data
  const leader = cell.leader as {
    id: string
    full_name: string
    phone: string | null
    email: string | null
    photo_url: string | null
  } | null

  // Get day name
  const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  const meetingDay = cell.day_of_week !== null ? dayNames[cell.day_of_week] : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/supervisao"
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{cell.name}</h1>
            <p className="text-muted-foreground mt-1">
              Detalhes da celula supervisionada
            </p>
          </div>
        </div>

        <span className={`text-xs px-3 py-1 rounded-full ${
          cell.status === 'ACTIVE'
            ? 'bg-green-500/10 text-green-600'
            : 'bg-muted text-muted-foreground'
        }`}>
          {cell.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leader Card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">Lider</h2>

            {leader ? (
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {leader.photo_url ? (
                    <Image
                      src={leader.photo_url}
                      alt={leader.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-lg">{leader.full_name}</h3>
                  {leader.email && (
                    <p className="text-sm text-muted-foreground">{leader.email}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {leader.phone && (
                    <a
                      href={`https://wa.me/${leader.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                      title="WhatsApp"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  )}
                  {leader.email && (
                    <a
                      href={`mailto:${leader.email}`}
                      className="p-3 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      title="Email"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum lider atribuido</p>
            )}
          </div>

          {/* Cell Info */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">Informacoes</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cell.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endereco</p>
                    <p>{cell.address}</p>
                  </div>
                </div>
              )}

              {meetingDay && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dia da Reuniao</p>
                    <p>{meetingDay}</p>
                  </div>
                </div>
              )}

              {cell.meeting_time && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Horario</p>
                    <p>{cell.meeting_time}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membros</p>
                  <p>{members.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-card border border-border rounded-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-lg">Membros ({members.length})</h2>
            </div>

            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {members.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum membro na celula</p>
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {member.photo_url ? (
                        <Image
                          src={member.photo_url}
                          alt={member.full_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email || member.phone || 'Sem contato'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Meetings */}
          <div className="bg-card border border-border rounded-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-lg">Reunioes Recentes</h2>
            </div>

            <div className="divide-y divide-border">
              {meetings.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma reuniao registrada</p>
                </div>
              ) : (
                meetings.slice(0, 5).map((meeting) => {
                  const hasReport = meeting.cell_reports && Array.isArray(meeting.cell_reports) && meeting.cell_reports.length > 0

                  return (
                    <div key={meeting.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          meeting.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(meeting.date).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {meeting.status === 'COMPLETED' ? 'Concluida' : 'Em andamento'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasReport ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Relatorio enviado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="w-4 h-4" />
                            Sem relatorio
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Notes */}
        <div className="space-y-6">
          {/* Add Note */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">Adicionar Anotacao</h2>
            <AddNoteForm cellId={id} />
          </div>

          {/* Notes List */}
          <div className="bg-card border border-border rounded-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-lg">Anotacoes</h2>
            </div>

            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma anotacao</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        note.note_type === 'PRAISE' ? 'bg-green-500/10 text-green-600' :
                        note.note_type === 'CONCERN' ? 'bg-red-500/10 text-red-500' :
                        note.note_type === 'ACTION_ITEM' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {note.note_type === 'PRAISE' ? 'Elogio' :
                         note.note_type === 'CONCERN' ? 'Preocupacao' :
                         note.note_type === 'ACTION_ITEM' ? 'Acao' :
                         'Feedback'}
                      </span>
                      {note.is_private && (
                        <span className="text-xs text-muted-foreground">(privado)</span>
                      )}
                    </div>
                    <p className="text-sm">{note.note}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
