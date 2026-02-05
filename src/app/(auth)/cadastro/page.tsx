'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Church, Users, Search, AtSign, ArrowLeft, Building2, MapPin, CheckCircle, User, Mail, Phone, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { getPublicChurches, type PublicChurch } from '@/actions/church-affiliation'

type Step = 'role-select' | 'church-select' | 'church-create' | 'form' | 'success'
type RegistrationType = 'member' | 'pastor'

export default function CadastroEkklePage() {
  const [step, setStep] = useState<Step>('role-select')
  const [registrationType, setRegistrationType] = useState<RegistrationType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nicknameError, setNicknameError] = useState('')

  // Church selection state (member path)
  const [churches, setChurches] = useState<PublicChurch[]>([])
  const [selectedChurch, setSelectedChurch] = useState<PublicChurch | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingChurches, setLoadingChurches] = useState(false)

  // Church creation state (pastor path)
  const [churchName, setChurchName] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nickname: '',
    password: '',
    confirmPassword: '',
  })

  const loadChurches = useCallback(async (query?: string) => {
    setLoadingChurches(true)
    try {
      const result = await getPublicChurches({ query: query || undefined })
      if (result.success && result.churches) {
        setChurches(result.churches)
      }
    } finally {
      setLoadingChurches(false)
    }
  }, [])

  useEffect(() => {
    if (step === 'church-select') {
      loadChurches()
    }
  }, [step, loadChurches])

  const handleSearch = () => {
    loadChurches(searchQuery)
  }

  const handleMemberSubmit = async () => {
    setLoading(true)
    setError('')
    setNicknameError('')

    if (formData.nickname) {
      const nicknameRegex = /^[a-zA-Z0-9_]{3,20}$/
      if (!nicknameRegex.test(formData.nickname)) {
        setNicknameError('Nickname deve ter 3-20 caracteres (letras, números e _)')
        setLoading(false)
        return
      }
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setLoading(false)
      return
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula')
      setLoading(false)
      return
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('A senha deve conter pelo menos uma letra minúscula')
      setLoading(false)
      return
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('A senha deve conter pelo menos um número')
      setLoading(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/ekkle-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          nickname: formData.nickname || null,
          password: formData.password,
          churchId: selectedChurch?.id || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao criar conta')
      setStep('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handlePastorSubmit = async () => {
    setLoading(true)
    setError('')

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setLoading(false)
      return
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula')
      setLoading(false)
      return
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('A senha deve conter pelo menos uma letra minúscula')
      setLoading(false)
      return
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('A senha deve conter pelo menos um número')
      setLoading(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchName,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao criar igreja')
      setStep('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar igreja')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registrationType === 'member') {
      await handleMemberSubmit()
    } else {
      await handlePastorSubmit()
    }
  }

  // ─── Success Screen ───
  if (step === 'success') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black mb-4 text-foreground">
              {registrationType === 'pastor' ? 'Igreja Criada com Sucesso!' : 'Bem-vindo ao Ekkle!'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {registrationType === 'pastor'
                ? 'Sua conta de responsável e a estrutura da igreja foram configuradas.'
                : `Sua conta foi criada com sucesso${selectedChurch ? ` e você já está vinculado à ${selectedChurch.name}` : ''}. Agora você pode fazer login.`
              }
            </p>
            <Link
              href="/login"
              className="block w-full bg-primary text-primary-foreground px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              {registrationType === 'pastor' ? 'Acessar Painel' : 'Fazer Login'}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Role Selection ───
  if (step === 'role-select') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card border border-border/50">
            <CardHeader className="space-y-1 bg-muted/30 border-b border-border text-center p-4 sm:p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 relative bg-primary/10 rounded-2xl p-2 shadow-inner flex items-center justify-center">
                  <Image src="/logo.png" alt="Ekkle" width={60} height={60} className="object-contain" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black text-foreground tracking-tight">Criar Conta no Ekkle</CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">Como você gostaria de se cadastrar?</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-8 space-y-4">
              <button
                onClick={() => { setRegistrationType('member'); setStep('church-select') }}
                className="w-full p-5 border-2 border-border rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Membro de uma igreja</h3>
                  <p className="text-sm text-muted-foreground">Encontre sua igreja e conecte-se à comunidade</p>
                </div>
              </button>

              <button
                onClick={() => { setRegistrationType('pastor'); setStep('church-create') }}
                className="w-full p-5 border-2 border-border rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Responsável de uma igreja</h3>
                  <p className="text-sm text-muted-foreground">Cadastre sua igreja e crie uma conta administrativa</p>
                </div>
              </button>
            </CardContent>

            <div className="p-6 bg-muted/20 text-center text-sm border-t border-border">
              <span className="text-muted-foreground font-medium">Já tem uma conta?</span>{' '}
              <Link href="/login" className="text-primary hover:underline font-black">Fazer Login</Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Church Selection (member path) ───
  if (step === 'church-select') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card border border-border/50">
            <CardHeader className="space-y-1 bg-muted/30 border-b border-border p-4 sm:p-6">
              <button
                onClick={() => { setStep('role-select'); setSelectedChurch(null); setSearchQuery('') }}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <CardTitle className="text-xl font-black text-foreground tracking-tight">Selecione sua Igreja</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Busque e selecione a igreja que você frequenta</CardDescription>
            </CardHeader>

            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  className="h-11 pl-10 rounded-xl bg-background border-border"
                />
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto p-4 space-y-3">
              {loadingChurches ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : churches.length === 0 ? (
                <div className="text-center py-12">
                  <Church className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma igreja encontrada</p>
                </div>
              ) : (
                churches.map((church) => (
                  <button
                    key={church.id}
                    onClick={() => setSelectedChurch(selectedChurch?.id === church.id ? null : church)}
                    className={`w-full p-4 rounded-xl border-2 cursor-pointer transition-all text-left flex items-center gap-3 ${
                      selectedChurch?.id === church.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {church.logo_url ? (
                        <Image src={church.logo_url} alt={church.name} width={40} height={40} className="object-cover" />
                      ) : (
                        <Church className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">{church.name}</h4>
                      {(church.city || church.state) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {[church.city, church.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">{church.member_count} membros</p>
                    </div>
                    {selectedChurch?.id === church.id && (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            <CardContent className="p-4 pt-0">
              <Button
                onClick={() => setStep('form')}
                disabled={!selectedChurch}
                className="w-full h-12 text-base font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Continuar
              </Button>
            </CardContent>

            <div className="p-4 bg-muted/20 text-center text-sm border-t border-border">
              <span className="text-muted-foreground font-medium">Não encontrou sua igreja?</span>{' '}
              <button
                onClick={() => { setRegistrationType('pastor'); setStep('church-create') }}
                className="text-primary hover:underline font-bold"
              >
                Cadastre-a aqui
              </button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Church Creation (pastor path) ───
  if (step === 'church-create') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card border border-border/50">
            <CardHeader className="space-y-1 bg-muted/30 border-b border-border p-4 sm:p-6">
              <button
                onClick={() => setStep('role-select')}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <CardTitle className="text-xl font-black text-foreground tracking-tight">Criar Nova Igreja</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Configure o nome da sua igreja</CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="churchName" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  <Building2 className="w-3 h-3" /> Nome da Igreja
                </Label>
                <Input
                  id="churchName"
                  type="text"
                  required
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder="Ex: Igreja Ekkle Central"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <Button
                onClick={() => setStep('form')}
                disabled={!churchName.trim()}
                className="w-full h-12 text-base font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Registration Form ───
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-card border border-border/50">
          <CardHeader className="space-y-1 bg-muted/30 border-b border-border p-4 sm:p-6">
            <button
              onClick={() => {
                setError('')
                setNicknameError('')
                setStep(registrationType === 'member' ? 'church-select' : 'church-create')
              }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <CardTitle className="text-xl font-black text-foreground tracking-tight">
              {registrationType === 'member' ? 'Dados do Membro' : 'Dados do Responsável'}
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              {registrationType === 'member' ? 'Preencha seus dados para criar sua conta' : 'Preencha seus dados de administrador'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            {/* Church confirmation banner */}
            {registrationType === 'member' && selectedChurch && (
              <div className="p-3 bg-primary/10 rounded-xl flex items-center gap-3 mb-6">
                <Church className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-bold text-foreground flex-1 truncate">{selectedChurch.name}</span>
                <button
                  onClick={() => setStep('church-select')}
                  className="text-xs text-primary hover:underline font-bold flex-shrink-0"
                >
                  Alterar
                </button>
              </div>
            )}
            {registrationType === 'pastor' && churchName && (
              <div className="p-3 bg-primary/10 rounded-xl flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-bold text-foreground flex-1 truncate">{churchName}</span>
                <button
                  onClick={() => setStep('church-create')}
                  className="text-xs text-primary hover:underline font-bold flex-shrink-0"
                >
                  Alterar
                </button>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 text-red-500 text-sm rounded-xl border border-red-500/20 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  <User className="w-3 h-3" /> Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Seu nome completo"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  <Phone className="w-3 h-3" /> Telefone {registrationType === 'member' ? '(Opcional)' : ''}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required={registrationType === 'pastor'}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              {registrationType === 'member' && (
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <AtSign className="w-3 h-3" /> Nickname (Opcional)
                  </Label>
                  <Input
                    id="nickname"
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => {
                      setFormData({ ...formData, nickname: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                      setNicknameError('')
                    }}
                    placeholder="seu_nickname"
                    maxLength={20}
                    className={`h-12 rounded-xl bg-background border-border ${nicknameError ? 'border-red-500' : ''}`}
                  />
                  {nicknameError ? (
                    <p className="text-xs text-red-500 ml-1">{nicknameError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground ml-1">Usado para mensagens privadas. Pode definir depois.</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  <Lock className="w-3 h-3" /> Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="h-12 rounded-xl bg-background border-border"
                />
                <p className="text-xs text-muted-foreground ml-1">Deve conter: maiúscula, minúscula e número</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  <Lock className="w-3 h-3" /> Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-black uppercase tracking-widest rounded-xl mt-4 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {loading
                  ? (registrationType === 'pastor' ? 'Configurando...' : 'Criando conta...')
                  : (registrationType === 'pastor' ? 'Criar Minha Igreja' : 'Criar Conta')
                }
              </Button>
            </form>
          </CardContent>

          <div className="p-6 bg-muted/20 text-center text-sm border-t border-border">
            <span className="text-muted-foreground font-medium">Já tem uma conta?</span>{' '}
            <Link href="/login" className="text-primary hover:underline font-black">Fazer Login</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
