'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Cake, Gift, PartyPopper } from 'lucide-react'
import { format, isToday, isSameMonth, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CellMember {
    id: string
    full_name: string
    photo_url: string | null
    birth_date: string | null
}

interface CellBirthdaysProps {
    members: CellMember[]
}

export function CellBirthdays({ members }: CellBirthdaysProps) {
    const currentMonth = new Date()
    const currentYear = currentMonth.getFullYear()

    // Filter members with birthdays this month
    const birthdaysThisMonth = members
        .filter(member => {
            if (!member.birth_date) return false
            const birthDate = parseISO(member.birth_date)
            return isSameMonth(birthDate, currentMonth)
        })
        .map(member => {
            const birthDate = parseISO(member.birth_date!)
            // Create a date for this year's birthday
            const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
            const daysUntil = differenceInDays(birthdayThisYear, new Date())
            const isBirthdayToday = isToday(birthdayThisYear)
            
            return {
                ...member,
                birthDate,
                birthdayThisYear,
                daysUntil,
                isBirthdayToday
            }
        })
        .sort((a, b) => a.birthdayThisYear.getTime() - b.birthdayThisYear.getTime())

    const monthName = format(currentMonth, 'MMMM', { locale: ptBR })

    return (
        <Card className="border-border/40 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-6 border-b border-border/40">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 lg:p-4 bg-pink-500/10 rounded-xl sm:rounded-2xl">
                        <Cake className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tighter italic uppercase">
                            Aniversariantes
                        </h3>
                        <p className="text-xs sm:text-xs text-muted-foreground font-black uppercase tracking-wider sm:tracking-widest">
                            {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                        </p>
                    </div>
                </div>
            </div>

            <CardContent className="p-4 sm:p-6 lg:p-10">
                {birthdaysThisMonth.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 lg:py-16 bg-muted/20 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 border-dashed border-border/60">
                        <Cake className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-xs sm:text-sm text-muted-foreground font-black uppercase tracking-wider sm:tracking-[0.2em] italic">
                            Nenhum aniversariante este mês
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {birthdaysThisMonth.map((member) => (
                            <div
                                key={member.id}
                                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors ${
                                    member.isBirthdayToday
                                        ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 border-2 border-pink-500/30 animate-pulse'
                                        : 'bg-muted/30 border border-border/40 hover:bg-muted/40'
                                }`}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-border">
                                        <AvatarImage src={member.photo_url || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                            {member.full_name?.[0] || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    {member.isBirthdayToday && (
                                        <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-1">
                                            <PartyPopper className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground text-sm sm:text-base truncate">
                                        {member.full_name}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {format(member.birthDate, "d 'de' MMMM", { locale: ptBR })}
                                    </p>
                                </div>

                                <div className="flex-shrink-0">
                                    {member.isBirthdayToday ? (
                                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 font-bold text-xs animate-bounce">
                                            <Gift className="h-3 w-3 mr-1" />
                                            HOJE!
                                        </Badge>
                                    ) : member.daysUntil > 0 ? (
                                        <Badge variant="outline" className="text-xs font-medium">
                                            em {member.daysUntil} {member.daysUntil === 1 ? 'dia' : 'dias'}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs font-medium bg-muted">
                                            já passou
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
