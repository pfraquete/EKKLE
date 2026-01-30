'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Calendar, Clock, Users, CheckCircle, Flame, Share2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generatePrayerReport, getLatestReport, sharePrayerReport } from '@/actions/prayers'
import type { PrayerReport } from '@/actions/prayers'

export default function RelatoriosOracaoPage() {
  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [weeklyReport, setWeeklyReport] = useState<PrayerReport | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<PrayerReport | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  // Load existing reports on mount
  useEffect(() => {
    const loadReports = async () => {
      const [weeklyResult, monthlyResult] = await Promise.all([
        getLatestReport('WEEKLY'),
        getLatestReport('MONTHLY'),
      ])

      if (weeklyResult.success && weeklyResult.report) {
        setWeeklyReport(weeklyResult.report)
      }
      if (monthlyResult.success && monthlyResult.report) {
        setMonthlyReport(monthlyResult.report)
      }
    }
    loadReports()
  }, [])

  const handleGenerate = async (type: 'WEEKLY' | 'MONTHLY') => {
    setIsGenerating(true)
    try {
      const result = await generatePrayerReport(type)
      if (result.success && result.report) {
        if (type === 'WEEKLY') {
          setWeeklyReport(result.report)
        } else {
          setMonthlyReport(result.report)
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async (reportId: string) => {
    setIsSharing(true)
    try {
      const result = await sharePrayerReport(reportId)
      if (result.success && result.shareToken) {
        const url = `${window.location.origin}/relatorio/${result.shareToken}`
        setShareUrl(url)
        navigator.clipboard.writeText(url)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const currentReport = activeTab === 'WEEKLY' ? weeklyReport : monthlyReport

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/membro/biblia-oracao/oracao"
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Relatorios de Oracao
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Seu resumo espiritual estilo Spotify Wrapped
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'WEEKLY' | 'MONTHLY')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="WEEKLY">Semanal</TabsTrigger>
          <TabsTrigger value="MONTHLY">Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="WEEKLY" className="mt-6">
          {weeklyReport ? (
            <ReportCard
              report={weeklyReport}
              onShare={() => handleShare(weeklyReport.id)}
              isSharing={isSharing}
              shareUrl={shareUrl}
            />
          ) : (
            <EmptyReportState
              type="semanal"
              onGenerate={() => handleGenerate('WEEKLY')}
              isGenerating={isGenerating}
            />
          )}
        </TabsContent>

        <TabsContent value="MONTHLY" className="mt-6">
          {monthlyReport ? (
            <ReportCard
              report={monthlyReport}
              onShare={() => handleShare(monthlyReport.id)}
              isSharing={isSharing}
              shareUrl={shareUrl}
            />
          ) : (
            <EmptyReportState
              type="mensal"
              onGenerate={() => handleGenerate('MONTHLY')}
              isGenerating={isGenerating}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Generate New Report */}
      {currentReport && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => handleGenerate(activeTab)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar Novo Relatorio
          </Button>
        </div>
      )}
    </div>
  )
}

// Report Card Component
function ReportCard({
  report,
  onShare,
  isSharing,
  shareUrl,
}: {
  report: PrayerReport
  onShare: () => void
  isSharing: boolean
  shareUrl: string | null
}) {
  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Card - Spotify Style */}
      <Card className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 border-0 text-primary-foreground overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">
              {report.report_type === 'WEEKLY' ? 'Sua Semana de Oracao' : 'Seu Mes de Oracao'}
            </p>
            <p className="text-sm opacity-60">
              {formatPeriod(report.report_period_start, report.report_period_end)}
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-white/10 rounded-2xl">
              <Calendar className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <div className="text-4xl font-black">{report.total_prayers}</div>
              <p className="text-xs uppercase tracking-wider opacity-70">Oracoes</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <div className="text-4xl font-black">{report.total_minutes}</div>
              <p className="text-xs uppercase tracking-wider opacity-70">Minutos</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl">
              <Users className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <div className="text-4xl font-black">{report.total_people_prayed}</div>
              <p className="text-xs uppercase tracking-wider opacity-70">Pessoas</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <div className="text-4xl font-black">{report.total_answered_prayers}</div>
              <p className="text-xs uppercase tracking-wider opacity-70">Respondidas</p>
            </div>
          </div>

          {/* Longest Session */}
          {report.longest_session_minutes > 0 && (
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-xs uppercase tracking-wider opacity-60 mb-1">
                Maior sessao de oracao
              </p>
              <p className="text-lg font-bold">{report.longest_session_minutes} minutos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Encouragement */}
      {report.ai_encouragement && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Mensagem de Encorajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{report.ai_encouragement}</p>
          </CardContent>
        </Card>
      )}

      {/* Top Pessoas */}
      {report.top_pessoas && report.top_pessoas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Pessoas mais intercedidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.top_pessoas.slice(0, 5).map((pessoa, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="font-medium">{pessoa.name}</span>
                  <span className="text-sm text-muted-foreground">{pessoa.count}x</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Button */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onShare} disabled={isSharing}>
          {isSharing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          Compartilhar
        </Button>
      </div>

      {shareUrl && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
          <p className="text-xs text-emerald-600 font-medium">Link copiado para a area de transferencia!</p>
        </div>
      )}
    </div>
  )
}

// Empty State Component
function EmptyReportState({
  type,
  onGenerate,
  isGenerating,
}: {
  type: string
  onGenerate: () => void
  isGenerating: boolean
}) {
  return (
    <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <h3 className="text-lg font-bold text-foreground mb-2">
        Nenhum relatorio {type} ainda
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Gere seu primeiro relatorio para ver um resumo das suas oracoes
      </p>
      <Button onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        Gerar Relatorio
      </Button>
    </div>
  )
}
