'use client'

import { Button } from '@/components/ui/button'
import { 
    Plus, 
    Download, 
    MessageSquare, 
    Sparkles,
    ChevronRight,
    Bell
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
    churchName?: string
    whatsappStatus?: 'CONNECTED' | 'DISCONNECTED' | null
    pendingAlerts?: number
}

export function DashboardHeader({ 
    churchName = 'Igreja', 
    whatsappStatus,
    pendingAlerts = 0 
}: DashboardHeaderProps) {
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Bom dia'
        if (hour < 18) return 'Boa tarde'
        return 'Boa noite'
    }

    const getTimeEmoji = () => {
        const hour = new Date().getHours()
        if (hour < 6) return '🌙'
        if (hour < 12) return '☀️'
        if (hour < 18) return '🌤️'
        return '🌙'
    }

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black-surface/90 via-black-surface/70 to-black-elevated/50 backdrop-blur-xl border border-gray-border/50 p-6 mb-6">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(212,175,55,0.3) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }} />
            </div>

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Side - Greeting */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold-dark rounded-2xl flex items-center justify-center shadow-gold-glow">
                                <Sparkles className="h-7 w-7 text-black-absolute" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 text-lg">
                                {getTimeEmoji()}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-text-secondary font-medium">
                                {getGreeting()}, Pastor
                            </p>
                            <h1 className="text-2xl lg:text-3xl font-black text-white-primary tracking-tight">
                                Visão Geral
                            </h1>
                        </div>
                    </div>
                    <p className="text-sm text-gray-text-muted pl-[68px]">
                        Painel Pastoral • <span className="text-gold font-semibold">{churchName}</span>
                    </p>
                </div>

                {/* Right Side - Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Alerts Badge */}
                    {pendingAlerts > 0 && (
                        <Link href="/admin/alerts">
                            <Button
                                variant="outline"
                                className={cn(
                                    "relative rounded-2xl h-12 px-4 font-bold",
                                    "bg-red-500/10 border-red-500/30 text-red-400",
                                    "hover:bg-red-500/20 hover:border-red-500/50"
                                )}
                            >
                                <Bell className="h-5 w-5 mr-2" />
                                {pendingAlerts} Alerta{pendingAlerts > 1 ? 's' : ''}
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            </Button>
                        </Link>
                    )}

                    {/* WhatsApp Status */}
                    <Link href="/configuracoes/whatsapp" className="hidden sm:block">
                        <Button
                            variant="outline"
                            className={cn(
                                "rounded-2xl h-12 px-5 font-bold transition-all duration-300",
                                whatsappStatus === 'CONNECTED' 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                                    : "hover:border-gray-border"
                            )}
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            {whatsappStatus === 'CONNECTED' ? (
                                <span className="flex items-center gap-2">
                                    WhatsApp Ativo
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                </span>
                            ) : (
                                'Configurar Zap'
                            )}
                        </Button>
                    </Link>

                    {/* Import Button */}
                    <Link href="/importar" className="hidden sm:block">
                        <Button 
                            variant="outline" 
                            className="rounded-2xl h-12 px-5 font-bold hover:border-gold/50 hover:text-gold transition-all duration-300"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            Importar
                        </Button>
                    </Link>

                    {/* New Cell Button */}
                    <Link href="/celulas/nova" className="flex-1 sm:flex-none">
                        <Button 
                            className={cn(
                                "w-full sm:w-auto rounded-2xl h-12 px-6 font-bold",
                                "bg-gradient-to-r from-gold to-gold-dark text-black-absolute",
                                "shadow-gold-glow hover:shadow-gold-glow-strong",
                                "transition-all duration-300 hover:scale-105",
                                "group"
                            )}
                        >
                            <Plus className="h-5 w-5 mr-2 transition-transform group-hover:rotate-90 duration-300" />
                            Nova Célula
                            <ChevronRight className="h-4 w-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
