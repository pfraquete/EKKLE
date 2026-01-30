'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateChurchConfig } from '@/actions/church-config'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, CheckCircle, ExternalLink, Upload, ImageIcon, X } from 'lucide-react'

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
  city: string | null
  state: string | null
  is_public_listed: boolean | null
}

type ChurchSiteConfigFormProps = {
  church: Church
}

export function ChurchSiteConfigForm({ church }: ChurchSiteConfigFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
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
    city: church.city || '',
    state: church.state || '',
    is_public_listed: church.is_public_listed || false,
  })

  const siteUrl = formData.slug
    ? `https://${formData.slug}.ekkle.com.br`
    : 'Configure o slug para ver a URL'

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    const file = e.target.files[0]
    setUploadingLogo(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthenticated')

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      // Path: userId/filename (matches RLS policy)
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, logo_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading logo:', error)
      const message = error instanceof Error ? error.message : 'Erro ao fazer upload do logo'
      setError(message)
    } finally {
      setUploadingLogo(false)
    }
  }

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
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-500 font-semibold">
            Configurações salvas com sucesso!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Informações Básicas</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-2 text-foreground">
            Nome da Igreja *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            placeholder="Igreja Exemplo"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-semibold mb-2 text-foreground">
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
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-foreground placeholder:text-muted-foreground"
            placeholder="minhaigreja"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Seu site será: <strong className="text-primary">{siteUrl}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Use apenas letras minúsculas, números e hífens
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-2 text-foreground">
            Descrição
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground placeholder:text-muted-foreground"
            placeholder="Uma breve descrição sobre sua igreja..."
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold mb-2 text-foreground">
            Endereço
          </label>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-semibold mb-2 text-foreground">
              Cidade
            </label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="São Paulo"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-semibold mb-2 text-foreground">
              Estado
            </label>
            <select
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            >
              <option value="">Selecione...</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">
            Logo da Igreja
          </label>

          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-input rounded-lg flex items-center justify-center bg-background overflow-hidden relative group">
              {formData.logo_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            {/* Upload Area */}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-card border border-input text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2">
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadingLogo ? 'Enviando...' : 'Fazer Upload'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  Recomendado: 512x512px (PNG/JPG)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Redes Sociais</h2>

        <div>
          <label htmlFor="instagram_url" className="block text-sm font-semibold mb-2 text-foreground">
            Instagram
          </label>
          <input
            id="instagram_url"
            type="url"
            value={formData.instagram_url}
            onChange={(e) =>
              setFormData({ ...formData, instagram_url: e.target.value })
            }
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            placeholder="https://instagram.com/suaigreja"
          />
        </div>

        <div>
          <label htmlFor="whatsapp_url" className="block text-sm font-semibold mb-2 text-foreground">
            WhatsApp
          </label>
          <input
            id="whatsapp_url"
            type="url"
            value={formData.whatsapp_url}
            onChange={(e) =>
              setFormData({ ...formData, whatsapp_url: e.target.value })
            }
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            placeholder="https://wa.me/5511999999999"
          />
        </div>

        <div>
          <label
            htmlFor="youtube_channel_url"
            className="block text-sm font-semibold mb-2 text-foreground"
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
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            placeholder="https://youtube.com/@suaigreja"
          />
        </div>
      </div>

      {/* Public Directory */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Diretório Público Ekkle</h2>
        <p className="text-sm text-muted-foreground">
          Permita que pessoas encontrem sua igreja no diretório público do Ekkle.
          Usuários que ainda não pertencem a uma igreja poderão descobrir e se afiliar à sua comunidade.
        </p>

        <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex-1">
            <label htmlFor="is_public_listed" className="flex items-center gap-3 cursor-pointer">
              <input
                id="is_public_listed"
                type="checkbox"
                checked={formData.is_public_listed}
                onChange={(e) => setFormData({ ...formData, is_public_listed: e.target.checked })}
                className="w-5 h-5 rounded border-input text-primary focus:ring-primary focus:ring-offset-0"
              />
              <div>
                <span className="font-semibold text-foreground">
                  Aparecer no diretório público
                </span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sua igreja será listada para novos usuários que buscam uma comunidade
                </p>
              </div>
            </label>
          </div>
        </div>

        {formData.is_public_listed && (
          <div className="text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="font-semibold text-primary mb-2">Informações exibidas no diretório:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Nome da igreja</li>
              <li>Logo (se configurado)</li>
              <li>Descrição</li>
              <li>Cidade e estado</li>
              <li>Quantidade aproximada de membros</li>
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
