'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    User,
    Music,
    Monitor,
    Sparkles,
    Utensils,
    Users,
    Mic2,
    Megaphone,
    Search,
    BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceProgrammingViewProps {
    service: any // The service object from Supabase
}

export function ServiceProgrammingView({ service }: ServiceProgrammingViewProps) {
    const roles = [
        {
            group: "Altar e Palavra",
            items: [
                { label: "Palavra Principal", value: service.preacher_name || service.preacher?.full_name, icon: BookOpen, color: "text-rose-500", bg: "bg-rose-50" },
                { label: "Abertura", value: service.opening?.full_name, icon: Megaphone, color: "text-sky-500", bg: "bg-sky-50" },
                { label: "Ofertas", value: service.offerings?.full_name, icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50" },
            ]
        },
        {
            group: "Louvor e Tecnologia",
            items: [
                { label: "Louvor", value: service.praise_team, icon: Music, color: "text-purple-500", bg: "bg-purple-50" },
                { label: "Mídias Digitais", value: service.media_team, icon: Monitor, color: "text-indigo-500", bg: "bg-indigo-50" },
            ]
        },
        {
            group: "Equipes de Apoio",
            items: [
                { label: "Boas-vindas", value: service.welcome_team, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
                { label: "Santa Ceia", value: service.communion_team, icon: User, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Cantina", value: service.cafeteria_team, icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" },
                { label: "Limpeza", value: service.cleaning_team, icon: Sparkles, color: "text-slate-500", bg: "bg-slate-50" },
            ]
        }
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((section, idx) => (
                    <Card key={idx} className="border-none shadow-xl overflow-hidden">
                        <CardHeader className="bg-muted/50 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                {section.group}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-muted/50">
                            {section.items.map((item, i) => (
                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", item.bg)}>
                                        <item.icon className={cn("h-5 w-5", item.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-0.5">
                                            {item.label}
                                        </p>
                                        <p className={cn(
                                            "text-sm font-bold truncate",
                                            item.value ? "text-foreground" : "text-muted-foreground/40 italic"
                                        )}>
                                            {item.value || "Não definido"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {service.description && (
                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Observações do Culto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{service.description}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
