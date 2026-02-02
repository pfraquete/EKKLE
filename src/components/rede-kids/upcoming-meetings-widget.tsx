'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Home, BookOpen, ChevronRight, PlayCircle } from 'lucide-react'

interface KidsMeeting {
    id: string
    kids_cell_id: string
    meeting_date: string
    meeting_time: string | null
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
    theme: string | null
    kids_cell?: {
        id: string
        name: string
    } | null
}

interface UpcomingMeetingsWidgetProps {
    meetings: KidsMeeting[]
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    })
}

function formatTime(timeStr: string | null): string {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
}

export function UpcomingMeetingsWidget({ meetings }: UpcomingMeetingsWidgetProps) {
    if (meetings.length === 0) {
        return (
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-blue-500/5 border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        Proximas Reunioes
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                        Nenhuma reuniao agendada
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        As reunioes agendadas aparecerao aqui
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-blue-500/5 border-b border-border">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        Proximas Reunioes
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-700 border-blue-300">
                        {meetings.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {meetings.map((meeting) => (
                        <Link
                            key={meeting.id}
                            href={`/rede-kids/celulas/${meeting.kids_cell_id}/reunioes/${meeting.id}`}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    meeting.status === 'IN_PROGRESS'
                                        ? 'bg-amber-500/20'
                                        : 'bg-blue-500/10'
                                }`}>
                                    {meeting.status === 'IN_PROGRESS' ? (
                                        <PlayCircle className="w-5 h-5 text-amber-600" />
                                    ) : (
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-foreground capitalize">
                                            {formatDate(meeting.meeting_date)}
                                        </p>
                                        {meeting.meeting_time && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(meeting.meeting_time)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Home className="h-3 w-3" />
                                            {meeting.kids_cell?.name || 'Celula'}
                                        </span>
                                        {meeting.theme && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 truncate max-w-[150px]">
                                                    <BookOpen className="h-3 w-3" />
                                                    {meeting.theme}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`text-xs ${
                                    meeting.status === 'IN_PROGRESS'
                                        ? 'bg-amber-500/20 text-amber-700'
                                        : 'bg-blue-500/10 text-blue-600'
                                }`}>
                                    {meeting.status === 'IN_PROGRESS' ? 'Em andamento' : 'Agendada'}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
