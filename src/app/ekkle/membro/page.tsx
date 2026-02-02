import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, BookOpen, Radio, Church, ArrowRight, CreditCard, Sparkles, AtSign } from 'lucide-react'
import { NicknameForm } from '@/components/chat'

export default async function EkkleMembroPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Olá, {profile?.full_name?.split(' ')[0] || 'Visitante'}!
        </h1>
        {profile?.nickname && (
          <p className="text-primary font-bold">@{profile.nickname}</p>
        )}
        <p className="text-muted-foreground text-lg">
          Bem-vindo ao Ekkle. Encontre sua comunidade de fé.
        </p>
      </div>

      {/* CTA Card - Find Church */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Church className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-black">Encontre sua Igreja</h2>
              <p className="text-muted-foreground">
                Voce ainda nao esta afiliado a nenhuma igreja. Explore igrejas cadastradas na plataforma e encontre sua comunidade!
              </p>
            </div>
            <Link
              href="/ekkle/membro/igrejas"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              <Search className="w-4 h-4" />
              Pesquisar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* CTA Card - Open a Church */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 relative">
              <CreditCard className="w-8 h-8 text-amber-500" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">E pastor? Abra sua Igreja</h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-bold rounded-full uppercase">
                  R$ 57/mes
                </span>
              </div>
              <p className="text-muted-foreground">
                Crie sua igreja no Ekkle e gerencie celulas, membros, financas, site personalizado e muito mais!
              </p>
            </div>
            <Link
              href="/ekkle/membro/abrir-igreja"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-amber-500/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20"
            >
              Abrir Igreja
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-wider">
            Suas Informações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</p>
              <p className="font-bold">{profile?.full_name || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="font-bold">{profile?.email || user.email || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefone</p>
              <p className="font-bold">{profile?.phone || 'Não informado'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <p className="font-bold text-amber-500">Procurando Igreja</p>
              </div>
            </div>
          </div>

          {/* Nickname Section */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                <AtSign className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Nickname (para mensagens)
                </p>
                {profile?.nickname ? (
                  <p className="font-bold text-primary">@{profile.nickname}</p>
                ) : (
                  <div className="max-w-sm">
                    <NicknameForm currentNickname={profile?.nickname} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/ekkle/membro/cursos">
          <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Cursos Ekkle</h3>
                <p className="text-xs text-muted-foreground">Aprenda sobre fé e comunidade</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ekkle/membro/lives">
          <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Radio className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Lives</h3>
                <p className="text-xs text-muted-foreground">Transmissões ao vivo</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ekkle/membro/igrejas">
          <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Pesquisar Igrejas</h3>
                <p className="text-xs text-muted-foreground">Encontre sua comunidade</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
