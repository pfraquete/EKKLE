'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrayerItemCard } from './prayer-item-card'
import { Heart, BookOpen, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PrayerItem } from '@/actions/prayers'

interface PrayerItemsListProps {
  items: PrayerItem[]
  onItemAnswered?: () => void
}

const tabs = [
  { value: 'all', label: 'Todos', icon: null },
  { value: 'MOTIVO', label: 'Motivos', icon: Heart, color: 'text-rose-500' },
  { value: 'PROMESSA', label: 'Promessas', icon: BookOpen, color: 'text-blue-500' },
  { value: 'TRANSFORMACAO', label: 'Transformacoes', icon: Sparkles, color: 'text-purple-500' },
  { value: 'PESSOA', label: 'Pessoas', icon: Users, color: 'text-emerald-500' },
]

export function PrayerItemsList({ items, onItemAnswered }: PrayerItemsListProps) {
  const [activeTab, setActiveTab] = useState('all')

  const filteredItems =
    activeTab === 'all'
      ? items
      : items.filter((item) => item.item_type === activeTab)

  const getCounts = () => {
    return {
      all: items.length,
      MOTIVO: items.filter((i) => i.item_type === 'MOTIVO').length,
      PROMESSA: items.filter((i) => i.item_type === 'PROMESSA').length,
      TRANSFORMACAO: items.filter((i) => i.item_type === 'TRANSFORMACAO').length,
      PESSOA: items.filter((i) => i.item_type === 'PESSOA').length,
    }
  }

  const counts = getCounts()

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">
          Nenhum item extraido desta oracao ainda.
        </p>
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/30 p-1 rounded-xl">
        {tabs.map((tab) => {
          const count = counts[tab.value as keyof typeof counts]
          if (tab.value !== 'all' && count === 0) return null

          const Icon = tab.icon

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg',
                'data-[state=active]:bg-background data-[state=active]:shadow-sm'
              )}
            >
              {Icon && <Icon className={cn('w-3.5 h-3.5', tab.color)} />}
              <span>{tab.label}</span>
              <span className="text-xs text-muted-foreground">({count})</span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      <TabsContent value={activeTab} className="mt-4 space-y-3">
        {filteredItems.map((item) => (
          <PrayerItemCard
            key={item.id}
            item={item}
            onAnswered={onItemAnswered}
          />
        ))}
      </TabsContent>
    </Tabs>
  )
}
