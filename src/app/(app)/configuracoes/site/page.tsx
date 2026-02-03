import { getProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Palette, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Settings2, 
  Globe, 
  Search,
  Layers,
  Users,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function SiteConfigPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  if (profile.role !== 'PASTOR') {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { data: church } = await supabase
    .from('churches')
    .select('*')
    .eq('id', profile.church_id)
    .single()

  if (!church) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive font-semibold">Igreja não encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const siteUrl = church.slug ? `https://${church.slug}.ekkle.com.br` : null

  const configSections = [
    {
      title: 'Cores e Tema',
      description: 'Personalize as cores primárias, secundárias e o estilo visual do seu site',
      icon: Palette,
      href: '/configuracoes/site/tema',
      color: 'from-gold/20 to-gold/5',
      borderColor: 'border-gold/30',
      iconColor: 'text-gold',
      badge: 'Popular',
    },
    {
      title: 'Hero e Banner',
      description: 'Configure a seção principal com imagem de fundo, título e botões',
      icon: ImageIcon,
      href: '/configuracoes/site/hero',
      color: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Seções do Site',
      description: 'Ative, desative e organize as seções: Células, Eventos, Cursos e mais',
      icon: Layers,
      href: '/configuracoes/site/secoes',
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-500',
      badge: 'Novo',
    },
    {
      title: 'Células',
      description: 'Configure como as células são exibidas com endereços e horários',
      icon: Users,
      href: '/configuracoes/site/celulas',
      color: 'from-green-500/20 to-green-500/5',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-500',
    },
    {
      title: 'Textos e Conteúdo',
      description: 'Edite títulos, subtítulos e descrições de todas as seções',
      icon: Type,
      href: '/configuracoes/site/textos',
      color: 'from-orange-500/20 to-orange-500/5',
      borderColor: 'border-orange-500/30',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Cabeçalho e Rodapé',
      description: 'Configure o menu, logo, redes sociais e informações do rodapé',
      icon: Layout,
      href: '/configuracoes/site/layout',
      color: 'from-cyan-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-500',
    },
    {
      title: 'SEO e Meta Tags',
      description: 'Otimize seu site para buscadores com título, descrição e imagem',
      icon: Search,
      href: '/configuracoes/site/seo',
      color: 'from-pink-500/20 to-pink-500/5',
      borderColor: 'border-pink-500/30',
      iconColor: 'text-pink-500',
    },
    {
      title: 'Configurações Gerais',
      description: 'Informações básicas, slug, endereço e redes sociais da igreja',
      icon: Settings2,
      href: '/configuracoes/site/geral',
      color: 'from-gray-500/20 to-gray-500/5',
      borderColor: 'border-gray-500/30',
      iconColor: 'text-gray-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold/10">
              <Globe className="w-6 h-6 text-gold" />
            </div>
            <h1 className="text-3xl font-bold text-white-primary">Configurações do Site</h1>
          </div>
          <p className="text-gray-text-secondary max-w-2xl">
            Personalize completamente o site público da sua igreja. Configure cores, textos, seções e muito mais.
          </p>
        </div>

        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Ver Site Público
            </Button>
          </a>
        )}
      </div>

      {/* Site Preview Card */}
      <Card className="bg-gradient-to-br from-gold/10 via-black-surface to-black-elevated border-gold/20 overflow-hidden">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="text-sm font-semibold text-gold uppercase tracking-wider">Seu Site</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white-primary">
                {church.name}
              </h2>
              {siteUrl ? (
                <p className="text-gray-text-secondary font-mono text-sm bg-black-deep px-3 py-2 rounded-lg inline-block">
                  {siteUrl}
                </p>
              ) : (
                <p className="text-gray-text-muted">
                  Configure o slug para ativar seu site público
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/configuracoes/site/geral">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Configurar Slug
                </Button>
              </Link>
              {siteUrl && (
                <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full sm:w-auto gap-2">
                    Visualizar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {configSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className={`h-full bg-gradient-to-br ${section.color} ${section.borderColor} hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-black-elevated/50 ${section.iconColor} group-hover:scale-110 transition-transform`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  {section.badge && (
                    <Badge variant={section.badge === 'Novo' ? 'default' : 'secondary'} className="text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg text-white-primary group-hover:text-gold transition-colors">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-text-secondary">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle className="text-lg">Status do Site</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-black-elevated">
              <p className="text-2xl font-bold text-gold">{church.slug ? 'Ativo' : 'Inativo'}</p>
              <p className="text-sm text-gray-text-muted">Status</p>
            </div>
            <div className="p-4 rounded-xl bg-black-elevated">
              <p className="text-2xl font-bold text-white-primary">{church.logo_url ? 'Sim' : 'Não'}</p>
              <p className="text-sm text-gray-text-muted">Logo Configurado</p>
            </div>
            <div className="p-4 rounded-xl bg-black-elevated">
              <p className="text-2xl font-bold text-white-primary">{church.description ? 'Sim' : 'Não'}</p>
              <p className="text-sm text-gray-text-muted">Descrição</p>
            </div>
            <div className="p-4 rounded-xl bg-black-elevated">
              <p className="text-2xl font-bold text-white-primary">{church.is_public_listed ? 'Sim' : 'Não'}</p>
              <p className="text-sm text-gray-text-muted">No Diretório</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
