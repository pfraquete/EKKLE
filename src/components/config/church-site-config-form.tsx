'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateChurchConfig } from '@/actions/church-config'
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

type Church = {
  id: string
  name: string
  slug: string | null
  description: string | null
  address: string | null
  logo_url: string | null
  instagram_url: string | null
  whatsapp_url: string | null
  youtube_channel_url: string | null
}

type ChurchSiteConfigFormProps = {
  church: Church
}

export function ChurchSiteConfigForm({ church }: ChurchSiteConfigFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: church.name || '',
    slug: church.slug || '',
    description: church.description || '',
    address: church.address || '',
    logo_url: church.logo_url || '',
    instagram_url: church.instagram_url || '',
    whatsapp_url: church.whatsapp_url || '',
    youtube_channel_url: church.youtube_channel_url || '',
  })

  const siteUrl = formData.slug
    ? `https://${formData.slug}.ekkle.com.br`
    : 'Configure o slug para ver a URL'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await updateChurchConfig(formData)

    if (result.success) {
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Erro ao salvar configurações')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-semibold">
            Configurações salvas com sucesso!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 className="text-xl font-bold">Informações Básicas</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-2">
            Nome da Igreja *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Igreja Exemplo"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-semibold mb-2">
            Slug do Site *
          </label>
          <input
            id="slug"
            type="text"
            required
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value.toLowerCase() })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
            placeholder="minhaigreja"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          <p className="text-sm text-gray-600 mt-2">
            Seu site será: <strong className="text-primary">{siteUrl}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Use apenas letras minúsculas, números e hífens
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Uma breve descrição sobre sua igreja..."
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold mb-2">
            Endereço
          </label>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
          />
        </div>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-semibold mb-2">
            URL do Logo
          </label>
          <input
            id="logo_url"
            type="url"
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Faça upload do logo no Supabase Storage e cole a URL pública aqui
          </p>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 className="text-xl font-bold">Redes Sociais</h2>

        <div>
          <label htmlFor="instagram_url" className="block text-sm font-semibold mb-2">
            Instagram
          </label>
          <input
            id="instagram_url"
            type="url"
            value={formData.instagram_url}
            onChange={(e) =>
              setFormData({ ...formData, instagram_url: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://instagram.com/suaigreja"
          />
        </div>

        <div>
          <label htmlFor="whatsapp_url" className="block text-sm font-semibold mb-2">
            WhatsApp
          </label>
          <input
            id="whatsapp_url"
            type="url"
            value={formData.whatsapp_url}
            onChange={(e) =>
              setFormData({ ...formData, whatsapp_url: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://wa.me/5511999999999"
          />
        </div>

        <div>
          <label
            htmlFor="youtube_channel_url"
            className="block text-sm font-semibold mb-2"
          >
            Canal do YouTube
          </label>
          <input
            id="youtube_channel_url"
            type="url"
            value={formData.youtube_channel_url}
            onChange={(e) =>
              setFormData({ ...formData, youtube_channel_url: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://youtube.com/@suaigreja"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>

          {formData.slug && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-2"
            >
              Ver Site Público
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </form>
  )
}
