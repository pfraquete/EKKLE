import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Phone, Calendar, AtSign, ChevronRight } from 'lucide-react'
import { ProfilePhotoUpload } from '@/components/profile/profile-photo-upload'
import { NicknameForm } from '@/components/chat'
import { MemberDashboardStats } from '@/components/membro/member-dashboard-stats'
import { getMemberStats } from '@/actions/member-stats'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function MembroPage() {
  try {
    const church = await getChurch()
    const supabase = await createClient()

    if (!church) {
      redirect('/')
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Get user profile - use maybeSingle to avoid PGRST116 error when profile doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[MembroPage] Error fetching profile:', profileError)
      redirect('/login')
    }

    if (!profile) {
      console.error('[MembroPage] Profile not found for user:', user.id)
      redirect('/login')
    }

    // Get member stats
    const statsResult = await getMemberStats()
    const stats = statsResult.success ? statsResult.stats : null

    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Profile Header with Photo */}
        <div className="flex items-center gap-4 sm:gap-6">
          <ProfilePhotoUpload
            currentPhotoUrl={profile?.photo_url || null}
            userName={profile?.full_name || 'Usuário'}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight truncate">
              {profile?.full_name || 'Meu Perfil'}
            </h1>
            {profile?.nickname && (
              <p className="text-sm sm:text-base text-primary font-bold mt-0.5">
                @{profile.nickname}
              </p>
            )}
            <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
              Acompanhe seu crescimento espiritual
            </p>
          </div>
        </div>

        {/* Dashboard Stats */}
        {stats && (
          <MemberDashboardStats stats={stats} />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/membro/biblia-oracao">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 rounded-2xl">
              <span className="text-2xl">📖</span>
              <span className="text-xs font-bold uppercase tracking-wider">Bíblia e Oração</span>
            </Button>
          </Link>
          <Link href="/membro/cursos">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 rounded-2xl">
              <span className="text-2xl">🎓</span>
              <span className="text-xs font-bold uppercase tracking-wider">Meus Cursos</span>
            </Button>
          </Link>
        </div>

        {/* Profile Information */}
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl">
          <div className="bg-muted/30 border-b border-border p-4 sm:p-6 lg:p-8 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight">Informações Pessoais</h2>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">
            <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-primary/10 rounded-xl sm:rounded-2xl flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-xs font-black text-muted-foreground uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                  Nome Completo
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-bold text-foreground truncate">{profile?.full_name || '-'}</div>
              </div>
            </div>

            {/* Nickname Section */}
            <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-primary/10 rounded-xl sm:rounded-2xl flex-shrink-0">
                <AtSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-xs font-black text-muted-foreground uppercase tracking-wider sm:tracking-widest mb-2">
                  Nickname (para mensagens)
                </div>
                {profile?.nickname ? (
                  <div className="text-base sm:text-lg lg:text-xl font-bold text-primary">@{profile.nickname}</div>
                ) : (
                  <div className="max-w-sm">
                    <NicknameForm currentNickname={profile?.nickname} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-primary/10 rounded-xl sm:rounded-2xl flex-shrink-0">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-xs font-black text-muted-foreground uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">E-mail</div>
                <div className="text-base sm:text-lg lg:text-xl font-bold text-foreground truncate">{profile?.email || user.email || '-'}</div>
              </div>
            </div>

            {profile?.phone && (
              <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
                <div className="p-2 sm:p-2.5 lg:p-3 bg-primary/10 rounded-xl sm:rounded-2xl flex-shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-xs font-black text-muted-foreground uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                    Telefone / WhatsApp
                  </div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{profile.phone}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-primary/10 rounded-xl sm:rounded-2xl flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-xs font-black text-muted-foreground uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                  Membro desde
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-bold text-foreground uppercase tracking-tight">
                  {new Date(profile?.created_at || user.created_at).toLocaleDateString(
                    'pt-BR',
                    {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 bg-muted/20 border-t border-border">
            <p className="text-xs sm:text-xs text-muted-foreground font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse flex-shrink-0" />
              Clique na foto de perfil para alterá-la. Para outras informações, entre em contato com a secretaria.
            </p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[MembroPage] Error:', error)
    redirect('/login')
  }
}
