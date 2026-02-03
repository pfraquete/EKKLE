'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GrowthData {
  month: string
  members: number
  visitors: number
}

interface ModernGrowthChartProps {
  data: GrowthData[]
}

export function ModernGrowthChart({ data }: ModernGrowthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeMetric, setActiveMetric] = useState<'all' | 'members' | 'visitors'>('all')

  if (!data || data.length === 0) {
    return null
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.members, d.visitors)))
  const scale = 100 / (maxValue || 1)

  const totalMembers = data.reduce((sum, d) => sum + d.members, 0)
  const totalVisitors = data.reduce((sum, d) => sum + d.visitors, 0)
  
  // Calculate growth percentage
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstHalfMembers = firstHalf.reduce((sum, d) => sum + d.members, 0)
  const secondHalfMembers = secondHalf.reduce((sum, d) => sum + d.members, 0)
  const growthPercentage = firstHalfMembers > 0 
    ? Math.round(((secondHalfMembers - firstHalfMembers) / firstHalfMembers) * 100) 
    : 0

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-black-surface/90 via-black-surface/70 to-black-elevated/50 backdrop-blur-xl border-gray-border/50">
      {/* Header with Glassmorphism */}
      <CardHeader className="relative pb-4 border-b border-gray-border/50">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-transparent" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 text-gold rounded-2xl flex items-center justify-center shadow-gold-glow-subtle">
                <BarChart3 className="h-7 w-7" />
              </div>
              {/* Animated Ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-gold/20 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white-primary tracking-tight">
                Crescimento
              </CardTitle>
              <CardDescription className="text-gray-text-secondary flex items-center gap-2">
                Últimos 6 meses
                {growthPercentage !== 0 && (
                  <span className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full',
                    growthPercentage > 0 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  )}>
                    {growthPercentage > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(growthPercentage)}%
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          
          {/* Metric Toggles */}
          <div className="flex items-center gap-1 p-1 bg-black-elevated/80 rounded-xl border border-gray-border/50">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'members', label: 'Membros' },
              { key: 'visitors', label: 'Visitantes' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveMetric(item.key as typeof activeMetric)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300',
                  activeMetric === item.key
                    ? 'bg-gold text-black-absolute shadow-gold-glow-subtle'
                    : 'text-gray-text-secondary hover:text-white-primary hover:bg-black-surface'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          {(activeMetric === 'all' || activeMetric === 'members') && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light shadow-gold-glow-subtle" />
              <span className="text-sm font-medium text-gray-text-secondary">Membros</span>
            </div>
          )}
          {(activeMetric === 'all' || activeMetric === 'visitors') && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
              <span className="text-sm font-medium text-gray-text-secondary">Visitantes</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="relative h-56 flex items-end gap-4">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-gray-border/20 w-full" />
            ))}
          </div>

          {data.map((item, index) => {
            const membersHeight = item.members * scale
            const visitorsHeight = item.visitors * scale
            const isHovered = hoveredIndex === index

            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center gap-3 relative z-10"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                <div className={cn(
                  'absolute -top-16 left-1/2 -translate-x-1/2 z-20',
                  'bg-black-surface/95 backdrop-blur-xl border border-gray-border rounded-xl',
                  'px-4 py-3 shadow-premium-xl',
                  'transition-all duration-300',
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                )}>
                  <p className="text-xs font-bold text-white-primary mb-1">{item.month}</p>
                  <div className="flex items-center gap-3">
                    {(activeMetric === 'all' || activeMetric === 'members') && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gold" />
                        <span className="text-xs font-bold text-gold">{item.members}</span>
                      </div>
                    )}
                    {(activeMetric === 'all' || activeMetric === 'visitors') && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-xs font-bold text-blue-400">{item.visitors}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bars Container */}
                <div className="w-full flex gap-2 items-end h-48">
                  {/* Members bar */}
                  {(activeMetric === 'all' || activeMetric === 'members') && (
                    <div
                      className={cn(
                        'flex-1 rounded-t-xl transition-all duration-500 relative overflow-hidden',
                        'bg-gradient-to-t from-gold-dark via-gold to-gold-light',
                        isHovered ? 'shadow-gold-glow scale-105' : 'shadow-gold-glow-subtle'
                      )}
                      style={{ 
                        height: `${membersHeight}%`, 
                        minHeight: item.members > 0 ? '12px' : '0',
                        transitionDelay: `${index * 50}ms`
                      }}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  )}

                  {/* Visitors bar */}
                  {(activeMetric === 'all' || activeMetric === 'visitors') && (
                    <div
                      className={cn(
                        'flex-1 rounded-t-xl transition-all duration-500 relative overflow-hidden',
                        'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400',
                        isHovered ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' : ''
                      )}
                      style={{ 
                        height: `${visitorsHeight}%`, 
                        minHeight: item.visitors > 0 ? '12px' : '0',
                        transitionDelay: `${index * 50 + 25}ms`
                      }}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  )}
                </div>

                {/* Month label */}
                <span className={cn(
                  'text-xs font-bold uppercase tracking-wider transition-colors duration-300',
                  isHovered ? 'text-gold' : 'text-gray-text-muted'
                )}>
                  {item.month}
                </span>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-border/50">
          <div className="relative overflow-hidden text-center p-5 rounded-2xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent opacity-50" />
            <div className="relative">
              <p className="text-3xl font-black text-gold tracking-tight">
                {totalMembers}
              </p>
              <p className="text-xs text-gray-text-secondary font-bold uppercase tracking-[0.15em] mt-2">
                Total Membros
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden text-center p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-50" />
            <div className="relative">
              <p className="text-3xl font-black text-white-primary tracking-tight">
                {totalVisitors}
              </p>
              <p className="text-xs text-gray-text-secondary font-bold uppercase tracking-[0.15em] mt-2">
                Total Visitantes
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
