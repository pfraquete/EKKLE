'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings, BookOpen, Medal, Target, Sparkles, 
  Loader2, Wand2, ArrowLeft
} from 'lucide-react'
import { seedDefaultGamificationData } from '@/actions/kids-gamification'
import Link from 'next/link'

export default function GamificacaoConfigPage() {
  const [seeding, setSeeding] = useState(false)
  const { toast } = useToast()

  async function handleSeedData() {
    setSeeding(true)
    const result = await seedDefaultGamificationData()
    setSeeding(false)

    if (result.success) {
      toast({
        title: 'Dados criados com sucesso!',
        description: 'Versículos, medalhas, atividades e níveis padrão foram criados.',
      })
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/rede-kids/gamificacao">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações de Gamificação
          </h1>
          <p className="text-muted-foreground">
            Gerencie versículos, medalhas, atividades e níveis
          </p>
        </div>
      </div>

      {/* Quick Setup */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Configuração Rápida
          </CardTitle>
          <CardDescription>
            Crie automaticamente versículos, medalhas, atividades e níveis padrão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeedData} disabled={seeding}>
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Criar Dados Padrão
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Isso criará 8 versículos, 10 medalhas, 6 atividades e 5 níveis de progressão.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="verses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Versículos
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            Medalhas
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Atividades
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Níveis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Versículos para Memorização</CardTitle>
              <CardDescription>
                Gerencie os versículos que as crianças podem memorizar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Em breve: Interface para gerenciar versículos
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Medalhas</CardTitle>
              <CardDescription>
                Gerencie as medalhas que as crianças podem conquistar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Em breve: Interface para gerenciar medalhas
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividades do Discípulo</CardTitle>
              <CardDescription>
                Gerencie as atividades diárias do checklist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Em breve: Interface para gerenciar atividades
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Níveis de Progressão</CardTitle>
              <CardDescription>
                Gerencie os níveis que as crianças podem alcançar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Em breve: Interface para gerenciar níveis
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
