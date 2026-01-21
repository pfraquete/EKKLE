export const dynamic = 'force-dynamic'

import { getProfile } from '@/actions/auth'
import { getEvents } from '@/actions/admin'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/calendar/calendar-view'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function CalendarPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const events = await getEvents(profile.church_id)

    return (
        <div className="p-6 pb-24 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Calendário</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">Agenda de Cultos e Eventos • Ekkle</p>
                </div>
                {profile.role === 'PASTOR' && (
                    <Button className="rounded-2xl shadow-lg h-11 px-6 font-bold">
                        <Plus className="h-5 w-5 mr-2" />
                        Novo Evento
                    </Button>
                )}
            </div>

            <CalendarView initialEvents={events} />
        </div>
    )
}
