import { getProfile } from '@/actions/auth'
import { getServices } from '@/actions/services'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Video, Calendar, Eye, EyeOff } from 'lucide-react'
import { ServiceActions } from '@/components/services/service-actions'

export default async function CultosAdminPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/dashboard')

  const services = await getServices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Cultos</h1>
          <p className="text-muted-foreground mt-2">Crie e gerencie os cultos da sua igreja</p>
        </div>
        <Link href="/dashboard/cultos/novo" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-black uppercase tracking-tighter hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Culto
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg">
          <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhum culto cadastrado</h3>
          <p className="text-muted-foreground mb-6">Comece criando seu primeiro culto</p>
          <Link href="/dashboard/cultos/novo" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />
            Criar Primeiro Culto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const typeBadgeMap: Record<string, { label: string; class: string }> = {
              PRESENCIAL: { label: 'Presencial', class: 'bg-purple-100 text-purple-800' },
              ONLINE: { label: 'Online', class: 'bg-red-100 text-red-800' },
              HIBRIDO: { label: 'Híbrido', class: 'bg-blue-100 text-blue-800' }
            }
            const typeBadge = typeBadgeMap[service.type] || { label: service.type, class: 'bg-gray-100 text-gray-800' }

            return (
              <div key={service.id} className="bg-white rounded-lg shadow-md p-6 border">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg flex-1 line-clamp-2">{service.title}</h3>
                  {service.is_published ? <Eye className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" /> : <EyeOff className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{new Date(service.service_date).toLocaleDateString('pt-BR')} às {service.service_time}</span>
                  </div>
                  <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${typeBadge.class}`}>{typeBadge.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/cultos/${service.id}`} className="flex-1 text-center bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/20 transition-colors text-sm">
                    Ver detalhes
                  </Link>
                  <ServiceActions serviceId={service.id} canDelete={profile.role === 'PASTOR'} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
