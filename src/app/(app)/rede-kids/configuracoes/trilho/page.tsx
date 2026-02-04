import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getFormationStages } from '@/actions/kids-formation'
import { FormationStageManager } from '@/components/rede-kids/formation'
import { PageHeader } from '@/components/page-header'
import { Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Trilho de Formação | Rede Kids',
  description: 'Configure as etapas do Trilho de Formação Kids',
}

export default async function TrilhoFormacaoPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only pastors can access this page
  if (profile.role !== 'PASTOR') {
    redirect('/rede-kids')
  }

  const stages = await getFormationStages()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/rede-kids/configuracoes">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Configurações
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        icon={Award}
        title="Trilho de Formação Kids"
        description="Configure as etapas da jornada de desenvolvimento espiritual das crianças. Arraste para reordenar as etapas."
      />

      {/* Stage Manager */}
      <FormationStageManager initialStages={stages} />

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Como funciona o Trilho de Formação?
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            • <strong>Etapas personalizáveis:</strong> Crie etapas que refletem a jornada
            de formação da sua igreja
          </li>
          <li>
            • <strong>Ordem sequencial:</strong> As crianças progridem pelas etapas na
            ordem definida
          </li>
          <li>
            • <strong>Acompanhamento visual:</strong> Líderes podem ver o progresso de
            cada criança no perfil
          </li>
          <li>
            • <strong>Histórico completo:</strong> Cada conclusão de etapa é registrada
            com data e observações
          </li>
        </ul>
      </div>
    </div>
  )
}
