'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Baby,
    Users,
    UserPlus,
    Save,
    Loader2,
    Plus,
    X,
    Phone
} from 'lucide-react'
import { bulkMarkAttendance, addVisitor, removeAttendance, KidsAttendance } from '@/actions/kids-attendance'
import { KidsChild } from '@/actions/kids-children'
import { toast } from 'sonner'

interface KidsNetworkMember {
    id: string
    profile: {
        id: string
        full_name: string
        photo_url: string | null
    }
    kids_role: string
}

interface AttendanceFormProps {
    meetingId: string
    cellId: string
    children: KidsChild[]
    volunteers: KidsNetworkMember[]
    presentChildIds: string[]
    presentVolunteerIds: string[]
    visitors: KidsAttendance[]
}

export function AttendanceForm({
    meetingId,
    cellId,
    children,
    volunteers,
    presentChildIds,
    presentVolunteerIds,
    visitors: initialVisitors
}: AttendanceFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set(presentChildIds))
    const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set(presentVolunteerIds))
    const [visitors, setVisitors] = useState<KidsAttendance[]>(initialVisitors)
    const [visitorDialogOpen, setVisitorDialogOpen] = useState(false)
    const [newVisitor, setNewVisitor] = useState({ name: '', phone: '' })

    const toggleChild = (childId: string) => {
        const newSet = new Set(selectedChildren)
        if (newSet.has(childId)) {
            newSet.delete(childId)
        } else {
            newSet.add(childId)
        }
        setSelectedChildren(newSet)
    }

    const toggleVolunteer = (volunteerId: string) => {
        const newSet = new Set(selectedVolunteers)
        if (newSet.has(volunteerId)) {
            newSet.delete(volunteerId)
        } else {
            newSet.add(volunteerId)
        }
        setSelectedVolunteers(newSet)
    }

    const handleSave = async () => {
        startTransition(async () => {
            const result = await bulkMarkAttendance(meetingId, {
                childIds: Array.from(selectedChildren),
                volunteerIds: Array.from(selectedVolunteers),
            })

            if (result.success) {
                toast.success('Presenca salva com sucesso!')
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao salvar presenca')
            }
        })
    }

    const handleAddVisitor = async () => {
        if (!newVisitor.name.trim()) {
            toast.error('Digite o nome do visitante')
            return
        }

        startTransition(async () => {
            const result = await addVisitor({
                meeting_id: meetingId,
                visitor_name: newVisitor.name.trim(),
                visitor_parent_phone: newVisitor.phone.trim() || null,
            })

            if (result.success) {
                toast.success('Visitante adicionado!')
                setNewVisitor({ name: '', phone: '' })
                setVisitorDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao adicionar visitante')
            }
        })
    }

    const handleRemoveVisitor = async (attendanceId: string) => {
        startTransition(async () => {
            const result = await removeAttendance(attendanceId)

            if (result.success) {
                setVisitors(prev => prev.filter(v => v.id !== attendanceId))
                toast.success('Visitante removido')
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao remover visitante')
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Children */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-amber-500/5 border-b border-border">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-lg">
                            <Baby className="w-5 h-5 text-amber-500" />
                            Criancas ({selectedChildren.size}/{children.length})
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {children.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            Nenhuma crianca cadastrada nesta celula
                        </p>
                    ) : (
                        <div className="grid gap-2">
                            {children.map(child => (
                                <label
                                    key={child.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                        selectedChildren.has(child.id)
                                            ? 'bg-amber-500/10 border-2 border-amber-500'
                                            : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                                    }`}
                                >
                                    <Checkbox
                                        checked={selectedChildren.has(child.id)}
                                        onCheckedChange={() => toggleChild(child.id)}
                                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{child.full_name}</p>
                                        {child.birth_date && (
                                            <p className="text-xs text-muted-foreground">
                                                {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} anos
                                            </p>
                                        )}
                                    </div>
                                    {child.allergies && (
                                        <span className="text-xs px-2 py-1 bg-red-500/10 text-red-600 rounded">
                                            Alergia
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Volunteers */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-blue-500/5 border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-blue-500" />
                        Voluntarios ({selectedVolunteers.size}/{volunteers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {volunteers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            Nenhum voluntario nesta celula
                        </p>
                    ) : (
                        <div className="grid gap-2">
                            {volunteers.map(member => (
                                <label
                                    key={member.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                        selectedVolunteers.has(member.profile.id)
                                            ? 'bg-blue-500/10 border-2 border-blue-500'
                                            : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                                    }`}
                                >
                                    <Checkbox
                                        checked={selectedVolunteers.has(member.profile.id)}
                                        onCheckedChange={() => toggleVolunteer(member.profile.id)}
                                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{member.profile.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{member.kids_role}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Visitors */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-green-500/5 border-b border-border">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-lg">
                            <UserPlus className="w-5 h-5 text-green-500" />
                            Visitantes ({visitors.length})
                        </div>
                        <Dialog open={visitorDialogOpen} onOpenChange={setVisitorDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="rounded-lg">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Adicionar
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Adicionar Visitante</DialogTitle>
                                    <DialogDescription>
                                        Registre uma crianca visitante
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="visitor_name">Nome da Crianca *</Label>
                                        <Input
                                            id="visitor_name"
                                            value={newVisitor.name}
                                            onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="visitor_phone" className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            Telefone do Responsavel
                                        </Label>
                                        <Input
                                            id="visitor_phone"
                                            value={newVisitor.phone}
                                            onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setVisitorDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleAddVisitor} disabled={isPending}>
                                        {isPending ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4 mr-2" />
                                        )}
                                        Adicionar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {visitors.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            Nenhum visitante registrado
                        </p>
                    ) : (
                        <div className="grid gap-2">
                            {visitors.map(visitor => (
                                <div
                                    key={visitor.id}
                                    className="flex items-center justify-between gap-3 p-3 bg-green-500/10 rounded-xl"
                                >
                                    <div>
                                        <p className="font-medium">{visitor.visitor_name}</p>
                                        {visitor.visitor_parent_phone && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {visitor.visitor_parent_phone}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleRemoveVisitor(visitor.id)}
                                        disabled={isPending}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={isPending}
                className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg"
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Salvando...
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5 mr-2" />
                        Salvar Presenca
                    </>
                )}
            </Button>
        </div>
    )
}
