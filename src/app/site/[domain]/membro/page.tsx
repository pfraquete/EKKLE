import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Phone, Calendar } from 'lucide-react'

export default async function MembroPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get enrollment count
  const { count: enrollmentCount } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-primary mb-2">
            {enrollmentCount || 0}
          </div>
          <div className="text-gray-600 text-sm">Cursos Inscritos</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-primary mb-2">
            {profile?.member_stage || '-'}
          </div>
          <div className="text-gray-600 text-sm">Status</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-primary mb-2">
            {profile?.role || '-'}
          </div>
          <div className="text-gray-600 text-sm">Função</div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Informações Pessoais</h2>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <User className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-600 mb-1">
                Nome Completo
              </div>
              <div className="text-lg">{profile?.full_name || '-'}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Mail className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-600 mb-1">E-mail</div>
              <div className="text-lg">{profile?.email || user.email || '-'}</div>
            </div>
          </div>

          {profile?.phone && (
            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-primary mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-600 mb-1">
                  Telefone
                </div>
                <div className="text-lg">{profile.phone}</div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <Calendar className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-600 mb-1">
                Membro desde
              </div>
              <div className="text-lg">
                {new Date(profile?.created_at || user.created_at).toLocaleDateString(
                  'pt-BR',
                  {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-gray-600">
            Para alterar suas informações, entre em contato com a administração da
            igreja.
          </p>
        </div>
      </div>
    </div>
  )
}
