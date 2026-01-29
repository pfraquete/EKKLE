'use client'

import Image from 'next/image'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'

interface AttendanceRecord {
    id: string
    student_id: string
    joined_at: string
    left_at?: string | null
    is_online: boolean
    watch_time_seconds: number
    is_present_valid: boolean
    student?: {
        full_name: string
        photo_url?: string | null
    }
}

interface AttendanceListProps {
    attendance: AttendanceRecord[]
    isLive: boolean
}

export function AttendanceList({ attendance, isLive }: AttendanceListProps) {
    const formatWatchTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}min`
        }
        return `${minutes}min`
    }

    if (attendance.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
                <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                    {isLive
                        ? 'Aguardando alunos entrarem na aula...'
                        : 'Nenhum aluno registrado na presença'
                    }
                </p>
            </div>
        )
    }

    const onlineStudents = attendance.filter(a => a.is_online)
    const offlineStudents = attendance.filter(a => !a.is_online)

    return (
        <div className="space-y-6">
            {/* Online Students */}
            {isLive && onlineStudents.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Online Agora ({onlineStudents.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {onlineStudents.map((record) => (
                            <div
                                key={record.id}
                                className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3"
                            >
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                                    {record.student?.photo_url ? (
                                        <Image
                                            src={record.student.photo_url}
                                            alt={record.student.full_name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground truncate text-sm">
                                        {record.student?.full_name || 'Aluno'}
                                    </p>
                                    <p className="text-xs text-emerald-500">
                                        {formatWatchTime(record.watch_time_seconds)} assistindo
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Students (when not live) or Offline students (when live) */}
            {(!isLive || offlineStudents.length > 0) && (
                <div>
                    {isLive && (
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                            Saíram ({offlineStudents.length})
                        </h4>
                    )}
                    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Aluno
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">
                                        Entrou
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Tempo
                                    </th>
                                    {!isLive && (
                                        <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            Presença
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(isLive ? offlineStudents : attendance).map((record) => (
                                    <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                                                    {record.student?.photo_url ? (
                                                        <Image
                                                            src={record.student.photo_url}
                                                            alt={record.student.full_name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <Users className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-foreground truncate">
                                                    {record.student?.full_name || 'Aluno'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                                            {new Date(record.joined_at).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                                            {formatWatchTime(record.watch_time_seconds)}
                                        </td>
                                        {!isLive && (
                                            <td className="px-4 py-3 text-center">
                                                {record.is_present_valid ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Presente
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded-lg text-xs font-bold">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Ausente
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLive && (
                <p className="text-sm text-muted-foreground text-center">
                    A presença é considerada válida se o aluno assistiu mais de 70% da aula.
                </p>
            )}
        </div>
    )
}
