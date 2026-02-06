import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberTithes, getChurchPixInfo } from '@/actions/tithes'
import { Heart, Upload, Calendar, CheckCircle, Clock, QrCode } from 'lucide-react'
import { TitheTable } from '@/components/tithe/tithe-table'
import { PixCopyButton } from '@/components/tithe/pix-copy-button'

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default async function DizimosPage() {
    const church = await getChurch()
    const supabase = await createClient()

    if (!church) {
        redirect('/')
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const currentYear = new Date().getFullYear()

    // Fetch data
    const [tithesResult, pixResult] = await Promise.all([
        getMemberTithes(currentYear),
        getChurchPixInfo(),
    ])

    const tithesByMonth = tithesResult.success ? tithesResult.data || {} : {}
    const pixInfo = pixResult.success ? pixResult.data : null

    // Build months array with tithe data
    const monthsData = MONTHS.map((name, index) => {
        const month = index + 1
        const tithe = tithesByMonth[month]
        return {
            month,
            name,
            tithe: tithe || null,
        }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                    Dízimos e Ofertas
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">
                    Registre seus dízimos e envie comprovantes
                </p>
            </div>

            {/* PIX Info Card */}
            {pixInfo?.pixKey && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <QrCode className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-5 h-5 text-primary" />
                                <h2 className="text-lg sm:text-xl font-black text-foreground">
                                    PIX da Igreja
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Faça seu dízimo diretamente pelo PIX
                            </p>
                            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                            Chave {pixInfo.pixKeyType?.toUpperCase()}
                                        </p>
                                        <p className="font-mono text-sm sm:text-base font-bold text-foreground truncate">
                                            {pixInfo.pixKey}
                                        </p>
                                    </div>
                                    <PixCopyButton pixKey={pixInfo.pixKey} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No PIX Configured Warning */}
            {!pixInfo?.pixKey && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
                    <Heart className="w-10 h-10 mx-auto mb-3 text-amber-500/60" />
                    <h3 className="font-bold text-foreground mb-1">PIX não configurado</h3>
                    <p className="text-sm text-muted-foreground">
                        A igreja ainda não configurou a chave PIX para receber dízimos
                    </p>
                </div>
            )}

            {/* Tithes Table */}
            <section>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-primary rounded-full" />
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight">
                        Meus Dízimos - {currentYear}
                    </h2>
                </div>

                <TitheTable monthsData={monthsData} currentYear={currentYear} />
            </section>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <span>Não registrado</span>
                </div>
            </div>
        </div>
    )
}

