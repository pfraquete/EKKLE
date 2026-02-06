import { getEbdClassById } from '@/actions/ebd'
import { getProfile, getChurchMembers } from '@/actions/auth'
import { isModuleEnabled } from '@/actions/church-modules'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, Edit, Users, BookOpen, GraduationCap, Calendar } from 'lucide-react'
import Link from 'next/link'
import { EbdStudentsList } from '@/components/ebd/ebd-students-list'
import { EbdLessonsList } from '@/components/ebd/ebd-lessons-list'

interface EbdClassDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function EbdClassDetailPage({ params }: EbdClassDetailPageProps) {
    const { id } = await params
    const profile = await getProfile()
    if (!profile) redirect('/login')
    if (!(await isModuleEnabled('ebd'))) redirect('/dashboard')

    const data = await getEbdClassById(id)
    if (!data) redirect('/ebd')

    const { ebdClass, students, lessons } = data
    const churchMembers = await getChurchMembers()

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/ebd">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-black text-foreground">{ebdClass.title}</h1>
                            {!ebdClass.is_published && <Badge variant="secondary">Rascunho</Badge>}
                        </div>
                        {ebdClass.description && (
                            <p className="text-sm text-muted-foreground mt-1">{ebdClass.description}</p>
                        )}
                    </div>
                </div>
                {profile.role === 'PASTOR' && (
                    <Link href={`/ebd/${id}/editar`}>
                        <Button variant="outline" className="rounded-2xl">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                )}
            </div>

            {/* Teacher Info */}
            {ebdClass.teacher && (
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={ebdClass.teacher.photo_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {ebdClass.teacher.full_name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-sm">{ebdClass.teacher.full_name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" /> Professor(a)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardContent className="p-4 text-center">
                        <Users className="h-6 w-6 text-primary mx-auto mb-1" />
                        <p className="text-2xl font-black">{students.length}</p>
                        <p className="text-xs text-muted-foreground">Alunos</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardContent className="p-4 text-center">
                        <Calendar className="h-6 w-6 text-primary mx-auto mb-1" />
                        <p className="text-2xl font-black">{lessons.length}</p>
                        <p className="text-xs text-muted-foreground">Lições</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="students" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Alunos
                    </TabsTrigger>
                    <TabsTrigger value="lessons" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Lições
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="students">
                    <Card className="border-none shadow-lg rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Alunos Matriculados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EbdStudentsList
                                courseId={id}
                                students={students}
                                availableMembers={churchMembers}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="lessons">
                    <Card className="border-none shadow-lg rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Lições e Frequência</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EbdLessonsList courseId={id} lessons={lessons} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
