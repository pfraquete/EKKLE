import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HomepageEditor } from '@/components/homepage/homepage-editor'

export const metadata = {
  title: 'Homepage - Configurações do Site',
  description: 'Configure a página inicial do site da sua igreja',
}

export default async function HomepagePage() {
  const profile = await getProfile()

  // Only pastors can access homepage settings
  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'PASTOR') {
    redirect('/dashboard')
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/configuracoes/site"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Configurações do Site
        </Link>

        <h1 className="text-3xl font-bold mb-2">Editor da Homepage</h1>
        <p className="text-gray-600">
          Personalize a página inicial do site da sua igreja. Configure o hero,
          ative/desative seções e defina a ordem em que aparecem.
        </p>
      </div>

      {/* Form */}
      <HomepageEditor />
    </div>
  )
}
