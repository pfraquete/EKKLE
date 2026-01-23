import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Phone, Calendar } from 'lucide-react'

export default async function MembroPage() {
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

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get enrollment count
  const { count: enrollmentCount } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground font-medium mt-1">Gerencie suas informações e acompanhe seu crescimento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Cards */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="text-3xl font-black text-primary mb-1">
            {enrollmentCount || 0}
          </div>
          <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Cursos Inscritos</div>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="text-3xl font-black text-primary mb-1">
            {profile?.member_stage || '-'}
          </div>
          <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Status / Estágio</div>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="text-3xl font-black text-primary mb-1">
            {profile?.role || '-'}
          </div>
          <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Função na Igreja</div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="bg-muted/30 border-b border-border p-6 md:p-8">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Informações Pessoais</h2>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="flex items-start gap-5">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Nome Completo
              </div>
              <div className="text-xl font-bold text-foreground">{profile?.full_name || '-'}</div>
            </div>
          </div>

          <div className="flex items-start gap-5">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">E-mail</div>
              <div className="text-xl font-bold text-foreground">{profile?.email || user.email || '-'}</div>
            </div>
          </div>

          {profile?.phone && (
            <div className="flex items-start gap-5">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Telefone / WhatsApp
                </div>
                <div className="text-xl font-bold text-foreground">{profile.phone}</div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-5">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Membro desde
              </div>
              <div className="text-xl font-bold text-foreground uppercase tracking-tight">
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

        <div className="p-6 md:p-8 bg-muted/20 border-t border-border">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" />
            Para alterar suas informações cadastrais, entre em contato com a secretaria da igreja.
          </p>
        </div>
      </div>
    </div>
  )
}
