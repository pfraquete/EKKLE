import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getKidsCell } from '@/actions/kids-cells'
import { getKidsMeetingById } from '@/actions/kids-meetings'
import { getKidsChildren } from '@/actions/kids-children'
import { getKidsNetworkMembers } from '@/actions/kids-network'
import { getAttendanceByMeeting, getPresentIdsForMeeting } from '@/actions/kids-attendance'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Baby,
    Users,
    UserPlus,
    Calendar,
    CheckCircle,
    Save
} from 'lucide-react'
import { AttendanceForm } from './attendance-form'

interface Props {
    params: Promise<{ id: string; meetingId: string }>
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

export default async function AttendancePage({ params }: Props) {
    const { id: cellId, meetingId } = await params
    const profile = await getProfile()

    if (!profile) {
        redirect('/login')
    }

    if (profile.role !== 'PASTOR' && !profile.is_kids_network) {
        redirect('/dashboard')
    }

    const [cell, meeting] = await Promise.all([
        getKidsCell(cellId),
        getKidsMeetingById(meetingId)
    ])

    if (!cell || !meeting) {
        notFound()
    }

    // Get all children and volunteers for this cell
    const [cellChildren, allMembers, attendance, presentIds] = await Promise.all([
        getKidsChildren({ cellId }),
        getKidsNetworkMembers(),
        getAttendanceByMeeting(meetingId),
        getPresentIdsForMeeting(meetingId)
    ])

    const cellVolunteers = allMembers.filter(m => m.kids_cell_id === cellId)

    const isPastor = profile.role === 'PASTOR'
    const isPastoraKids = profile.kids_role === 'PASTORA_KIDS'
    const isDiscipuladoraKids = profile.kids_role === 'DISCIPULADORA_KIDS'
    const isLeaderKids = profile.kids_role === 'LEADER_KIDS'
    const canManage = isPastor || isPastoraKids || isDiscipuladoraKids || isLeaderKids

    const isEditable = meeting.status === 'IN_PROGRESS' || meeting.status === 'COMPLETED'

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/rede-kids/celulas/${cellId}/reunioes/${meetingId}`}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground">Registro de Presenca</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {cell.name} - {formatDate(meeting.meeting_date)}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Baby className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{attendance.totalChildren}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Criancas</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{attendance.totalVolunteers}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Voluntarios</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <UserPlus className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{attendance.totalVisitors}</p>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Visitantes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Form */}
            {canManage && isEditable ? (
                <AttendanceForm
                    meetingId={meetingId}
                    cellId={cellId}
                    children={cellChildren}
                    volunteers={cellVolunteers}
                    presentChildIds={presentIds.childIds}
                    presentVolunteerIds={presentIds.volunteerIds}
                    visitors={attendance.visitors}
                />
            ) : (
                <>
                    {/* Read-only view */}
                    {!isEditable && (
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardContent className="p-4">
                                <p className="text-sm text-amber-700 font-medium">
                                    A reuniao precisa estar em andamento ou finalizada para registrar presenca.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Children Present */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-amber-500/5 border-b border-border">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Baby className="w-5 h-5 text-amber-500" />
                                Criancas Presentes ({attendance.totalChildren})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {attendance.children.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    Nenhuma crianca registrada
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {attendance.children.map(a => (
                                        <div key={a.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="font-medium">{a.child?.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Volunteers Present */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-blue-500/5 border-b border-border">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="w-5 h-5 text-blue-500" />
                                Voluntarios Presentes ({attendance.totalVolunteers})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {attendance.volunteers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    Nenhum voluntario registrado
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {attendance.volunteers.map(a => (
                                        <div key={a.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="font-medium">{a.volunteer?.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Visitors */}
                    {attendance.visitors.length > 0 && (
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-green-500/5 border-b border-border">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <UserPlus className="w-5 h-5 text-green-500" />
                                    Visitantes ({attendance.totalVisitors})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    {attendance.visitors.map(a => (
                                        <div key={a.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <div>
                                                <span className="font-medium">{a.visitor_name}</span>
                                                {a.visitor_parent_phone && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {a.visitor_parent_phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
