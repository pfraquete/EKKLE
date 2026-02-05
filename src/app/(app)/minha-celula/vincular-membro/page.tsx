'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Link2, User, Mail, Phone, Calendar, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  getVisitorProfiles, 
  searchProfilesForLinking, 
  linkProfiles,
  VisitorProfile 
} from '@/actions/member-linking'

export default function LinkMemberPage() {
  const [loading, setLoading] = useState(true)
  const [visitors, setVisitors] = useState<VisitorProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    visitors: VisitorProfile[]
    realProfiles: Array<{ id: string; full_name: string; email: string; phone: string | null }>
  } | null>(null)
  const [searching, setSearching] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorProfile | null>(null)
  const [selectedRealProfile, setSelectedRealProfile] = useState<{ id: string; full_name: string; email: string } | null>(null)
  const [linking, setLinking] = useState(false)
  const [linkResult, setLinkResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadVisitors()
  }, [])

  const loadVisitors = async () => {
    setLoading(true)
    const result = await getVisitorProfiles()
    if (result.success && result.data) {
      setVisitors(result.data)
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    const result = await searchProfilesForLinking(searchQuery)
    if (result.success) {
      setSearchResults({
        visitors: result.visitors || [],
        realProfiles: result.realProfiles || [],
      })
    }
    setSearching(false)
  }

  const handleLink = async () => {
    if (!selectedVisitor || !selectedRealProfile) return

    setLinking(true)
    setLinkResult(null)

    const result = await linkProfiles({
      visitor_profile_id: selectedVisitor.id,
      real_profile_id: selectedRealProfile.id,
    })

    if (result.success) {
      setLinkResult({
        success: true,
        message: `Perfis vinculados com sucesso! ${result.transferred?.attendance_records || 0} registros de presença foram transferidos.`,
      })
      // Reset selection
      setSelectedVisitor(null)
      setSelectedRealProfile(null)
      setSearchResults(null)
      setSearchQuery('')
      // Reload visitors
      loadVisitors()
    } else {
      setLinkResult({
        success: false,
        message: result.error || 'Erro ao vincular perfis',
      })
    }

    setLinking(false)
  }

  const getMemberStageBadge = (stage: string) => {
    const stages: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      VISITOR: { label: 'Visitante', variant: 'outline' },
      REGULAR_VISITOR: { label: 'Visitante Frequente', variant: 'secondary' },
      MEMBER: { label: 'Membro', variant: 'default' },
    }
    const config = stages[stage] || { label: stage, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/minha-celula/membros">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white-primary flex items-center gap-3">
            <Link2 className="w-7 h-7 text-gold" />
            Vincular Visitante a Conta
          </h1>
          <p className="text-gray-text-secondary">
            Transfira o histórico de um visitante para uma conta real
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Users className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">Como funciona?</h3>
              <p className="text-gray-text-secondary text-sm">
                Quando você cria um membro manualmente (sem email), ele é um &quot;visitante&quot;. 
                Quando essa pessoa cria uma conta real com email e senha, você pode vincular 
                os dois perfis para transferir todo o histórico de presença e participação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link Result */}
      {linkResult && (
        <Card className={linkResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {linkResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <p className={linkResult.success ? 'text-green-400' : 'text-red-400'}>
                {linkResult.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Buscar Perfis</CardTitle>
          <CardDescription>
            Busque pelo nome para encontrar o visitante e a conta real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text-muted" />
              <Input
                placeholder="Digite o nome do membro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>

          {searchResults && (
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              {/* Visitors Column */}
              <div>
                <h3 className="font-semibold text-white-primary mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  Visitantes (sem conta)
                </h3>
                {searchResults.visitors.length === 0 ? (
                  <p className="text-gray-text-muted text-sm">Nenhum visitante encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.visitors.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVisitor(v)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedVisitor?.id === v.id
                            ? 'border-gold bg-gold/10'
                            : 'border-gray-border bg-black-elevated hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white-primary">{v.full_name}</span>
                          {getMemberStageBadge(v.member_stage)}
                        </div>
                        {v.cell_name && (
                          <p className="text-xs text-gray-text-muted mt-1">Célula: {v.cell_name}</p>
                        )}
                        {v.phone && (
                          <p className="text-xs text-gray-text-muted flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {v.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real Profiles Column */}
              <div>
                <h3 className="font-semibold text-white-primary mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-500" />
                  Contas Reais (com email)
                </h3>
                {searchResults.realProfiles.length === 0 ? (
                  <p className="text-gray-text-muted text-sm">Nenhuma conta encontrada</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.realProfiles.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRealProfile(r)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedRealProfile?.id === r.id
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-border bg-black-elevated hover:border-gray-500'
                        }`}
                      >
                        <span className="font-medium text-white-primary">{r.full_name}</span>
                        <p className="text-xs text-gray-text-muted flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" /> {r.email}
                        </p>
                        {r.phone && (
                          <p className="text-xs text-gray-text-muted flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {r.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Action */}
      {selectedVisitor && selectedRealProfile && (
        <Card className="bg-gold/10 border-gold/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-gray-text-secondary mb-2">Você está prestes a vincular:</p>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                  <div className="bg-black-elevated px-4 py-2 rounded-lg">
                    <span className="text-orange-400 font-medium">{selectedVisitor.full_name}</span>
                    <span className="text-gray-text-muted text-sm ml-2">(visitante)</span>
                  </div>
                  <Link2 className="w-5 h-5 text-gold" />
                  <div className="bg-black-elevated px-4 py-2 rounded-lg">
                    <span className="text-green-400 font-medium">{selectedRealProfile.full_name}</span>
                    <span className="text-gray-text-muted text-sm ml-2">({selectedRealProfile.email})</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleLink} 
                disabled={linking}
                className="gap-2"
              >
                {linking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {linking ? 'Vinculando...' : 'Vincular Perfis'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visitors List */}
      <Card className="bg-black-surface border-gray-border">
        <CardHeader>
          <CardTitle>Visitantes Cadastrados</CardTitle>
          <CardDescription>
            Membros criados manualmente que ainda não têm conta com email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visitors.length === 0 ? (
            <p className="text-gray-text-muted text-center py-8">
              Nenhum visitante encontrado. Visitantes são membros criados sem email.
            </p>
          ) : (
            <div className="grid gap-3">
              {visitors.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-black-elevated border border-gray-border"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white-primary">{v.full_name}</span>
                      {getMemberStageBadge(v.member_stage)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-text-muted">
                      {v.cell_name && <span>Célula: {v.cell_name}</span>}
                      {v.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {v.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> 
                        {new Date(v.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedVisitor(v)
                      setSearchQuery(v.full_name)
                      handleSearch()
                    }}
                  >
                    Vincular
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
