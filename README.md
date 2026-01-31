# EKKLE - Sistema de Gestao de Igrejas

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

Sistema SaaS multi-tenant completo para gestao de igrejas, com foco em celulas (pequenos grupos), membros, eventos, cursos, e-commerce e comunicacao inteligente via WhatsApp.

---

## Indice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnologico](#stack-tecnologico)
- [Pre-requisitos](#pre-requisitos)
- [Instalacao Rapida](#instalacao-rapida)
- [Configuracao Detalhada](#configuracao-detalhada)
- [Variaveis de Ambiente](#variaveis-de-ambiente)
- [Comandos Disponiveis](#comandos-disponiveis)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Arquitetura](#arquitetura)
- [Integracoes](#integracoes)
- [Deploy](#deploy)
- [Documentacao Adicional](#documentacao-adicional)
- [Contribuindo](#contribuindo)

---

## Sobre o Projeto

O **EKKLE** e uma plataforma completa de gestao para igrejas, desenvolvida com tecnologias modernas e focada em:

- **Multi-tenancy**: Cada igreja tem seu proprio ambiente isolado
- **Gestao de Celulas**: Foco em pequenos grupos com lideres e membros
- **Comunicacao Inteligente**: Assistente IA via WhatsApp para pastores
- **Site Personalizado**: Cada igreja pode ter seu proprio site publico
- **E-commerce Integrado**: Loja para venda de produtos e materiais
- **Financeiro Completo**: Dizimos, ofertas e assinaturas com Stripe

### Niveis de Acesso

| Role | Descricao |
|------|-----------|
| **PASTOR** | Acesso total ao sistema, configuracoes e relatorios |
| **LEADER** | Gestao da propria celula e seus membros |
| **MEMBER** | Acesso ao portal do membro e inscricoes |

---

## Funcionalidades

### Dashboard Pastoral
- KPIs principais (membros, celulas, presenca)
- Graficos de crescimento da igreja
- Visao geral de todas as celulas
- Proximos eventos

### Gestao de Celulas
- CRUD completo de celulas
- Atribuicao de lideres
- Solicitacoes de entrada
- Albuns de fotos
- Historico de reunioes
- Registro de presenca

### Gestao de Membros
- Cadastro com perfil completo
- Estagios (Visitante, Consolidado, Membro)
- Importacao via planilha (CSV/Excel)
- Exportacao de dados

### Eventos
- Criacao de eventos com inscricoes
- Controle de capacidade
- Pagamento integrado
- Notificacoes automaticas

### Cursos Online
- Video aulas com Mux
- Matriculas e progresso
- Sistema de modulos
- Certificados

### Loja (E-commerce)
- Catalogo de produtos
- Carrinho de compras
- Checkout com Stripe
- Gestao de pedidos

### Financeiro
- Dizimos e ofertas
- Assinaturas recorrentes
- Relatorios financeiros
- Split de pagamentos

### WhatsApp AI Agent
- Assistente IA para pastores
- Gestao por linguagem natural
- Onboarding automatico
- Confirmacoes de seguranca
- Audit trail completo

### Live Streaming
- Transmissoes ao vivo com Mux
- Chat em tempo real
- Gravacao automatica

### Presenca em Cultos
- Registro manual
- Reconhecimento facial
- Historico de frequencia

### Leitura Biblica
- Planos de leitura
- Sistema de streaks
- Integracao com API.Bible

### Site Publico da Igreja
- Homepage personalizavel
- Paginas de eventos e cursos
- Registro de novos membros
- Branding customizavel

---

## Stack Tecnologico

### Core

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| Next.js | 16.1.6 | Framework React full-stack |
| React | 19.0.0 | Biblioteca UI |
| TypeScript | 5.9.3 | Tipagem estatica |
| Supabase | 2.47.10 | BaaS (PostgreSQL + Auth) |

### UI & Estilizacao

| Tecnologia | Uso |
|------------|-----|
| Tailwind CSS | Estilizacao utility-first |
| Radix UI | Componentes acessiveis |
| Framer Motion | Animacoes |
| Lucide React | Icones |

### Pagamentos & Comunicacao

| Servico | Uso |
|---------|-----|
| Stripe | Pagamentos e assinaturas |
| Resend | Envio de emails |
| Twilio | WhatsApp Business API |
| Evolution API | WhatsApp alternativo |
| OpenAI | Assistente IA (GPT-4o-mini) |

### Media & Performance

| Servico | Uso |
|---------|-----|
| Mux | Video hosting e streaming |
| Upstash Redis | Rate limiting e cache |
| Face API | Reconhecimento facial |
| API.Bible | Conteudo biblico |

### Desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| Vitest | Testes unitarios |
| ESLint | Linting |
| Zod | Validacao de schemas |
| React Hook Form | Formularios |

---

## Pre-requisitos

- **Node.js** 20.0.0 ou superior
- **npm** ou **yarn**
- Conta no [Supabase](https://supabase.com)
- Conta no [Stripe](https://stripe.com) (para pagamentos)
- Conta no [Resend](https://resend.com) (para emails)

### Opcionais (para funcionalidades especificas)

| Servico | Funcionalidade |
|---------|----------------|
| [Twilio](https://twilio.com) | WhatsApp AI Agent |
| [OpenAI](https://platform.openai.com) | Assistente IA |
| [Mux](https://mux.com) | Live streaming e cursos |
| [Upstash](https://upstash.com) | Rate limiting |
| [API.Bible](https://scripture.api.bible) | Leitura biblica |

---

## Instalacao Rapida

### 1. Clonar o repositorio

```bash
git clone <url-do-repositorio>
cd ekkle
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variaveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais (veja [Variaveis de Ambiente](#variaveis-de-ambiente)).

### 4. Configurar banco de dados

Veja a secao [Configuracao Detalhada](#configuracao-detalhada) abaixo.

### 5. Executar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Configuracao Detalhada

### Banco de Dados (Supabase)

#### 1. Criar projeto no Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique em **New Project**
3. Escolha organizacao, nome e senha do banco
4. Aguarde a criacao (~2 minutos)

#### 2. Executar migrations

O projeto usa migrations SQL localizadas em `supabase/migrations/`.

**Opcao A - Via Supabase CLI:**

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
supabase db push
```

**Opcao B - Via Dashboard:**

1. Acesse **SQL Editor** no dashboard
2. Execute cada arquivo de `supabase/migrations/` em ordem cronologica

#### 3. Obter credenciais

Em **Settings > API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (manter em segredo!)

#### 4. Criar primeiro usuario (Pastor)

1. Va em **Authentication > Users**
2. Clique em **Add user > Create new user**
3. Copie o **User UID**
4. No **SQL Editor**, execute:

```sql
INSERT INTO profiles (id, church_id, full_name, email, role, member_stage, is_active)
VALUES (
  'SEU-USER-UID-AQUI',
  '00000000-0000-0000-0000-000000000001',
  'Seu Nome',
  'seu@email.com',
  'PASTOR',
  'MEMBER',
  true
);
```

---

## Variaveis de Ambiente

### Obrigatorias

| Variavel | Descricao | Onde obter |
|----------|-----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave publica Supabase | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de servico (secreta!) | Supabase > Settings > API |
| `NEXT_PUBLIC_APP_URL` | URL da aplicacao | `http://localhost:3000` ou URL de producao |

### Pagamentos (Stripe)

| Variavel | Descricao | Onde obter |
|----------|-----------|------------|
| `STRIPE_SECRET_KEY` | Chave secreta Stripe | Stripe > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook | Stripe > Developers > Webhooks |

### Email (Resend)

| Variavel | Descricao | Onde obter |
|----------|-----------|------------|
| `RESEND_API_KEY` | API Key do Resend | Resend > API Keys |
| `FROM_EMAIL` | Email remetente | Dominio verificado no Resend |

### WhatsApp AI Agent

| Variavel | Descricao | Onde obter |
|----------|-----------|------------|
| `TWILIO_ACCOUNT_SID` | SID da conta Twilio | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Token de autenticacao | Twilio Console |
| `TWILIO_WHATSAPP_NUMBER` | Numero WhatsApp | `whatsapp:+14155238886` (sandbox) |
| `OPENAI_API_KEY` | API Key OpenAI | OpenAI Platform |
| `OPENAI_MODEL` | Modelo a usar | `gpt-4o-mini` (recomendado) |

### Evolution API (WhatsApp alternativo)

| Variavel | Descricao |
|----------|-----------|
| `EVOLUTION_API_URL` | URL da instancia Evolution |
| `EVOLUTION_API_KEY` | API Key da Evolution |

### Rate Limiting (Upstash)

| Variavel | Descricao | Onde obter |
|----------|-----------|------------|
| `UPSTASH_REDIS_REST_URL` | URL do Redis | Upstash Console |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Redis | Upstash Console |

### Conteudo Biblico

| Variavel | Descricao | Onde obter |
|----------|-----------|------------|
| `API_BIBLE_KEY` | API Key do API.Bible | scripture.api.bible |

---

## Comandos Disponiveis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (localhost:3000) |
| `npm run build` | Build de producao |
| `npm run start` | Iniciar servidor de producao |
| `npm run lint` | Executar ESLint |
| `npm test` | Executar testes (watch mode) |
| `npm run test:run` | Executar testes uma vez |
| `npm run test:coverage` | Relatorio de cobertura |

---

## Estrutura de Pastas

```
ekkle/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (app)/               # Rotas autenticadas (dashboard)
│   │   │   ├── dashboard/       # Dashboard pastoral
│   │   │   ├── celulas/         # Gestao de celulas
│   │   │   ├── membros/         # Gestao de membros
│   │   │   ├── minha-celula/    # Painel do lider
│   │   │   ├── configuracoes/   # Configuracoes
│   │   │   ├── calendario/      # Calendario
│   │   │   ├── importar/        # Importacao de dados
│   │   │   └── presenca-cultos/ # Presenca em cultos
│   │   ├── (auth)/              # Autenticacao
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (landing)/           # Landing page publica
│   │   ├── (public)/            # Paginas publicas (privacidade, termos)
│   │   ├── api/                 # API Routes
│   │   │   ├── webhooks/        # Webhooks (Stripe, Twilio, Mux)
│   │   │   ├── register/        # Endpoints de registro
│   │   │   └── health/          # Health check
│   │   ├── site/[domain]/       # Sites publicos das igrejas
│   │   └── ekkle/               # Portal do membro
│   │
│   ├── actions/                 # Server Actions (43+ arquivos)
│   │   ├── auth.ts              # Autenticacao
│   │   ├── cells.ts             # Celulas
│   │   ├── members.ts           # Membros
│   │   ├── events.ts            # Eventos
│   │   ├── courses.ts           # Cursos
│   │   ├── orders.ts            # Pedidos
│   │   ├── subscriptions.ts     # Assinaturas
│   │   ├── whatsapp-agent.ts    # AI Agent
│   │   ├── live-streams.ts      # Live streaming
│   │   ├── face-recognition.ts  # Reconhecimento facial
│   │   └── ...
│   │
│   ├── components/              # Componentes React (100+)
│   │   ├── ui/                  # Componentes base (shadcn-style)
│   │   ├── dashboard/           # Componentes do dashboard
│   │   ├── cells/               # Componentes de celulas
│   │   ├── members/             # Componentes de membros
│   │   ├── live/                # Componentes de live
│   │   ├── store/               # Componentes da loja
│   │   └── ...
│   │
│   ├── lib/                     # Utilitarios e servicos
│   │   ├── supabase/            # Clientes Supabase
│   │   ├── ai-agent/            # Sistema do AI Agent
│   │   ├── face-recognition/    # Utilitarios de face recognition
│   │   ├── stripe.ts            # Integracao Stripe
│   │   ├── twilio.ts            # Integracao Twilio
│   │   ├── openai.ts            # Integracao OpenAI
│   │   ├── email.ts             # Envio de emails
│   │   └── ...
│   │
│   ├── hooks/                   # React Custom Hooks
│   ├── context/                 # React Context (carrinho)
│   ├── middleware.ts            # Middleware (multi-tenant, auth)
│   └── __tests__/               # Arquivos de teste
│
├── supabase/
│   └── migrations/              # Migrations SQL (30+)
│
├── public/                      # Assets estaticos
├── docs/                        # Documentacao adicional
│
├── next.config.ts               # Configuracao Next.js
├── tailwind.config.ts           # Configuracao Tailwind
├── tsconfig.json                # Configuracao TypeScript
├── vitest.config.ts             # Configuracao Vitest
├── railway.json                 # Configuracao Railway
└── package.json                 # Dependencias
```

---

## Arquitetura

### Multi-Tenancy

O sistema usa isolamento por `church_id`:

```
igreja-a.ekkle.com.br  ─┐
igreja-b.ekkle.com.br  ─┼─→ Mesmo aplicativo
igreja-c.ekkle.com.br  ─┘    │
                              │
                              ▼
                    ┌─────────────────┐
                    │    Supabase     │
                    │   (PostgreSQL)  │
                    │                 │
                    │  RLS por        │
                    │  church_id      │
                    └─────────────────┘
```

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado:
- **PASTOR**: Acesso total aos dados da igreja
- **LEADER**: Acesso a celula que lidera
- **MEMBER**: Acesso aos proprios dados

### Fluxo de Autenticacao

```
Usuario → Login → Supabase Auth → JWT → Middleware → Rotas Protegidas
                                    │
                                    ▼
                            Verificacao de Role
                            (PASTOR/LEADER/MEMBER)
```

---

## Integracoes

### Webhooks Configurados

| Servico | Endpoint | Eventos |
|---------|----------|---------|
| Stripe | `/api/webhooks/stripe` | `invoice.paid`, `customer.subscription.*` |
| Twilio | `/api/webhooks/twilio-whatsapp` | Mensagens WhatsApp |
| Mux | `/api/webhooks/mux` | Upload de video concluido |

### Configurar Webhooks

**Stripe:**
1. Acesse Stripe Dashboard > Developers > Webhooks
2. Adicione endpoint: `https://seu-dominio.com/api/webhooks/stripe`
3. Selecione eventos: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`
4. Copie o signing secret para `STRIPE_WEBHOOK_SECRET`

**Twilio:**
1. Acesse Twilio Console > Messaging > WhatsApp
2. Configure webhook: `https://seu-dominio.com/api/webhooks/twilio-whatsapp`
3. Metodo: POST

---

## Deploy

### Railway (Recomendado)

O projeto inclui `railway.json` pre-configurado.

1. Conecte seu repositorio ao Railway
2. Configure variaveis de ambiente
3. Deploy automatico a cada push

**Variaveis obrigatorias no Railway:**
- Todas as variaveis listadas em [Variaveis de Ambiente](#variaveis-de-ambiente)

### Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar variaveis
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... adicionar todas as variaveis

# Deploy de producao
vercel --prod
```

### Checklist Pre-Deploy

```
Banco de Dados
[ ] Projeto Supabase criado
[ ] Migrations executadas
[ ] RLS policies ativas
[ ] Primeiro usuario (PASTOR) criado

Variaveis de Ambiente
[ ] Supabase URL e keys configurados
[ ] Stripe keys configurados
[ ] Resend API key configurado
[ ] URL de producao em NEXT_PUBLIC_APP_URL

Webhooks
[ ] Stripe webhook configurado
[ ] Twilio webhook configurado (se usar AI Agent)

Build
[ ] npm run build executa sem erros
[ ] npm run lint sem erros
```

---

## Documentacao Adicional

O projeto inclui documentacao detalhada:

| Arquivo | Descricao |
|---------|-----------|
| [WHATSAPP_AI_AGENT.md](./WHATSAPP_AI_AGENT.md) | Documentacao completa do WhatsApp AI Agent |
| [ANALISE_SEGURANCA.md](./ANALISE_SEGURANCA.md) | Analise de seguranca (Sentry, sanitizacao) |
| [ANALISE_FUNCIONALIDADES.md](./ANALISE_FUNCIONALIDADES.md) | Mapeamento de todas as funcionalidades |
| [AUDITORIA-PRE-PRODUCAO.md](./AUDITORIA-PRE-PRODUCAO.md) | Relatorio de auditoria pre-producao |
| [SETUP-RAPIDO.md](./SETUP-RAPIDO.md) | Guia de setup rapido |
| [docs/plano-estrategico-ekkle.md](./docs/plano-estrategico-ekkle.md) | Plano estrategico do produto |

---

## Contribuindo

### Padrao de Codigo

- TypeScript strict mode ativado
- ESLint configurado com regras do Next.js
- Commits em portugues

### Estrutura de Commits

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentacao
refactor: refatora codigo sem mudar funcionalidade
test: adiciona ou corrige testes
```

### Fluxo de Desenvolvimento

1. Crie uma branch: `git checkout -b feature/nome-da-feature`
2. Faca commits atomicos
3. Execute testes: `npm run test:run`
4. Execute lint: `npm run lint`
5. Abra Pull Request

---

## Licenca

Projeto privado - Todos os direitos reservados.

---

## Contato

- **Email**: suporte@ekkle.com.br
- **Issues**: [GitHub Issues](https://github.com/seu-repo/issues)

---

**Desenvolvido com Next.js, React, Supabase e muito cafe.**
