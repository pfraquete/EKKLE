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
                    <section key="events" className="py-16 md:py-24 bg-white">
                        <div className="container mx-auto px-4">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-2">
                                        Próximos Eventos
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Participe das nossas atividades
                                    </p>
                                </div>
                                <Link href="/eventos">
                                    <Button variant="outline" className="gap-2">
                                        Ver Todos <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map((event) => (
                                    <Link
                                        href={`/eventos/${event.id}`}
                                        key={event.id}
                                        className="group bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="relative aspect-video overflow-hidden">
                                            {event.image_url ? (
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                                                    <Calendar className="w-12 h-12 text-primary/20" />
                                                </div>
                                            )}

                                            {/* Date Badge */}
                                            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border shadow-sm">
                                                <p className="text-sm font-bold text-primary">
                                                    {new Date(event.start_date).toLocaleDateString('pt-BR', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                                {event.title}
                                            </h3>

                                            <div className="space-y-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                    <span>
                                                        {new Date(event.start_date).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-primary" />
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
                    <section key="courses" className="py-16 md:py-24 bg-gray-50/50">
                        <div className="container mx-auto px-4">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-2">
                                        Nossos Cursos
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Cresça em conhecimento e fé
                                    </p>
                                </div>
                                <Link href="/cursos">
                                    <Button variant="outline" className="gap-2">
                                        Ver Todos <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {courses.map((course) => (
                                    <Link
                                        href={`/cursos/${course.id}`}
                                        key={course.id}
                                        className="group bg-background rounded-2xl overflow-hidden border hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="relative aspect-video overflow-hidden">
                                            {course.thumbnail_url ? (
                                                <Image
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-secondary/5 flex items-center justify-center">
                                                    <BookOpen className="w-12 h-12 text-secondary/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                                {course.title}
                                            </h3>
                                            {course.description && (
                                                <p className="text-muted-foreground text-sm line-clamp-2">
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
                    <section key="about" className="py-16 md:py-24 bg-white">
                        <div className="container mx-auto px-4">
                            <div className="max-w-4xl mx-auto text-center space-y-8">
                                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                    Sobre a {church.name}
                                </h2>
                                {church.description && (
                                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                                        {church.description}
                                    </p>
                                )}
                                <div className="flex justify-center pt-4">
                                    <Link href="/sobre">
                                        <Button size="lg" className="rounded-full px-8">
                                            Conheça Nossa História
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )

            case 'store':
                // Placeholder for Store
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
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            {settings.hero?.enabled !== false && (
                <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0 z-0">
                        {settings.hero?.backgroundUrl ? (
                            <Image
                                src={settings.hero.backgroundUrl}
                                alt="Hero Background"
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-b from-primary/10 to-background" />
                        )}
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
                    </div>

                    {/* Content */}
                    <div className="container mx-auto px-4 relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
                            {settings.hero?.title || `Bem-vindo à ${church.name}`}
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            {settings.hero?.subtitle || calculateDefaultSubtitle()}
                        </p>

                        {settings.hero?.cta && (
                            <div className="pt-4">
                                <Link href={settings.hero.cta.link || '/sobre'}>
                                    <Button size="lg" className="rounded-full px-8 text-lg h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
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
