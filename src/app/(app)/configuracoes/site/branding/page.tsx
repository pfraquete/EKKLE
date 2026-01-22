import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandingForm } from '@/components/branding/branding-form'

export const metadata = {
  title: 'Branding - Configurações do Site',
  description: 'Configure as cores, fontes e identidade visual da sua igreja',
}

export default async function BrandingPage() {
  const profile = await getProfile()

  // Only pastors can access branding settings
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

        <h1 className="text-3xl font-bold mb-2">Identidade Visual</h1>
        <p className="text-gray-600">
          Configure as cores, fontes, logo e outros elementos visuais que
          representam a identidade da sua igreja no site público.
        </p>
      </div>

      {/* Form */}
      <BrandingForm />
    </div>
  )
}
