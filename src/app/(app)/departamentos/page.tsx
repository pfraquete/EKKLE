import { getDepartments } from '@/actions/departments'
import { getProfile } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Plus, ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'

export default async function DepartmentsPage() {
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('departments'))) redirect('/dashboard')

    const departments = await getDepartments()

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">Departamentos</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-tight">Gestão de departamentos • Ekkle</p>
                </div>
                <Link href="/departamentos/novo">
                    <Button className="rounded-2xl shadow-lg h-10 sm:h-11 px-4 sm:px-6 font-bold text-sm w-full sm:w-auto">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Novo Departamento
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-card">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {departments.length === 0 ? (
                            <div className="p-20 text-center">
                                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">Nenhum departamento cadastrado.</p>
                                <p className="text-sm text-muted-foreground mt-1">Crie o primeiro departamento da sua igreja.</p>
                            </div>
                        ) : (
                            departments.map(dept => (
                                <Link
                                    key={dept.id}
                                    href={`/departamentos/${dept.id}`}
                                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-all group min-h-[72px]"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white shadow-lg flex-shrink-0"
                                            style={{ backgroundColor: dept.color || '#D4AF37' }}
                                        >
                                            {dept.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-foreground text-sm sm:text-base truncate">{dept.name}</h4>
                                            {dept.leader && (
                                                <p className="text-xs sm:text-xs text-muted-foreground font-medium mt-0.5 truncate">
                                                    Líder: {dept.leader.full_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:flex items-center gap-2 text-right">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm font-bold text-foreground">{dept.members_count} membros</p>
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
