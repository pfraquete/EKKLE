import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Search, Church, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function EkkleBibliaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">Bíblia</h1>
        <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
          Leia e estude a Palavra de Deus
        </p>
      </div>

      {/* Online Bible Links */}
      <section className="space-y-4">
        <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
          Acesse a Bíblia Online
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://www.bible.com/pt"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    YouVersion
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </h3>
                  <p className="text-xs text-muted-foreground">Bible.com - Bíblia em várias traduções</p>
                </div>
              </CardContent>
            </Card>
          </a>

          <a
            href="https://www.bibliaonline.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    Bíblia Online
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </h3>
                  <p className="text-xs text-muted-foreground">Leitura simples e rápida</p>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      </section>

      {/* Reading Plans - Need Church */}
      <section>
        <Card className="border-dashed">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black mb-2">Planos de Leitura</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Para acessar planos de leitura bíblica personalizados e acompanhar seu progresso,
              entre em uma igreja e participe de um plano da comunidade.
            </p>
            <Link
              href="/ekkle/membro/igrejas"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              Pesquisar Igrejas
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Church className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Estude em comunidade</h3>
            <p className="text-sm text-muted-foreground">
              Entre em uma igreja para participar de estudos bíblicos em grupo!
            </p>
          </div>
          <Link
            href="/ekkle/membro/igrejas"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            Pesquisar Igrejas
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
