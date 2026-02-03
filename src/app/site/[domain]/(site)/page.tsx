import Link from 'next/link'
import Image from 'next/image'
import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { 
  Calendar, 
  BookOpen, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Users, 
  User,
  Play,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mergeWithDefaults, WebsiteSettings } from '@/types/site-settings'

export const revalidate = 60

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

export default async function Homepage() {
  const church = await getChurch()
  if (!church) return null

  const supabase = await createClient()

  // Get website settings
  const rawSettings = church.website_settings as Partial<WebsiteSettings> | null
  const settings = mergeWithDefaults(rawSettings || {})
  const { theme, sections } = settings
  const borderRadius = getBorderRadius(theme.borderRadius)

  // Fetch Events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', church.id)
    .eq('is_published', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(sections.events.maxItems)

  // Fetch Courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('church_id', church.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(sections.courses.maxItems)

  // Fetch Cells
  const { data: cells } = await supabase
    .from('cells')
    .select(`
      id,
      name,
      address,
      neighborhood,
      meeting_day,
      meeting_time,
      leader:profiles!cells_leader_id_fkey(full_name)
    `)
    .eq('church_id', church.id)
    .eq('is_active', true)
    .limit(sections.cells.maxItems)

  // Render section based on key
  const renderSection = (key: string) => {
    switch (key) {
      case 'events':
        return sections.events.enabled && events && events.length > 0 ? (
          <section 
            key="events" 
            className="py-24 md:py-32 relative overflow-hidden"
            style={{ backgroundColor: theme.backgroundColor }}
          >
            <div className="container mx-auto px-6">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-1 rounded-full" 
                      style={{ backgroundColor: theme.primaryColor }} 
                    />
                    <span 
                      className="text-xs font-bold uppercase tracking-[0.3em]"
                      style={{ color: theme.primaryColor }}
                    >
                      Agenda
                    </span>
                  </div>
                  <h2 
                    className="text-4xl md:text-6xl font-black tracking-tighter"
                    style={{ color: theme.textColor }}
                  >
                    {sections.events.title}
                  </h2>
                  <p 
                    className="text-xl max-w-lg font-medium opacity-70"
                    style={{ color: theme.textColor }}
                  >
                    {sections.events.subtitle}
                  </p>
                </div>
                <Link href="/eventos">
                  <Button 
                    variant="outline" 
                    className="rounded-full px-8 font-bold gap-3 h-14 uppercase tracking-widest text-xs transition-all duration-500 hover:scale-105"
                    style={{ 
                      borderColor: theme.primaryColor,
                      color: theme.primaryColor,
                    }}
                  >
                    Ver Programação <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <Link
                    href={`/eventos/${event.id}`}
                    key={event.id}
                    className="group overflow-hidden border border-white/10 hover:-translate-y-2 transition-all duration-500"
                    style={{ 
                      backgroundColor: theme.secondaryColor,
                      borderRadius,
                    }}
                  >
                    <div className="relative aspect-[16/11] overflow-hidden">
                      {event.image_url ? (
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-1000"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          loading="lazy"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${theme.primaryColor}10` }}
                        >
                          <Calendar className="w-16 h-16 opacity-20" style={{ color: theme.primaryColor }} />
                        </div>
                      )}
                      {/* Date Badge */}
                      <div 
                        className="absolute top-6 left-6 px-5 py-2.5 backdrop-blur-xl border border-white/10"
                        style={{ 
                          backgroundColor: `${theme.backgroundColor}ee`,
                          borderRadius,
                        }}
                      >
                        <p 
                          className="text-sm font-bold uppercase"
                          style={{ color: theme.textColor }}
                        >
                          {new Date(event.start_date).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 
                        className="text-xl font-bold mb-4 line-clamp-2 leading-tight transition-colors"
                        style={{ color: theme.textColor }}
                      >
                        {event.title}
                      </h3>
                      <div className="space-y-3 text-sm opacity-70">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4" style={{ color: theme.primaryColor }} />
                          <span style={{ color: theme.textColor }}>
                            {new Date(event.start_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4" style={{ color: theme.primaryColor }} />
                            <span className="truncate" style={{ color: theme.textColor }}>
                              {event.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null

      case 'cells':
        return sections.cells.enabled && cells && cells.length > 0 ? (
          <section 
            key="cells" 
            className="py-24 md:py-32 relative overflow-hidden"
            style={{ backgroundColor: theme.secondaryColor }}
          >
            {/* Decorative Glow */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 blur-3xl pointer-events-none"
              style={{ 
                background: `radial-gradient(ellipse, ${theme.primaryColor}40 0%, transparent 70%)`,
              }}
            />

            <div className="container mx-auto px-6 relative z-10">
              {/* Section Header */}
              <div className="text-center mb-16 space-y-4">
                <div className="flex items-center justify-center gap-3">
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
                <h2 
                  className="text-4xl md:text-6xl font-black tracking-tighter"
                  style={{ color: theme.textColor }}
                >
                  {sections.cells.title}
                </h2>
                <p 
                  className="text-xl max-w-2xl mx-auto font-medium opacity-70"
                  style={{ color: theme.textColor }}
                >
                  {sections.cells.subtitle}
                </p>
              </div>

              {/* Cells Grid */}
              {sections.cells.layout === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cells.map((cell: any) => (
                    <div
                      key={cell.id}
                      className="group p-6 border border-white/10 hover:-translate-y-1 hover:border-[var(--primary)] transition-all duration-300"
                      style={{ 
                        backgroundColor: theme.backgroundColor,
                        borderRadius,
                        '--primary': `${theme.primaryColor}50`,
                      } as React.CSSProperties}
                    >
                      {/* Cell Icon */}
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primaryColor}15` }}
                      >
                        <Users className="w-7 h-7" style={{ color: theme.primaryColor }} />
                      </div>

                      {/* Cell Name */}
                      <h3 
                        className="text-xl font-bold mb-4"
                        style={{ color: theme.textColor }}
                      >
                        {cell.name}
                      </h3>

                      {/* Cell Info */}
                      <div className="space-y-3">
                        {sections.cells.showNeighborhood && cell.neighborhood && (
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: theme.primaryColor }} />
                            <span className="text-sm font-medium" style={{ color: theme.textColor }}>
                              {cell.neighborhood}
                            </span>
                          </div>
                        )}
                        {sections.cells.showAddress && cell.address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-50" style={{ color: theme.textColor }} />
                            <span className="text-sm opacity-60" style={{ color: theme.textColor }}>
                              {cell.address}
                            </span>
                          </div>
                        )}
                        {sections.cells.showLeader && cell.leader?.full_name && (
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 flex-shrink-0" style={{ color: theme.accentColor }} />
                            <span className="text-sm opacity-80" style={{ color: theme.textColor }}>
                              {cell.leader.full_name}
                            </span>
                          </div>
                        )}
                        {sections.cells.showSchedule && cell.meeting_day && (
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 flex-shrink-0" style={{ color: theme.accentColor }} />
                            <span className="text-sm opacity-80" style={{ color: theme.textColor }}>
                              {cell.meeting_day}{cell.meeting_time ? ` às ${cell.meeting_time}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cells List Layout */}
              {sections.cells.layout === 'list' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {cells.map((cell: any) => (
                    <div
                      key={cell.id}
                      className="p-5 flex flex-col md:flex-row md:items-center gap-4 border border-white/10 hover:bg-white/5 transition-all duration-300"
                      style={{ 
                        backgroundColor: theme.backgroundColor,
                        borderRadius,
                      }}
                    >
                      <div 
                        className="p-3 rounded-xl w-fit"
                        style={{ backgroundColor: `${theme.primaryColor}15` }}
                      >
                        <Users className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 
                          className="font-bold"
                          style={{ color: theme.textColor }}
                        >
                          {cell.name}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm opacity-70" style={{ color: theme.textColor }}>
                          {sections.cells.showNeighborhood && cell.neighborhood && (
                            <span>{cell.neighborhood}</span>
                          )}
                          {sections.cells.showLeader && cell.leader?.full_name && (
                            <span>{cell.leader.full_name}</span>
                          )}
                          {sections.cells.showSchedule && cell.meeting_day && (
                            <span>{cell.meeting_day}{cell.meeting_time ? ` - ${cell.meeting_time}` : ''}</span>
                          )}
                        </div>
                      </div>
                      {sections.cells.showAddress && cell.address && (
                        <span className="text-sm opacity-50" style={{ color: theme.textColor }}>
                          {cell.address}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* View All Link */}
              <div className="text-center mt-12">
                <Link
                  href="/celulas"
                  className="inline-flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-300 hover:gap-4"
                  style={{ color: theme.primaryColor }}
                >
                  Ver todas as células
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
        ) : null

      case 'courses':
        return sections.courses.enabled && courses && courses.length > 0 ? (
          <section 
            key="courses" 
            className="py-24 md:py-32 border-y border-white/10"
            style={{ backgroundColor: `${theme.backgroundColor}` }}
          >
            <div className="container mx-auto px-6">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-1 rounded-full" 
                      style={{ backgroundColor: theme.primaryColor }} 
                    />
                    <span 
                      className="text-xs font-bold uppercase tracking-[0.3em]"
                      style={{ color: theme.primaryColor }}
                    >
                      Capacitação
                    </span>
                  </div>
                  <h2 
                    className="text-4xl md:text-6xl font-black tracking-tighter"
                    style={{ color: theme.textColor }}
                  >
                    {sections.courses.title}
                  </h2>
                  <p 
                    className="text-xl max-w-lg font-medium opacity-70"
                    style={{ color: theme.textColor }}
                  >
                    {sections.courses.subtitle}
                  </p>
                </div>
                <Link href="/cursos">
                  <Button 
                    variant="outline" 
                    className="rounded-full px-8 font-bold gap-3 h-14 uppercase tracking-widest text-xs transition-all duration-500 hover:scale-105"
                    style={{ 
                      borderColor: theme.primaryColor,
                      color: theme.primaryColor,
                    }}
                  >
                    Conhecer Cursos <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <Link
                    href={`/cursos/${course.id}`}
                    key={course.id}
                    className="group overflow-hidden border border-white/10 hover:-translate-y-2 transition-all duration-500"
                    style={{ 
                      backgroundColor: theme.secondaryColor,
                      borderRadius,
                    }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {course.thumbnail_url ? (
                        <>
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                              className="p-4 rounded-full"
                              style={{ backgroundColor: theme.primaryColor }}
                            >
                              <Play className="w-6 h-6" style={{ color: theme.backgroundColor }} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${theme.primaryColor}10` }}
                        >
                          <BookOpen className="w-16 h-16 opacity-20" style={{ color: theme.primaryColor }} />
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4" style={{ color: theme.primaryColor }} />
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70" style={{ color: theme.textColor }}>
                          Curso
                        </span>
                      </div>
                      <h3 
                        className="text-xl font-bold mb-3 leading-tight"
                        style={{ color: theme.textColor }}
                      >
                        {course.title}
                      </h3>
                      {course.description && (
                        <p 
                          className="text-sm leading-relaxed line-clamp-2 opacity-60"
                          style={{ color: theme.textColor }}
                        >
                          {course.description}
                        </p>
                      )}
                      {sections.courses.showPrice && course.price > 0 && (
                        <p 
                          className="mt-4 text-lg font-bold"
                          style={{ color: theme.primaryColor }}
                        >
                          R$ {course.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null

      case 'about':
        return sections.about.enabled ? (
          <section 
            key="about" 
            className="py-32 md:py-48 relative overflow-hidden"
            style={{ backgroundColor: theme.secondaryColor }}
          >
            {/* Decorative Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute top-1/4 -right-20 w-96 h-96 rounded-full blur-[120px] opacity-20"
                style={{ backgroundColor: theme.primaryColor }}
              />
              <div 
                className="absolute bottom-1/4 -left-20 w-[30rem] h-[30rem] rounded-full blur-[150px] opacity-10"
                style={{ backgroundColor: theme.accentColor }}
              />
            </div>

            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="flex items-center justify-center gap-3">
                  <div 
                    className="w-10 h-1 rounded-full" 
                    style={{ backgroundColor: theme.primaryColor }} 
                  />
                  <span 
                    className="text-xs font-bold uppercase tracking-[0.3em]"
                    style={{ color: theme.primaryColor }}
                  >
                    Nossa História
                  </span>
                  <div 
                    className="w-10 h-1 rounded-full" 
                    style={{ backgroundColor: theme.primaryColor }} 
                  />
                </div>
                <h2 
                  className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none"
                  style={{ color: theme.textColor }}
                >
                  {sections.about.title}
                </h2>
                {church.description && (
                  <p 
                    className="text-xl md:text-2xl leading-relaxed font-light italic opacity-70"
                    style={{ color: theme.textColor }}
                  >
                    "{church.description}"
                  </p>
                )}
                {sections.about.buttonText && (
                  <div className="pt-10">
                    <Link href={sections.about.buttonLink}>
                      <Button 
                        size="lg" 
                        className="rounded-full px-12 h-16 text-lg font-bold uppercase tracking-widest hover:scale-105 transition-all duration-500"
                        style={{ 
                          backgroundColor: theme.primaryColor,
                          color: theme.backgroundColor,
                        }}
                      >
                        {sections.about.buttonText}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null

      default:
        return null
    }
  }

  // Determine section order
  const orderedSections = [
    { key: 'events', order: sections.events.order, enabled: sections.events.enabled },
    { key: 'cells', order: sections.cells.order, enabled: sections.cells.enabled },
    { key: 'courses', order: sections.courses.order, enabled: sections.courses.enabled },
    { key: 'about', order: sections.about.order, enabled: sections.about.enabled },
  ]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map(s => s.key)

  return (
    <div 
      className="flex flex-col min-h-screen selection:bg-[var(--primary)]/20"
      style={{ 
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        '--primary': theme.primaryColor,
      } as React.CSSProperties}
    >
      {/* Hero Section */}
      {sections.hero.enabled && (
        <section 
          className="relative flex items-center justify-center overflow-hidden"
          style={{ 
            minHeight: sections.hero.minHeight === 'full' ? '100vh' : 
                       sections.hero.minHeight === 'large' ? '80vh' : 
                       sections.hero.minHeight === 'medium' ? '60vh' : '40vh'
          }}
        >
          {/* Background */}
          <div className="absolute inset-0 z-0">
            {sections.hero.backgroundUrl ? (
              <>
                <Image
                  src={sections.hero.backgroundUrl}
                  alt="Hero Background"
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                  quality={90}
                />
                <div 
                  className="absolute inset-0"
                  style={{ 
                    backgroundColor: theme.backgroundColor,
                    opacity: sections.hero.backgroundOverlay / 100,
                  }}
                />
              </>
            ) : (
              <div 
                className="w-full h-full"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.backgroundColor} 0%, ${theme.secondaryColor} 50%, ${theme.backgroundColor} 100%)`,
                }}
              />
            )}

            {/* Decorative Glow */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 blur-3xl pointer-events-none"
              style={{ 
                background: `radial-gradient(ellipse, ${theme.primaryColor}40 0%, transparent 70%)`,
              }}
            />
          </div>

          {/* Content */}
          <div 
            className="container mx-auto px-6 relative z-10 py-32"
            style={{ textAlign: sections.hero.textAlign }}
          >
            <div className={`max-w-5xl ${sections.hero.textAlign === 'center' ? 'mx-auto' : sections.hero.textAlign === 'right' ? 'ml-auto' : ''}`}>
              {/* Church Logo */}
              {church.logo_url && (
                <div className={`mb-8 ${sections.hero.textAlign === 'center' ? 'flex justify-center' : ''}`}>
                  <Image
                    src={church.logo_url}
                    alt={church.name}
                    width={100}
                    height={100}
                    className="rounded-2xl"
                  />
                </div>
              )}

              {/* Title */}
              <h1 
                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] drop-shadow-2xl"
                style={{ color: theme.textColor }}
              >
                {sections.hero.title || church.name}
              </h1>

              {/* Subtitle */}
              <p 
                className="text-xl md:text-2xl lg:text-3xl mb-12 opacity-80 max-w-3xl font-medium"
                style={{ 
                  color: theme.textColor,
                  marginLeft: sections.hero.textAlign === 'center' ? 'auto' : undefined,
                  marginRight: sections.hero.textAlign === 'center' ? 'auto' : undefined,
                }}
              >
                {sections.hero.subtitle || church.description || 'Uma comunidade de fé, esperança e amor'}
              </p>

              {/* CTAs */}
              <div className={`flex flex-wrap gap-4 ${sections.hero.textAlign === 'center' ? 'justify-center' : sections.hero.textAlign === 'right' ? 'justify-end' : ''}`}>
                {sections.hero.cta.enabled && (
                  <Link href={sections.hero.cta.link}>
                    <Button 
                      size="lg" 
                      className="rounded-full px-12 h-16 text-lg font-bold uppercase tracking-widest hover:scale-105 transition-all duration-500"
                      style={{ 
                        backgroundColor: sections.hero.cta.style === 'outline' ? 'transparent' : theme.primaryColor,
                        color: sections.hero.cta.style === 'outline' ? theme.primaryColor : theme.backgroundColor,
                        border: sections.hero.cta.style === 'outline' ? `2px solid ${theme.primaryColor}` : 'none',
                      }}
                    >
                      {sections.hero.cta.text}
                    </Button>
                  </Link>
                )}
                {sections.hero.secondaryCta?.enabled && (
                  <Link href={sections.hero.secondaryCta.link}>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="rounded-full px-12 h-16 text-lg font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-500"
                      style={{ 
                        borderColor: `${theme.textColor}40`,
                        color: theme.textColor,
                      }}
                    >
                      {sections.hero.secondaryCta.text}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
            <div 
              className="w-8 h-12 rounded-full border-2 flex items-start justify-center p-2"
              style={{ borderColor: `${theme.textColor}40` }}
            >
              <div 
                className="w-1.5 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: theme.primaryColor }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      {orderedSections.map((key) => renderSection(key))}
    </div>
  )
}
