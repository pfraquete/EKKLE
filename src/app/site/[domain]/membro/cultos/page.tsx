import { getProfile } from '@/actions/auth'
import { getServices } from '@/actions/services'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Video, Calendar, Eye, EyeOff } from 'lucide-react'

export default async function MemberCultosPage() {
    const profile = await getProfile()
    if (!profile) redirect('/entrar')
    if (profile.role !== 'PASTOR' && profile.role !== 'LEADER') redirect('/membro')

    const services = await getServices()

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-foreground">Cultos</h1>
                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                    Programação e presença • Ekkle
                </p>
            </div>

            {services.length === 0 ? (
                <div className="text-center py-12 bg-muted/40 rounded-3xl">
                    <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum culto cadastrado</h3>
                    <p className="text-muted-foreground">Os cultos aparecerão aqui quando forem criados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => {
                        const typeBadgeMap: Record<string, { label: string; class: string }> = {
                            PRESENCIAL: { label: 'Presencial', class: 'bg-purple-500/10 text-purple-500' },
                            ONLINE: { label: 'Online', class: 'bg-red-500/10 text-red-500' },
                            HIBRIDO: { label: 'Híbrido', class: 'bg-blue-500/10 text-blue-500' }
                        }
                        const typeBadge = typeBadgeMap[service.type] || { label: service.type, class: 'bg-muted text-muted-foreground' }

                        return (
                            <Link
                                key={service.id}
                                href={`/membro/cultos/${service.id}`}
                                className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-bold text-foreground flex-1 line-clamp-2">{service.title}</h3>
                                    {service.is_published ? (
                                        <Eye className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span>
                                            {new Date(service.service_date).toLocaleDateString('pt-BR')} às {service.service_time}
                                        </span>
                                    </div>
                                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${typeBadge.class}`}>
                                        {typeBadge.label}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
