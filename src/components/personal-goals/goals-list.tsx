'use client'

import { useState } from 'react'
import { GoalCard } from './goal-card'
import { GoalForm } from './goal-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Plus, Target, CheckCircle2, Clock, Trophy } from 'lucide-react'
import type { PersonalGoal } from '@/actions/personal-goals'

interface GoalsListProps {
  goals: PersonalGoal[]
  onRefresh?: () => void
}

export function GoalsList({ goals, onRefresh }: GoalsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null)
  const [activeTab, setActiveTab] = useState('pending')

  const pendingGoals = goals.filter((g) => !g.is_completed)
  const completedGoals = goals.filter((g) => g.is_completed)

  const handleEdit = (goal: PersonalGoal) => {
    setEditingGoal(goal)
    setIsFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingGoal(null)
    }
  }

  const handleSuccess = () => {
    onRefresh?.()
  }

  // Stats
  const totalGoals = goals.length
  const completedCount = completedGoals.length
  const completionRate = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {totalGoals > 0 && (
        <div className="flex items-center justify-between p-3 bg-card border rounded-xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{totalGoals} alvos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">{completedCount} realizados</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-500">{completionRate}%</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pendentes ({pendingGoals.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Realizados ({completedGoals.length})
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setIsFormOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Alvo
          </Button>
        </div>

        <TabsContent value="pending" className="mt-4">
          {pendingGoals.length > 0 ? (
            <div className="space-y-3">
              {pendingGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleSuccess}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="Nenhum alvo pendente"
              description="Crie seu primeiro alvo pessoal e comece a trilhar o caminho das suas conquistas!"
              action={
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Alvo
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedGoals.length > 0 ? (
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleSuccess}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="Nenhum alvo realizado ainda"
              description="Continue perseverando! Seus alvos realizados aparecerão aqui."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <GoalForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        goal={editingGoal}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
      <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action}
    </div>
  )
}
