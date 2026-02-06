import { getEbdClasses } from '@/actions/ebd'
import { getProfile } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, ChevronRight, Users, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default async function EbdPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('ebd'))) redirect('/dashboard')

    const classes = await getEbdClasses()

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">Escola Bíblica Dominical</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-tight">Gestão de classes e frequência • Ekkle</p>
                </div>
                <Link href="/ebd/nova">
                    <Button className="rounded-2xl shadow-lg h-10 sm:h-11 px-4 sm:px-6 font-bold text-sm w-full sm:w-auto">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Nova Classe
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-card">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {classes.length === 0 ? (
                            <div className="p-20 text-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">Nenhuma classe da EBD cadastrada.</p>
                                <p className="text-sm text-muted-foreground mt-1">Crie a primeira classe da sua escola bíblica.</p>
                            </div>
                        ) : (
                            classes.map(cls => (
                                <Link
                                    key={cls.id}
                                    href={`/ebd/${cls.id}`}
                                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-all group min-h-[72px]"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white shadow-lg flex-shrink-0 bg-primary text-primary-foreground">
                                            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-foreground text-sm sm:text-base truncate">{cls.title}</h4>
                                                {!cls.is_published && <Badge variant="secondary" className="text-xs">Rascunho</Badge>}
                                            </div>
                                            {cls.teacher && (
                                                <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">
                                                    Professor: {cls.teacher.full_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:flex items-center gap-4 text-right">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-bold">{cls.students_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-bold">{cls.lessons_count}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
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
