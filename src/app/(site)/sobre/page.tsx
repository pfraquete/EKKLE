import { getChurch } from '@/lib/get-church'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Mail, Instagram, Youtube, MessageCircle } from 'lucide-react'

export default async function SobrePage() {
  const church = await getChurch()

  if (!church) {
    return null
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          {church.logo_url && (
            <div className="mb-8">
              <Image
                src={church.logo_url}
                alt={church.name}
                width={120}
                height={120}
                className="mx-auto rounded-lg"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold mb-6">Sobre a {church.name}</h1>
          {church.description && (
            <p className="text-xl text-gray-700 leading-relaxed">
              {church.description}
            </p>
          )}
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🙏</span>
            </div>
            <h3 className="font-bold text-xl mb-3">Nossa Missão</h3>
            <p className="text-gray-600">
              Compartilhar o amor de Cristo e transformar vidas através da palavra de Deus
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👁️</span>
            </div>
            <h3 className="font-bold text-xl mb-3">Nossa Visão</h3>
            <p className="text-gray-600">
              Ser uma comunidade acolhedora onde todos possam crescer espiritualmente
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❤️</span>
            </div>
            <h3 className="font-bold text-xl mb-3">Nossos Valores</h3>
            <p className="text-gray-600">
              Amor, fé, comunhão e serviço são os pilares da nossa comunidade
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Entre em Contato</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Details */}
              <div className="space-y-4">
                {church.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">Endereço</div>
                      <p className="text-gray-600">{church.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">E-mail</div>
                    <a
                      href={`mailto:contato@${church.slug}.ekkle.com.br`}
                      className="text-primary hover:underline"
                    >
                      contato@{church.slug}.ekkle.com.br
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <div className="font-semibold mb-4">Redes Sociais</div>
                <div className="space-y-3">
                  {church.instagram_url && (
                    <a
                      href={church.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <span>Instagram</span>
                    </a>
                  )}

                  {church.youtube_channel_url && (
                    <a
                      href={church.youtube_channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Youtube className="w-5 h-5 text-red-600" />
                      <span>YouTube</span>
                    </a>
                  )}

                  {church.whatsapp_url && (
                    <a
                      href={church.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 pt-8 border-t text-center">
              <h3 className="font-bold text-xl mb-3">Venha nos visitar!</h3>
              <p className="text-gray-600 mb-6">
                Faça parte da nossa comunidade e cresça conosco em fé
              </p>
              <Link
                href="/membro"
                className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
