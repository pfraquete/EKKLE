'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface GrowthData {
  month: string
  members: number
  visitors: number
}

interface GrowthChartProps {
  data: GrowthData[]
}

export function GrowthChart({ data }: GrowthChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.members, d.visitors)))
  const scale = 100 / maxValue

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-black-elevated/50 pb-4 border-b border-gray-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-white-primary">Crescimento</CardTitle>
            <CardDescription className="text-gray-text-secondary">Últimos 6 meses</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gold-dark to-gold"></div>
            <span className="text-sm font-medium text-gray-text-secondary">Membros</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <span className="text-sm font-medium text-gray-text-secondary">Visitantes</span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-48 flex items-end gap-3">
          {data.map((item, index) => {
            const membersHeight = item.members * scale
            const visitorsHeight = item.visitors * scale

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                {/* Bars */}
                <div className="w-full flex gap-1.5 items-end h-40">
                  {/* Members bar */}
                  <div
                    className="flex-1 bg-gradient-to-t from-gold-dark via-gold to-gold-light rounded-t-lg transition-all duration-500 hover:scale-105 relative group shadow-gold-glow-subtle"
                    style={{ height: `${membersHeight}%`, minHeight: item.members > 0 ? '8px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black-surface border border-gray-border rounded-lg px-3 py-1.5 text-xs font-bold text-gold whitespace-nowrap shadow-premium-lg z-10">
                      {item.members}
                    </div>
                  </div>

                  {/* Visitors bar */}
                  <div
                    className="flex-1 bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:scale-105 relative group"
                    style={{ height: `${visitorsHeight}%`, minHeight: item.visitors > 0 ? '8px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black-surface border border-gray-border rounded-lg px-3 py-1.5 text-xs font-bold text-blue-400 whitespace-nowrap shadow-premium-lg z-10">
                      {item.visitors}
                    </div>
                  </div>
                </div>

                {/* Month label */}
                <span className="text-xs font-bold text-gray-text-muted uppercase tracking-wider">
                  {item.month}
                </span>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-border">
          <div className="text-center p-4 rounded-xl bg-black-elevated/50">
            <p className="text-2xl font-black text-gold">
              {data.reduce((sum, d) => sum + d.members, 0)}
            </p>
            <p className="text-xs text-gray-text-secondary font-bold uppercase tracking-wider mt-1">
              Total Membros
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-black-elevated/50">
            <p className="text-2xl font-black text-white-primary">
              {data.reduce((sum, d) => sum + d.visitors, 0)}
            </p>
            <p className="text-xs text-gray-text-secondary font-bold uppercase tracking-wider mt-1">
              Total Visitantes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
