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
                    <section key="events" className="py-24 md:py-32 bg-background relative overflow-hidden">
                        <div className="container mx-auto px-6">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-1 bg-primary rounded-full" />
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Agenda</span>
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter">
                                        Próximos Eventos
                                    </h2>
                                    <p className="text-xl text-muted-foreground max-w-lg font-medium">
                                        Participe das nossas atividades e fortaleça sua comunhão em comunidade.
                                    </p>
                                </div>
                                <Link href="/eventos">
                                    <Button variant="outline" className="rounded-full px-8 font-black border-border hover:bg-primary hover:text-primary-foreground gap-3 h-14 uppercase tracking-widest text-xs transition-all duration-500">
                                        Ver Programação <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {events.map((event) => (
                                    <Link
                                        href={`/eventos/${event.id}`}
                                        key={event.id}
                                        className="group bg-card rounded-[2.5rem] overflow-hidden border border-border/40 shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-2 transition-all duration-500"
                                    >
                                        <div className="relative aspect-[16/11] overflow-hidden bg-muted">
                                            {event.image_url ? (
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <Calendar className="w-16 h-16 text-muted-foreground/20" />
                                                </div>
                                            )}

                                            {/* Date Badge */}
                                            <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl border border-white/5">
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                                    {new Date(event.start_date).toLocaleDateString('pt-BR', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </p>
                                            </div>

                                            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
                                        </div>

                                        <div className="p-10">
                                            <h3 className="text-2xl font-black mb-5 text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                                {event.title}
                                            </h3>

                                            <div className="space-y-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-muted/50 text-primary">
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
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 rounded-xl bg-muted/50 text-primary">
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
                    <section key="courses" className="py-24 md:py-32 bg-muted/20 border-y border-border/40">
                        <div className="container mx-auto px-6">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-1 bg-primary rounded-full" />
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">EAD</span>
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter">
                                        Escola de Líderes
                                    </h2>
                                    <p className="text-xl text-muted-foreground max-w-lg font-medium">
                                        Conteúdos exclusivos para seu crescimento espiritual e ministerial.
                                    </p>
                                </div>
                                <Link href="/cursos">
                                    <Button variant="outline" className="rounded-full px-8 font-black border-border hover:bg-primary hover:text-primary-foreground gap-3 h-14 uppercase tracking-widest text-xs transition-all duration-500">
                                        Conhecer Cursos <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {courses.map((course) => (
                                    <Link
                                        href={`/cursos/${course.id}`}
                                        key={course.id}
                                        className="group bg-card rounded-[2.5rem] overflow-hidden border border-border/40 shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all duration-500"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden bg-muted/50">
                                            {course.thumbnail_url ? (
                                                <Image
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-16 h-16 text-muted-foreground/10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-10">
                                            <h3 className="text-2xl font-black mb-4 text-foreground group-hover:text-primary transition-colors leading-tight">
                                                {course.title}
                                            </h3>
                                            {course.description && (
                                                <p className="text-muted-foreground text-base leading-relaxed line-clamp-2 font-medium">
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
                    <section key="about" className="py-32 md:py-48 bg-background relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] opacity-40 animate-pulse" />
                            <div className="absolute bottom-1/4 -left-20 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[150px] opacity-30 animate-pulse" />
                        </div>

                        <div className="container mx-auto px-6 relative z-10">
                            <div className="max-w-4xl mx-auto text-center space-y-12">
                                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tighter leading-none">
                                    Sobre a <span className="text-primary italic"> {church.name}</span>
                                </h2>
                                {church.description && (
                                    <p className="text-2xl md:text-3xl text-muted-foreground leading-relaxed font-light tracking-tight italic">
                                        "{church.description}"
                                    </p>
                                )}
                                <div className="pt-10">
                                    <Link href="/sobre">
                                        <Button size="lg" className="rounded-full px-12 h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all duration-500">
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
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Hero Section */}
            {settings.hero?.enabled !== false && (
                <section className="relative min-h-[700px] md:min-h-screen flex items-center justify-center overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0 z-0">
                        {settings.hero?.backgroundUrl ? (
                            <>
                                <Image
                                    src={settings.hero.backgroundUrl}
                                    alt="Hero Background"
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="100vw"
                                    quality={100}
                                />
                                {/* Modern Mesh Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
                                <div className="absolute inset-0 bg-black/30 md:bg-black/40" />
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
                        )}

                        {/* Animated Gradient Shine */}
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                    </div>

                    {/* Content */}
                    <div className="container mx-auto px-6 relative z-10 text-center space-y-12 animate-in fade-in zoom-in-95 duration-1000 slide-in-from-bottom-12">
                        <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-[calc(-0.04em)] max-w-7xl mx-auto leading-[0.85] text-white drop-shadow-2xl">
                            {settings.hero?.title || church.name || 'EKKLE CHURCH'}
                        </h1>

                        <p className="text-xl md:text-3xl text-white/70 font-medium max-w-3xl mx-auto leading-relaxed tracking-tight">
                            {settings.hero?.subtitle || church.description || "Somos uma comunidade de fé, esperança e amor."}
                        </p>

                        {settings.hero?.cta && (
                            <div className="pt-10 scale-100 md:scale-110">
                                <Link href={settings.hero.cta.link || '/sobre'}>
                                    <Button size="lg" className="rounded-full px-12 h-16 text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-2 transition-all duration-500">
                                        {settings.hero.cta.text || 'Saiba Mais'}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
                        <div className="w-6 h-10 rounded-full border-2 border-white flex justify-center p-1">
                            <div className="w-1 h-2 bg-white rounded-full" />
                        </div>
                    </div>
                </section>
            )}

            {/* Dynamic Sections */}
            {sectionsToRender.map((key) => renderSection(key))}
        </div>
    )
}

