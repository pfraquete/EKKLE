import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, ExternalLink, Loader2, Clock, Church } from 'lucide-react'
import { EKKLE_HUB_ID } from '@/lib/ekkle-utils'

interface IgrejaCriadaPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function IgrejaCriadaPage({ searchParams }: IgrejaCriadaPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get profile with church info
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      churches:church_id (
        id,
        name,
        slug
      )
    `)
    .eq('id', user.id)
    .single()

  // Check if user is still in Ekkle Hub (payment might still be processing)
  const isStillProcessing = profile?.church_id === EKKLE_HUB_ID

  // If still processing, show loading state
  if (isStillProcessing) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full mx-auto flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black">Processando...</h1>
          <p className="text-muted-foreground">
            Estamos criando sua igreja. Isso pode levar alguns segundos.
          </p>
        </div>

        <Card className="text-left">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold">Aguarde um momento</p>
                <p className="text-xs text-muted-foreground">
                  O pagamento foi confirmado. A pagina sera atualizada automaticamente quando sua igreja estiver pronta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-refresh script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(function() {
                window.location.reload();
              }, 3000);
            `,
          }}
        />
      </div>
    )
  }

  // Church created successfully
  const church = profile?.churches as { id: string; name: string; slug: string } | null

  if (!church) {
    // Unexpected state - redirect to member area
    redirect('/ekkle/membro')
  }

  const churchUrl = `https://${church.slug}.ekkle.com.br`

  return (
    <div className="max-w-md mx-auto text-center space-y-8 py-12">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Igreja Criada!</h1>
        <p className="text-muted-foreground">
          Parabens! Sua igreja <span className="font-bold text-foreground">{church.name}</span> foi criada com sucesso.
        </p>
      </div>

      {/* Church Info Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
            <Church className="w-7 h-7 text-primary" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Site da sua igreja
            </p>
            <a
              href={churchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg font-mono bg-muted px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
            >
              {church.slug}.ekkle.com.br
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Seu site ja esta no ar! Configure o design e conteudo no painel administrativo.
          </p>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="text-left">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold">Proximos passos:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">1</span>
              <span>Configure o site da sua igreja</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">2</span>
              <span>Cadastre suas celulas e lideres</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">3</span>
              <span>Convide seus membros para a plataforma</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA Button */}
      <Link href="/dashboard" className="block">
        <Button size="lg" className="w-full h-14 text-base font-black uppercase tracking-wider">
          Acessar Painel Administrativo
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </Link>

      <p className="text-xs text-muted-foreground">
        Voce agora e administrador da sua igreja no Ekkle
      </p>
    </div>
  )
}
