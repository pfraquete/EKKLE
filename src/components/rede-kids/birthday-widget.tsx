'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cake, ChevronRight, Gift } from 'lucide-react'

interface Birthday {
    id: string
    full_name: string
    birth_date: string
}

interface BirthdayWidgetProps {
    birthdays: Birthday[]
}

function calculateAge(birthDate: string): number {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age + 1 // Idade que vai fazer
}

function formatBirthdayDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short'
    })
}

export function BirthdayWidget({ birthdays }: BirthdayWidgetProps) {
    if (birthdays.length === 0) {
        return null
    }

    // Sort by day of month
    const sortedBirthdays = [...birthdays].sort((a, b) => {
        const dayA = new Date(a.birth_date).getDate()
        const dayB = new Date(b.birth_date).getDate()
        return dayA - dayB
    })

    const displayBirthdays = sortedBirthdays.slice(0, 5)

    return (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-border">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Cake className="w-5 h-5 text-amber-600" />
                        </div>
                        Aniversariantes do Mes
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-700 border-amber-300">
                        {birthdays.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {displayBirthdays.map((birthday) => (
                        <Link
                            key={birthday.id}
                            href={`/rede-kids/criancas/${birthday.id}`}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                    {birthday.full_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{birthday.full_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Faz {calculateAge(birthday.birth_date)} anos
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    <Gift className="w-3 h-3 mr-1" />
                                    {formatBirthdayDate(birthday.birth_date)}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
                {birthdays.length > 5 && (
                    <div className="p-3 border-t border-border bg-muted/30">
                        <Link
                            href="/rede-kids/criancas"
                            className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                            Ver todos os {birthdays.length} aniversariantes
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
