import { getAllCellsOverview } from '@/actions/admin'
import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Plus, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function CellsPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')

    const cells = await getAllCellsOverview(profile.church_id)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Células</h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-tight">Gestão de grupos • Videira SJC</p>
                </div>
                <Link href="/celulas/nova">
                    <Button className="rounded-2xl shadow-lg h-11 px-6 font-bold">
                        <Plus className="h-5 w-5 mr-2" />
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
                                    className="flex items-center justify-between p-5 hover:bg-muted/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg
                                            ${cell.hasRecentReport ? 'bg-primary text-primary-foreground' : 'bg-amber-400 shadow-amber-200/20 text-amber-950'}
                                        `}>
                                            {cell.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{cell.name}</h4>
                                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Líder: {cell.leaderName}</p>
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
