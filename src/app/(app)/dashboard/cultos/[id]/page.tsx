import { getProfile } from '@/actions/auth'
import { getService } from '@/actions/services'
import { getServiceAttendanceByDate } from '@/actions/service-attendance'
import { redirect, notFound } from 'next/navigation'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceProgrammingView } from '@/components/services/service-programming-view'
import { ServiceAttendanceView } from '@/components/cultos/service-attendance-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ClipboardList, Users, Settings } from 'lucide-react'

export default async function DetalhesCultoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const service = await getService(id)
  if (!service) notFound()

  const isPastor = profile.role === 'PASTOR'
  const isLeader = profile.role === 'LEADER'

  if (!isPastor && !isLeader) redirect('/dashboard')

  // Get initial attendance data
  const attendanceData = await getServiceAttendanceByDate({
    churchId: profile.church_id,
    date: service.service_date
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-foreground">{service.title}</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {new Date(service.service_date + 'T12:00:00').toLocaleDateString('pt-BR')} às {service.service_time.slice(0, 5)}
        </p>
      </div>

      <Tabs defaultValue="programming" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="programming" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-2">
            <ClipboardList className="h-4 w-4" />
            Programação
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-2">
            <Users className="h-4 w-4" />
            Presença
          </TabsTrigger>
          {isPastor && (
            <TabsTrigger value="edit" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold gap-2">
              <Settings className="h-4 w-4" />
              Editar Culto
            </TabsTrigger>
          )}
        </TabsList>

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

        {isPastor && (
          <TabsContent value="edit" className="mt-0 outline-none">
            <ServiceForm service={service} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
