import { getAllCellsOverview } from '@/actions/admin'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Plus, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function CellsPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')

    const cells = await getAllCellsOverview()

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">Células</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-tight">Gestão de grupos • Ekkle</p>
                </div>
                <Link href="/celulas/nova">
                    <Button className="rounded-2xl shadow-lg h-10 sm:h-11 px-4 sm:px-6 font-bold text-sm w-full sm:w-auto">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Nova Célula
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-card">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {cells.length === 0 ? (
                            <div className="p-20 text-center">
                                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">Nenhuma célula cadastrada.</p>
                            </div>
                        ) : (
                            cells.map(cell => (
                                <Link
                                    key={cell.id}
                                    href={`/celulas/${cell.id}`}
                                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-all group min-h-[72px]"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div className={`
                                            w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white shadow-lg flex-shrink-0
                                            ${cell.hasRecentReport ? 'bg-primary text-primary-foreground' : 'bg-amber-400 shadow-amber-200/20 text-amber-950'}
                                        `}>
                                            {cell.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-foreground text-sm sm:text-base truncate">{cell.name}</h4>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5 truncate">Líder: {cell.leaderName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-sm font-bold text-foreground">{cell.membersCount} membros</p>
                                            {cell.lastMeetingDate && (
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                                    {format(new Date(cell.lastMeetingDate), "dd MMM", { locale: ptBR })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {cell.hasRecentReport ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Clock className="h-5 w-5 text-amber-500" />
                                            )}
                                            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
