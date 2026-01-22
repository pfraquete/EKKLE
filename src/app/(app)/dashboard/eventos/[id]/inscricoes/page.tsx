import { notFound, redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getEventRegistrants } from '@/actions/event-registrations'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Download, Users, CheckCircle, Clock, XCircle, UserCheck, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EventRegistrationsPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()

  if (!profile || (profile.role !== 'PASTOR' && profile.role !== 'LEADER')) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Get event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  // Get registrations
  const { registrants, stats } = await getEventRegistrants(id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/eventos/${id}`}
          className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o evento
        </Link>
        <h1 className="text-3xl font-bold">{event.title} - Inscrições</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as inscrições e presenças do evento
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Confirmados</span>
          </div>
          <div className="text-2xl font-bold">{stats.confirmed}</div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Lista de Espera</span>
          </div>
          <div className="text-2xl font-bold">{stats.waitlist}</div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <UserCheck className="w-4 h-4" />
            <span className="text-sm">Presentes</span>
          </div>
          <div className="text-2xl font-bold">{stats.attended}</div>
        </div>

        {event.is_paid && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Receita</span>
            </div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(stats.revenue / 100)}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/dashboard/eventos/${id}/inscricoes/export`}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Link>
        </Button>
      </div>

      {/* Registrants Table */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Inscritos ({registrants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Nome</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Telefone</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Data</th>
                <th className="text-left p-4 font-medium">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {registrants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    Nenhuma inscrição ainda
                  </td>
                </tr>
              ) : (
                registrants.map((reg: any) => (
                  <tr key={reg.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">{reg.profile.full_name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{reg.profile.email}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {reg.profile.phone || '-'}
                    </td>
                    <td className="p-4">
                      {reg.status === 'CONFIRMED' && (
                        <Badge className="bg-green-100 text-green-800">Confirmado</Badge>
                      )}
                      {reg.status === 'WAITLIST' && (
                        <Badge className="bg-amber-100 text-amber-800">Lista de Espera</Badge>
                      )}
                      {reg.status === 'CANCELLED' && (
                        <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
                      )}
                      {reg.status === 'ATTENDED' && (
                        <Badge className="bg-blue-100 text-blue-800">Presente</Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(reg.registered_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      {reg.checked_in ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
