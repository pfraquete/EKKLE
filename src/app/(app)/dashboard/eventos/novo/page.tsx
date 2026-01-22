import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CreateEventPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/eventos">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Criar Evento ou Curso</h1>
          <p className="text-muted-foreground font-medium">Adicione uma nova programação para sua igreja.</p>
        </div>
      </div>

      <EventForm />
    </div>
  )
}
