import { getDepartmentById } from '@/actions/departments'
import { getProfile, getChurchMembers } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, Edit, Users, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { DepartmentMembersList } from '@/components/departments/department-members-list'
import { AddMemberDialog } from '@/components/departments/add-member-dialog'

interface DepartmentDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function DepartmentDetailPage({ params }: DepartmentDetailPageProps) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile || profile.role !== 'PASTOR') redirect('/dashboard')
    if (!(await isModuleEnabled('departments'))) redirect('/dashboard')

    const data = await getDepartmentById(id)
    if (!data) redirect('/departamentos')

    const { department, members } = data
    const churchMembers = await getChurchMembers()
    const existingMemberIds = members.map(m => m.profile_id)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/departamentos">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-black text-foreground">{department.name}</h1>
                            <Badge variant={department.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {department.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                        {department.description && (
                            <p className="text-sm text-muted-foreground mt-1">{department.description}</p>
                        )}
                    </div>
                </div>
                {profile.role === 'PASTOR' && (
                    <Link href={`/departamentos/${id}/editar`}>
                        <Button variant="outline" className="rounded-2xl">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                )}
            </div>

            {/* Leader Card */}
            {department.leader && (
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-primary" />
                            Líder do Departamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={department.leader.photo_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {department.leader.full_name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold">{department.leader.full_name}</p>
                                <p className="text-sm text-muted-foreground">Líder</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Members Card */}
            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Membros ({members.length})
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {profile.role === 'PASTOR' && (
                        <AddMemberDialog
                            departmentId={id}
                            availableMembers={churchMembers}
                            existingMemberIds={existingMemberIds}
                        />
                    )}
                    <DepartmentMembersList departmentId={id} members={members} />
                </CardContent>
            </Card>
        </div>
    )
}
