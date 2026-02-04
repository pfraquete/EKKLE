import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Award, BookOpen, Gamepad2, ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Configurações | Rede Kids',
  description: 'Configurações do módulo Rede Kids',
}

const configOptions = [
  {
    title: 'Trilho de Formação',
    description: 'Configure as etapas da jornada de desenvolvimento espiritual das crianças',
    icon: Award,
    href: '/rede-kids/configuracoes/trilho',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Biblioteca de Conteúdo',
    description: 'Gerencie lições, histórias bíblicas e materiais de ensino',
    icon: BookOpen,
    href: '/rede-kids/configuracoes/biblioteca',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    comingSoon: true,
  },
  {
    title: 'Gamificação',
    description: 'Configure versículos para memorização e atividades do discípulo',
    icon: Gamepad2,
    href: '/rede-kids/configuracoes/gamificacao',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
]

export default async function ConfiguracoesKidsPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only pastors can access this page
  if (profile.role !== 'PASTOR') {
    redirect('/rede-kids')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/rede-kids">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Rede Kids
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Settings className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Configurações da Rede Kids</h1>
          <p className="text-muted-foreground">
            Personalize o módulo Kids de acordo com as necessidades do seu ministério infantil
          </p>
        </div>
      </div>

      {/* Config Options Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configOptions.map((option) => (
          <Link
            key={option.href}
            href={option.comingSoon ? '#' : option.href}
            className={option.comingSoon ? 'cursor-not-allowed' : ''}
          >
            <Card
              className={`h-full transition-all duration-200 ${
                option.comingSoon
                  ? 'opacity-60'
                  : 'hover:shadow-md hover:border-primary/50'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${option.bgColor}`}>
                    <option.icon className={`h-5 w-5 ${option.color}`} />
                  </div>
                  {option.comingSoon ? (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      Em breve
                    </span>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
