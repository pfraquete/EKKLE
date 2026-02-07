import { getProfile } from '@/actions/auth'
import { getService } from '@/actions/services'
import { getServiceAttendanceByDate } from '@/actions/service-attendance'
import { getServiceChecklist } from '@/actions/service-checklist'
import { redirect, notFound } from 'next/navigation'
import { ServiceProgrammingView } from '@/components/services/service-programming-view'
import { ServiceAttendanceView } from '@/components/cultos/service-attendance-view'
import { ServiceChecklistView } from '@/components/services/service-checklist-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ClipboardList, Users, ArrowLeft, CheckSquare } from 'lucide-react'
import Link from 'next/link'

export default async function MemberDetalhesCultoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const service = await getService(id)
    if (!service) notFound()

    const isPastor = profile.role === 'PASTOR'
    const isLeader = profile.role === 'LEADER'

    if (!isPastor && !isLeader) redirect('/membro')

    // Get initial attendance data and checklist
    const [attendanceData, checklistData] = await Promise.all([
        getServiceAttendanceByDate({
            churchId: profile.church_id,
            date: service.service_date
        }),
        getServiceChecklist(id),
    ])

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Back Link */}
            <Link
                href="/membro/cultos"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Cultos
            </Link>

            <div className="flex flex-col gap-1">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">{service.title}</h1>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(service.service_date + 'T12:00:00').toLocaleDateString('pt-BR')} às {service.service_time.slice(0, 5)}
                </p>
            </div>

            <Tabs defaultValue="checklist" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl w-full sm:w-auto">
                    <TabsTrigger value="checklist" className="rounded-xl px-3 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                        <CheckSquare className="h-4 w-4 hidden sm:block" />
                        Checklist
                    </TabsTrigger>
                    <TabsTrigger value="programming" className="rounded-xl px-3 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                        <ClipboardList className="h-4 w-4 hidden sm:block" />
                        Programação
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-xl px-3 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                        <Users className="h-4 w-4 hidden sm:block" />
                        Presença
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="checklist" className="mt-0 outline-none">
                    <ServiceChecklistView
                        serviceId={id}
                        templates={checklistData.templates}
                        items={checklistData.items}
                    />
                </TabsContent>

                <TabsContent value="programming" className="mt-0 outline-none">
                    <ServiceProgrammingView service={service} />
                </TabsContent>

                <TabsContent value="attendance" className="mt-0 outline-none">
                    <ServiceAttendanceView
                        churchId={profile.church_id}
                        initialDate={service.service_date}
                        initialData={attendanceData}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
