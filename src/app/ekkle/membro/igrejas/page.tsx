'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, MapPin, Users, Church, Loader2, ArrowRight, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPublicChurches, joinChurch, getAvailableStates, type PublicChurch } from '@/actions/church-affiliation'

export default function IgrejasPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [churches, setChurches] = useState<PublicChurch[]>([])
  const [states, setStates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedChurch, setSelectedChurch] = useState<PublicChurch | null>(null)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  // Load churches and states on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [churchesResult, statesResult] = await Promise.all([
        getPublicChurches(),
        getAvailableStates(),
      ])

      if (churchesResult.success && churchesResult.churches) {
        setChurches(churchesResult.churches)
      }

      if (statesResult.success && statesResult.states) {
        setStates(statesResult.states)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const result = await getPublicChurches({
        query: searchQuery || undefined,
        state: selectedState || undefined,
      })

      if (result.success && result.churches) {
        setChurches(result.churches)
      }
    } catch (err) {
      console.error('Error searching:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinChurch = async () => {
    if (!selectedChurch) return

    setJoining(true)
    setError('')

    startTransition(async () => {
      try {
        const result = await joinChurch(selectedChurch.id)

        if (result.success) {
          // Redirect to church member area
          router.push('/membro')
        } else {
          setError(result.error || 'Erro ao entrar na igreja')
        }
      } catch (err) {
        setError('Erro ao processar solicitação')
      } finally {
        setJoining(false)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Pesquisar Igrejas
        </h1>
        <p className="text-muted-foreground text-lg">
          Encontre e entre em uma comunidade de fé
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estados</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="h-12 px-6 rounded-xl font-bold"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : churches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Church className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">Nenhuma igreja encontrada</h3>
            <p className="text-muted-foreground">
              Tente ajustar seus filtros de busca ou volte mais tarde.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {churches.map((church) => (
            <Card
              key={church.id}
              className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group"
              onClick={() => setSelectedChurch(church)}
            >
              <CardContent className="p-0">
                {/* Church Header */}
                <div className="p-6 pb-4 flex items-start gap-4">
                  {church.logo_url ? (
                    <div className="w-16 h-16 relative bg-white rounded-xl overflow-hidden flex-shrink-0 border border-border">
                      <Image
                        src={church.logo_url}
                        alt={church.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Church className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg truncate group-hover:text-primary transition-colors">
                      {church.name}
                    </h3>
                    {(church.city || church.state) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {[church.city, church.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {church.description && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {church.description}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{church.member_count} membros</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all">
                    <span>Ver mais</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Church Detail Dialog */}
      <Dialog open={!!selectedChurch} onOpenChange={() => setSelectedChurch(null)}>
        <DialogContent className="max-w-md">
          {selectedChurch && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  {selectedChurch.logo_url ? (
                    <div className="w-16 h-16 relative bg-white rounded-xl overflow-hidden flex-shrink-0 border border-border">
                      <Image
                        src={selectedChurch.logo_url}
                        alt={selectedChurch.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Church className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-xl">{selectedChurch.name}</DialogTitle>
                    {(selectedChurch.city || selectedChurch.state) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {[selectedChurch.city, selectedChurch.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <DialogDescription className="text-left">
                  {selectedChurch.description || 'Esta igreja não possui descrição.'}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedChurch.member_count} membros ativos</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedChurch(null)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleJoinChurch}
                  disabled={joining || isPending}
                  className="rounded-xl font-bold"
                >
                  {joining || isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Church className="w-4 h-4 mr-2" />
                      Entrar na Igreja
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
