import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin, Clock, User, Users, Search, Filter } from 'lucide-react'
import { mergeWithDefaults, WebsiteSettings } from '@/types/site-settings'

// Helper to get border radius value
function getBorderRadius(radius: string): string {
  const map: Record<string, string> = {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  }
  return map[radius] || '12px'
}

export default async function CellsPage() {
  const church = await getChurch()
  if (!church) redirect('/dashboard')

  const supabase = await createClient()

  // Get website settings
  const rawSettings = church.website_settings as Partial<WebsiteSettings> | null
  const settings = mergeWithDefaults(rawSettings || {})
  const { theme, sections } = settings
  const borderRadius = getBorderRadius(theme.borderRadius)

  // Fetch all active cells
  const { data: cells } = await supabase
    .from('cells')
    .select(`
      id,
      name,
      address,
      neighborhood,
      city,
      meeting_day,
      meeting_time,
      description,
      leader:profiles!cells_leader_id_fkey(full_name, avatar_url)
    `)
    .eq('church_id', church.id)
    .eq('is_active', true)
    .order('name')

  // Group cells by neighborhood
  const cellsByNeighborhood = (cells || []).reduce((acc: Record<string, any[]>, cell: any) => {
    const neighborhood = cell.neighborhood || 'Outros'
    if (!acc[neighborhood]) {
      acc[neighborhood] = []
    }
    acc[neighborhood].push(cell)
    return acc
  }, {})

  const neighborhoods = Object.keys(cellsByNeighborhood).sort()

  return (
    <div 
      className="min-h-screen pt-24"
      style={{ 
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      {/* Hero Section */}
      <section className="py-16 px-6 relative overflow-hidden">
        {/* Decorative Glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 blur-3xl pointer-events-none"
          style={{ 
            background: `radial-gradient(ellipse, ${theme.primaryColor}40 0%, transparent 70%)`,
          }}
        />

        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div 
                className="w-10 h-1 rounded-full" 
                style={{ backgroundColor: theme.primaryColor }} 
              />
              <span 
                className="text-xs font-bold uppercase tracking-[0.3em]"
                style={{ color: theme.primaryColor }}
              >
                Comunidade
              </span>
              <div 
                className="w-10 h-1 rounded-full" 
                style={{ backgroundColor: theme.primaryColor }} 
              />
            </div>
            <h1 
              className="text-4xl md:text-6xl font-black tracking-tighter mb-6"
              style={{ color: theme.textColor }}
            >
              {sections.cells.title}
            </h1>
            <p 
              className="text-xl opacity-70"
              style={{ color: theme.textColor }}
            >
              {sections.cells.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div 
              className="p-6 text-center border border-white/10"
              style={{ backgroundColor: theme.secondaryColor, borderRadius }}
            >
              <p 
                className="text-3xl md:text-4xl font-black"
                style={{ color: theme.primaryColor }}
              >
                {cells?.length || 0}
              </p>
              <p className="text-sm opacity-60 mt-1" style={{ color: theme.textColor }}>
                Células Ativas
              </p>
            </div>
            <div 
              className="p-6 text-center border border-white/10"
              style={{ backgroundColor: theme.secondaryColor, borderRadius }}
            >
              <p 
                className="text-3xl md:text-4xl font-black"
                style={{ color: theme.primaryColor }}
              >
                {neighborhoods.length}
              </p>
              <p className="text-sm opacity-60 mt-1" style={{ color: theme.textColor }}>
                Bairros
              </p>
            </div>
            <div 
              className="p-6 text-center border border-white/10 col-span-2 md:col-span-2"
              style={{ backgroundColor: theme.secondaryColor, borderRadius }}
            >
              <p 
                className="text-lg font-bold"
                style={{ color: theme.textColor }}
              >
                Encontre uma célula perto de você
              </p>
              <p className="text-sm opacity-60 mt-1" style={{ color: theme.textColor }}>
                Role para baixo para ver todas as células organizadas por bairro
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cells by Neighborhood */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          {neighborhoods.map((neighborhood) => (
            <div key={neighborhood} className="mb-16">
              {/* Neighborhood Header */}
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <MapPin className="w-6 h-6" style={{ color: theme.primaryColor }} />
                </div>
                <div>
                  <h2 
                    className="text-2xl md:text-3xl font-bold"
                    style={{ color: theme.textColor }}
                  >
                    {neighborhood}
                  </h2>
                  <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                    {cellsByNeighborhood[neighborhood].length} célula{cellsByNeighborhood[neighborhood].length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Cells Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cellsByNeighborhood[neighborhood].map((cell: any) => (
                  <div
                    key={cell.id}
                    className="group p-6 border border-white/10 hover:-translate-y-1 hover:border-[var(--primary)] transition-all duration-300"
                    style={{ 
                      backgroundColor: theme.secondaryColor,
                      borderRadius,
                      '--primary': `${theme.primaryColor}50`,
                    } as React.CSSProperties}
                  >
                    {/* Cell Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primaryColor}15` }}
                      >
                        <Users className="w-7 h-7" style={{ color: theme.primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-xl font-bold truncate"
                          style={{ color: theme.textColor }}
                        >
                          {cell.name}
                        </h3>
                        {cell.description && (
                          <p 
                            className="text-sm opacity-60 line-clamp-2 mt-1"
                            style={{ color: theme.textColor }}
                          >
                            {cell.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cell Info */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      {sections.cells.showAddress && cell.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: theme.primaryColor }} />
                          <div>
                            <span className="text-sm" style={{ color: theme.textColor }}>
                              {cell.address}
                            </span>
                            {cell.city && (
                              <span className="text-sm opacity-60 block" style={{ color: theme.textColor }}>
                                {cell.city}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {sections.cells.showLeader && cell.leader?.full_name && (
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 flex-shrink-0" style={{ color: theme.accentColor }} />
                          <span className="text-sm" style={{ color: theme.textColor }}>
                            <span className="opacity-60">Líder:</span> {cell.leader.full_name}
                          </span>
                        </div>
                      )}
                      {sections.cells.showSchedule && cell.meeting_day && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: theme.accentColor }} />
                          <span className="text-sm" style={{ color: theme.textColor }}>
                            <span className="opacity-60">Reunião:</span> {cell.meeting_day}
                            {cell.meeting_time && ` às ${cell.meeting_time}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {(!cells || cells.length === 0) && (
            <div className="text-center py-20">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <Users className="w-10 h-10" style={{ color: theme.primaryColor }} />
              </div>
              <h2 
                className="text-2xl font-bold mb-2"
                style={{ color: theme.textColor }}
              >
                Nenhuma célula cadastrada
              </h2>
              <p 
                className="opacity-60"
                style={{ color: theme.textColor }}
              >
                Em breve teremos células disponíveis para você participar.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 px-6"
        style={{ backgroundColor: theme.secondaryColor }}
      >
        <div className="container mx-auto text-center max-w-2xl">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: theme.textColor }}
          >
            Quer participar de uma célula?
          </h2>
          <p 
            className="text-lg opacity-70 mb-8"
            style={{ color: theme.textColor }}
          >
            Entre em contato conosco e encontraremos a célula perfeita para você.
          </p>
          <a
            href="/contato"
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-lg transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: theme.primaryColor,
              color: theme.backgroundColor,
              borderRadius,
            }}
          >
            Entrar em Contato
          </a>
        </div>
      </section>
    </div>
  )
}
