import Link from 'next/link'
import Image from 'next/image'
import { getChurch } from '@/lib/get-church' // We'll make sure this exists or use a direct query
import { createClient } from '@/lib/supabase/server'
import { Calendar, BookOpen, MapPin, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HomepageSettings } from '@/actions/homepage'

export const revalidate = 60 // Revalidate every minute

export default async function Homepage() {
    const church = await getChurch()
    if (!church) return null

    const supabase = await createClient()

    // 1. Fetch Homepage Settings
    const websiteSettings = (church.website_settings || {}) as Record<string, unknown>
    const settings = (websiteSettings.homepage || {}) as HomepageSettings

    // 2. Fetch Data for Sections
    // Events (Upcoming 3)
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('church_id', church.id)
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3)

    // Courses (Latest 3)
    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('church_id', church.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3)

    // Helper to render sections
    const renderSection = (key: string) => {
        switch (key) {
            case 'events':
                return events && events.length > 0 ? (
                    <section key="events" className="py-20 md:py-28 bg-white">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                                <div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                                        Próximos Eventos
                                    </h2>
                                    <p className="text-lg text-gray-500 max-w-lg">
                                        Participe das nossas atividades e fortaleça sua comunhão.
                                    </p>
                                </div>
                                <Link href="/eventos">
                                    <Button variant="outline" className="rounded-full px-6 font-semibold border-gray-200 hover:bg-gray-50 hover:text-primary gap-2 h-12">
                                        Ver Todos <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map((event) => (
                                    <Link
                                        href={`/eventos/${event.id}`}
                                        key={event.id}
                                        className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                            {event.image_url ? (
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                    <Calendar className="w-12 h-12 text-gray-300" />
                                                </div>
                                            )}

                                            {/* Date Badge */}
                                            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm">
                                                <p className="text-sm font-bold text-gray-900">
                                                    {new Date(event.start_date).toLocaleDateString('pt-BR', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-8">
                                            <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                                                {event.title}
                                            </h3>

                                            <div className="space-y-3 text-sm text-gray-500 font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-full bg-gray-50 text-primary">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <span>
                                                        {new Date(event.start_date).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-full bg-gray-50 text-primary">
                                                            <MapPin className="w-4 h-4" />
                                                        </div>
                                                        <span className="truncate">{event.location}</span>
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

            case 'courses':
                return courses && courses.length > 0 ? (
                    <section key="courses" className="py-20 md:py-28 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                                <div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                                        Nossos Cursos
                                    </h2>
                                    <p className="text-lg text-gray-500 max-w-lg">
                                        Conteúdos para seu crescimento espiritual e ministerial.
                                    </p>
                                </div>
                                <Link href="/cursos">
                                    <Button variant="outline" className="rounded-full px-6 font-semibold border-gray-200 hover:bg-white hover:text-primary gap-2 h-12">
                                        Ver Todos <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {courses.map((course) => (
                                    <Link
                                        href={`/cursos/${course.id}`}
                                        key={course.id}
                                        className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                            {course.thumbnail_url ? (
                                                <Image
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-secondary/5">
                                                    <BookOpen className="w-12 h-12 text-secondary/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-8">
                                            <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors">
                                                {course.title}
                                            </h3>
                                            {course.description && (
                                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                                                    {course.description}
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
                return (
                    <section key="about" className="py-24 md:py-32 bg-white relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
                            <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl opacity-50" />
                        </div>

                        <div className="container mx-auto px-4 relative z-10">
                            <div className="max-w-4xl mx-auto text-center space-y-10">
                                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                                    Sobre a {church.name}
                                </h2>
                                {church.description && (
                                    <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light">
                                        {church.description}
                                    </p>
                                )}
                                <div className="pt-6">
                                    <Link href="/sobre">
                                        <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                            Conheça Nossa História
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )

            case 'store':
                return null

            default:
                return null
        }
    }

    // Determine section order
    const sections = Object.entries(settings.sections || {})
        .filter(([, config]) => config.enabled)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key]) => key)

    // Default section order if nothing configured
    const sectionsToRender = sections.length > 0
        ? sections
        : ['events', 'courses', 'about']

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-900">
            {/* Hero Section */}
            {settings.hero?.enabled !== false && (
                <section className="relative min-h-[650px] md:min-h-[800px] flex items-center justify-center overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0 z-0">
                        {settings.hero?.backgroundUrl ? (
                            <Image
                                src={settings.hero.backgroundUrl}
                                alt="Hero Background"
                                fill
                                className="object-cover"
                                priority
                                sizes="100vw"
                                quality={90}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-100" />
                        )}
                        {/* Cleaner Overlay */}
                        <div className={`absolute inset-0 ${settings.hero?.backgroundUrl ? 'bg-black/40' : 'bg-transparent'}`} />

                        {/* Gradient Overlay for text readability if image exists, or subtle color if not */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90" />
                    </div>

                    {/* Content */}
                    <div className="container mx-auto px-4 relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8">
                        <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter max-w-5xl mx-auto leading-[0.9] ${settings.hero?.backgroundUrl ? 'text-gray-900' : 'text-gray-900'}`}>
                            {settings.hero?.title || `Bem-vindo à ${church.name}`}
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                            {settings.hero?.subtitle || calculateDefaultSubtitle()}
                        </p>

                        {settings.hero?.cta && (
                            <div className="pt-8">
                                <Link href={settings.hero.cta.link || '/sobre'}>
                                    <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                        {settings.hero.cta.text || 'Saiba Mais'}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Dynamic Sections */}
            {sectionsToRender.map((key) => renderSection(key))}
        </div>
    )
}

function calculateDefaultSubtitle() {
    return "Somos uma comunidade de fé, esperança e amor."
}
