'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Flame, 
  Calendar, 
  GraduationCap, 
  Church, 
  Trophy,
  TrendingUp,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberStats {
  // Bible reading
  bibleStreak: number
  longestBibleStreak: number
  chaptersRead: number
  
  // Prayer
  prayerStreak: number
  totalPrayers: number
  prayerMinutes: number
  
  // Courses
  coursesEnrolled: number
  coursesCompleted: number
  lessonsCompleted: number
  
  // Church attendance
  cultoAttendance: number
  cellAttendance: number
  eventsAttended: number
  
  // Member info
  memberSince: string
  memberStage: string
}

interface MemberDashboardStatsProps {
  stats: MemberStats
}

export function MemberDashboardStats({ stats }: MemberDashboardStatsProps) {
  // Calculate days as member
  const memberSinceDate = new Date(stats.memberSince)
  const daysSinceMember = Math.floor((Date.now() - memberSinceDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Calculate course progress
  const courseProgress = stats.coursesEnrolled > 0 
    ? Math.round((stats.coursesCompleted / stats.coursesEnrolled) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Streaks Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bible Streak */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-amber-500">
                  {stats.bibleStreak}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Dias Lendo
                </div>
              </div>
            </div>
            {stats.longestBibleStreak > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="w-3 h-3 text-amber-500/70" />
                <span>Recorde: {stats.longestBibleStreak} dias</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prayer Streak */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 rounded-xl">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-purple-500">
                  {stats.prayerStreak}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Dias Orando
                </div>
              </div>
            </div>
            {stats.totalPrayers > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 text-purple-500/70" />
                <span>{stats.totalPrayers} orações registradas</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Chapters Read */}
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-black text-foreground">{stats.chaptersRead}</div>
            <div className="text-xs text-muted-foreground font-medium">Capítulos Lidos</div>
          </CardContent>
        </Card>

        {/* Courses */}
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-black text-foreground">
              {stats.coursesCompleted}/{stats.coursesEnrolled}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Cursos Concluídos</div>
          </CardContent>
        </Card>

        {/* Culto Attendance */}
        <Card>
          <CardContent className="p-4 text-center">
            <Church className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-black text-foreground">{stats.cultoAttendance}</div>
            <div className="text-xs text-muted-foreground font-medium">Cultos (30 dias)</div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-black text-foreground">{stats.eventsAttended}</div>
            <div className="text-xs text-muted-foreground font-medium">Eventos</div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      {stats.coursesEnrolled > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Progresso nos Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{stats.lessonsCompleted} aulas concluídas</span>
                <span className="font-bold text-primary">{courseProgress}%</span>
              </div>
              <Progress value={courseProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Journey */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Sua Jornada
              </div>
              <div className="text-lg font-black text-foreground">
                {daysSinceMember} dias como membro
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Estágio: <span className="font-semibold text-primary">{stats.memberStage || 'Visitante'}</span>
              </div>
            </div>
            <div className="text-4xl font-black text-primary/20">
              🎯
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
