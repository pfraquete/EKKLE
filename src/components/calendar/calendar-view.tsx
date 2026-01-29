'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { EventData } from '@/actions/admin'

interface CalendarViewProps {
    initialEvents: EventData[]
}

export function CalendarView({ initialEvents }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events] = useState<EventData[]>(initialEvents)

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { locale: ptBR })
    const endDate = endOfWeek(monthEnd, { locale: ptBR })

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white">
                <div>
                    <CardTitle className="text-xl font-black capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">
                        Calendário da Igreja
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full h-8 w-8 border-2">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full h-8 w-8 border-2">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-[320px]">
                    <div className="grid grid-cols-7 border-b bg-muted/30">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                            <div key={i} className="py-2 text-center text-[10px] sm:text-xs uppercase font-black text-muted-foreground tracking-widest">
                                <span className="sm:hidden">{day}</span>
                                <span className="hidden sm:inline">{['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][i]}</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 border-l border-t">
                        {days.map((day) => {
                            const dayEvents = events.filter(e => isSameDay(new Date(e.start_date), day))
                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "min-h-[60px] sm:min-h-[100px] border-r border-b p-1 sm:p-2 transition-colors hover:bg-muted/10",
                                        !isSameMonth(day, monthStart) && "bg-muted/20 text-muted-foreground",
                                        isSameDay(day, new Date()) && "bg-blue-50/50"
                                    )}
                                >
                                    <span className={cn(
                                        "text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-0.5 sm:mb-1",
                                        isSameDay(day, new Date()) && "bg-blue-600 text-white"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="space-y-0.5 sm:space-y-1">
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    "text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-md font-bold truncate cursor-pointer transition-transform active:scale-95",
                                                    event.event_type === 'SERVICE' ? "bg-indigo-100 text-indigo-700 border-l-2 border-indigo-500" :
                                                        event.event_type === 'EVENT' ? "bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500" :
                                                            "bg-amber-100 text-amber-700 border-l-2 border-amber-500"
                                                )}
                                            >
                                                <span className="hidden sm:inline">{format(new Date(event.start_date), 'HH:mm')} • </span>{event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[8px] text-muted-foreground font-bold">+{dayEvents.length - 2}</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
