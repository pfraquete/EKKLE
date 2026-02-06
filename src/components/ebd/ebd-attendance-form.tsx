'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'
import { recordEbdAttendance, EbdAttendanceRecord } from '@/actions/ebd'

interface Student {
    id: string
    full_name: string
    photo_url: string | null
    email: string | null
}

interface EbdAttendanceFormProps {
    lessonId: string
    students: Student[]
    existingAttendance: EbdAttendanceRecord[]
}

export function EbdAttendanceForm({ lessonId, students, existingAttendance }: EbdAttendanceFormProps) {
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)

    // Initialize attendance state from existing records
    const initialState: Record<string, boolean> = {}
    students.forEach(s => {
        const existing = existingAttendance.find(a => a.profile_id === s.id)
        initialState[s.id] = existing?.present ?? false
    })
    const [attendance, setAttendance] = useState<Record<string, boolean>>(initialState)

    const handleToggle = (profileId: string) => {
        setAttendance(prev => ({ ...prev, [profileId]: !prev[profileId] }))
    }

    const handleSelectAll = () => {
        const allPresent = students.every(s => attendance[s.id])
        const newState: Record<string, boolean> = {}
        students.forEach(s => { newState[s.id] = !allPresent })
        setAttendance(newState)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const records = students.map(s => ({
                profileId: s.id,
                present: attendance[s.id] || false,
            }))

            const result = await recordEbdAttendance(lessonId, records)
            if (result.success) {
                toast({ title: 'Presença registrada', description: 'A frequência foi salva com sucesso.' })
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao salvar presença', variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    const presentCount = Object.values(attendance).filter(Boolean).length

    if (students.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum aluno matriculado nesta classe. Matricule alunos primeiro.
            </p>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{presentCount}</span> de {students.length} presentes
                </div>
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {students.every(s => attendance[s.id]) ? 'Desmarcar todos' : 'Marcar todos'}
                </Button>
            </div>

            <div className="divide-y divide-border rounded-xl border">
                {students.map(student => (
                    <label
                        key={student.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={student.photo_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {student.full_name?.[0] || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{student.full_name}</span>
                        </div>
                        <Checkbox
                            checked={attendance[student.id] || false}
                            onCheckedChange={() => handleToggle(student.id)}
                        />
                    </label>
                ))}
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Presença
                    </>
                )}
            </Button>
        </div>
    )
}
