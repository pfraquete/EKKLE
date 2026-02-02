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
    <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/40 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Crescimento</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-muted-foreground">Membros</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-muted-foreground">Visitantes</span>
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
                <div className="w-full flex gap-1 items-end h-40">
                  {/* Members bar */}
                  <div
                    className="flex-1 bg-gradient-to-t from-primary to-primary/70 rounded-t-lg transition-all duration-500 hover:scale-105 relative group"
                    style={{ height: `${membersHeight}%`, minHeight: item.members > 0 ? '8px' : '0' }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-xs font-bold whitespace-nowrap shadow-lg">
                      {item.members}
                    </div>
                  </div>

                  {/* Visitors bar */}
                  <div
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:scale-105 relative group"
                    style={{ height: `${visitorsHeight}%`, minHeight: item.visitors > 0 ? '8px' : '0' }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-xs font-bold whitespace-nowrap shadow-lg">
                      {item.visitors}
                    </div>
                  </div>
                </div>

                {/* Month label */}
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {item.month}
                </span>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-black text-foreground">
              {data.reduce((sum, d) => sum + d.members, 0)}
            </p>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Total Membros
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-foreground">
              {data.reduce((sum, d) => sum + d.visitors, 0)}
            </p>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Total Visitantes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
