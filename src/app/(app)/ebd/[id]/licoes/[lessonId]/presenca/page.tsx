import { getEbdClassById, getEbdAttendance } from '@/actions/ebd'
import { getProfile } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { EbdAttendanceForm } from '@/components/ebd/ebd-attendance-form'

interface PresencaPageProps {
    params: Promise<{ id: string; lessonId: string }>
}

export default async function PresencaPage({ params }: PresencaPageProps) {
    const { id, lessonId } = await params
    const profile = await getProfile()
    if (!profile) redirect('/login')
    if (!(await isModuleEnabled('ebd'))) redirect('/dashboard')

    const data = await getEbdClassById(id)
    if (!data) redirect('/ebd')

    const { ebdClass, students, lessons } = data
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) redirect(`/ebd/${id}`)

    const attendance = await getEbdAttendance(lessonId)

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href={`/ebd/${id}`}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">Presença</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {ebdClass.title} • {lesson.title}
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Registrar Frequência
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <EbdAttendanceForm
                        lessonId={lessonId}
                        students={students}
                        existingAttendance={attendance}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
