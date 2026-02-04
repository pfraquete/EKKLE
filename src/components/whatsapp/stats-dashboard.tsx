'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Bot, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'

interface StatsDashboardProps {
  churchId: string
  isAgentActive: boolean
}

interface Stats {
  totalToday: number
  answeredByAgent: number
  pendingAttention: number
  totalContacts: number
}

export function StatsDashboard({ churchId, isAgentActive }: StatsDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalToday: 0,
    answeredByAgent: 0,
    pendingAttention: 0,
    totalContacts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Fetch messages from today
        const { data: messages, error } = await supabase
          .from('whatsapp_messages')
          .select('direction, from_number, to_number')
          .eq('church_id', churchId)
          .gte('sent_at', today.toISOString())
          .lt('sent_at', tomorrow.toISOString())

        if (error) {
          console.error('Error fetching stats:', error)
          return
        }

        // Calculate stats
        const inbound = messages?.filter(m => m.direction === 'inbound') || []
        const outbound = messages?.filter(m => m.direction === 'outbound') || []
        
        // Get unique contacts
        const uniqueContacts = new Set(
          messages?.map(m => m.direction === 'inbound' ? m.from_number : m.to_number)
        )

        // Count messages that were answered (inbound followed by outbound to same number)
        const inboundNumbers = new Set(inbound.map(m => m.from_number))
        const answeredNumbers = outbound.filter(m => inboundNumbers.has(m.to_number))

        setStats({
          totalToday: inbound.length,
          answeredByAgent: answeredNumbers.length,
          pendingAttention: Math.max(0, inbound.length - answeredNumbers.length),
          totalContacts: uniqueContacts.size
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [churchId])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="h-24 bg-muted/30" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.totalToday}</p>
                <p className="text-xs text-muted-foreground">Mensagens hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Bot className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.answeredByAgent}</p>
                <p className="text-xs text-muted-foreground">Respondidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-0",
          stats.pendingAttention > 0 
            ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5" 
            : "bg-gradient-to-br from-gray-500/10 to-gray-600/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                stats.pendingAttention > 0 ? "bg-amber-500/10" : "bg-gray-500/10"
              )}>
                <AlertCircle className={cn(
                  "h-5 w-5",
                  stats.pendingAttention > 0 ? "text-amber-600" : "text-gray-500"
                )} />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.pendingAttention}</p>
                <p className="text-xs text-muted-foreground">Aguardando você</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.totalContacts}</p>
                <p className="text-xs text-muted-foreground">Contatos ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending messages */}
      {stats.pendingAttention > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm">
                <span className="font-bold">{stats.pendingAttention} {stats.pendingAttention === 1 ? 'pessoa precisa' : 'pessoas precisam'}</span> da sua atenção pessoal.
                {!isAgentActive && (
                  <span className="text-muted-foreground"> Ative o assistente para respostas automáticas.</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success message when all caught up */}
      {stats.totalToday > 0 && stats.pendingAttention === 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <p className="text-sm">
                <span className="font-bold">Tudo em dia!</span> Todas as mensagens de hoje foram respondidas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
