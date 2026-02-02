import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getSupervisedLeaders } from '@/actions/discipulador'
import {
  Users,
  Phone,
  Mail,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function LideresPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'DISCIPULADOR') {
    redirect('/dashboard')
  }

  const leaders = await getSupervisedLeaders()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/supervisao"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Meus Lideres</h1>
          <p className="text-muted-foreground mt-1">
            {leaders.length} {leaders.length === 1 ? 'lider' : 'lideres'} sob sua supervisao
          </p>
        </div>
      </div>

      {/* Leaders List */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="divide-y divide-border">
          {leaders.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhum lider sob sua supervisao
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Quando o pastor atribuir celulas, os lideres aparecerão aqui
              </p>
            </div>
          ) : (
            leaders.map((item) => {
              const leader = item.leader as {
                id: string
                full_name: string
                phone: string | null
                email: string | null
                photo_url: string | null
                member_stage: string
              }

              return (
                <Link
                  key={item.cellId}
                  href={`/supervisao/celulas/${item.cellId}`}
                  className="flex items-center gap-4 p-6 hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {leader?.photo_url ? (
                      <Image
                        src={leader.photo_url}
                        alt={leader.full_name || 'Lider'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Users className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">
                      {leader?.full_name || 'Sem lider'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      Celula: {item.cellName}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Supervisionando desde {new Date(item.assignedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="hidden md:block">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      item.cellStatus === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.cellStatus === 'ACTIVE' ? 'Celula Ativa' : 'Celula Inativa'}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-2">
                    {leader?.phone && (
                      <a
                        href={`https://wa.me/${leader.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                        title="WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {leader?.email && (
                      <a
                        href={`mailto:${leader.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
