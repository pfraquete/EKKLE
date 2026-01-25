# Análise de Funcionalidades - Sistema EKKLE

## Visão Geral do Sistema

O **EKKLE** é um sistema completo de gestão para igrejas, focado especialmente na gestão de células (pequenos grupos), membros, eventos, cursos e comunicação. O sistema possui três níveis de acesso: **Pastor** (administrador), **Líder** (líder de célula) e **Membro**.

---

## Módulos e Funcionalidades

### 1. 📊 Dashboard Pastoral (Apenas Pastor)

**Rota:** `/dashboard`

**Funcionalidades:**
- Visão geral com KPIs principais:
  - Total de membros
  - Total de células
  - Presença global (%)
  - Células sem relatório
- Gráfico de crescimento da igreja
- Lista de próximos eventos
- Visão geral de todas as células
- Botões de ação rápida:
  - Configurar WhatsApp
  - Importar dados
  - Nova célula

---

### 2. 🏠 Gestão de Células

#### Para Pastores (`/celulas`)
**Funcionalidades:**
- Listar todas as células da igreja
- Criar nova célula
- Editar célula existente
- Visualizar detalhes de cada célula
- Atribuir líderes às células

#### Para Líderes (`/minha-celula`)
**Funcionalidades:**
- Dashboard da própria célula
- Gerenciar membros da célula
  - Adicionar novos membros
  - Visualizar perfil de membros
- Gerenciar reuniões
  - Criar nova reunião
  - Registrar presença
  - Visualizar histórico de reuniões
- Gerenciar solicitações de entrada na célula

---

### 3. 👥 Gestão de Membros (Apenas Pastor)

**Rota:** `/membros`

**Funcionalidades:**
- Listar todos os membros da igreja
- Visualizar perfil detalhado de cada membro
- Filtrar membros por:
  - Célula
  - Estágio (Visitante, Consolidado, Membro, etc.)
  - Status ativo/inativo
- Editar informações de membros
- Gerenciar papéis (Pastor, Líder, Membro)

---

### 4. 📅 Eventos (Apenas Pastor)

**Rota:** `/dashboard/eventos`

**Funcionalidades:**
- Criar novos eventos
- Editar eventos existentes
- Gerenciar inscrições
- Visualizar lista de inscritos
- Definir:
  - Data e horário
  - Local
  - Capacidade máxima
  - Preço (se aplicável)
  - Descrição e imagem

---

### 5. 🎓 Cursos (Apenas Pastor)

**Rota:** `/dashboard/cursos`

**Funcionalidades:**
- Criar novos cursos
- Editar cursos existentes
- Gerenciar inscrições
- Visualizar alunos inscritos
- Definir:
  - Conteúdo programático
  - Duração
  - Preço
  - Pré-requisitos

---

### 6. ⛪ Cultos (Pastor e Líder)

**Rota:** `/dashboard/cultos`

**Funcionalidades:**
- Criar novos cultos
- Registrar presença de membros
- Visualizar histórico de cultos
- Estatísticas de presença

---

### 7. 🛒 Loja (Apenas Pastor)

**Rota:** `/dashboard/loja`

**Funcionalidades:**
- Criar novos produtos
- Editar produtos existentes
- Gerenciar estoque
- Visualizar pedidos
- Definir:
  - Nome e descrição
  - Preço
  - Imagens
  - Categorias

---

### 8. 💰 Financeiro (Apenas Pastor)

**Rota:** `/dashboard/financeiro`

**Funcionalidades:**
- Visão geral financeira
- Listar transações
- Filtrar por período
- Relatórios financeiros
- Configurar recebedor (conta bancária)

---

### 9. 💬 Comunicações (Apenas Pastor)

**Rota:** `/dashboard/comunicacoes`

**Funcionalidades:**
- Enviar mensagens em massa
- Gerenciar templates de mensagens
- Histórico de comunicações
- Integração com WhatsApp

---

### 10. ⚙️ Configurações (Apenas Pastor)

**Rota:** `/configuracoes`

**Subseções:**

#### Site da Igreja (`/configuracoes/site`)
- Configurar homepage
- Personalizar branding (cores, logo)
- Editor visual do site

#### WhatsApp (`/configuracoes/whatsapp`)
- Conectar instância do WhatsApp
- Gerenciar templates de mensagens
- Configurar automações

#### Assinatura (`/configuracoes/assinatura`)
- Visualizar plano atual
- Fazer upgrade
- Checkout de pagamento
- Histórico de faturas

---

### 11. 📆 Calendário

**Rota:** `/calendario`

**Funcionalidades:**
- Visualização em calendário de todos os eventos
- Filtros por tipo de evento
- Navegação por mês/semana

---

### 12. 📥 Importação

**Rota:** `/importar`

**Funcionalidades:**
- Importar membros via planilha
- Importar células
- Mapeamento de campos

---

### 13. ✅ Presença em Cultos

**Rota:** `/presenca-cultos`

**Funcionalidades:**
- Registrar presença em cultos
- Visualizar histórico de presença
- Relatórios de frequência

---

## Site Público da Igreja

O sistema também gera um site público para cada igreja em `/site/[domain]`:

### Páginas Públicas:
- **Homepage** (`/site/[domain]`)
- **Sobre** (`/site/[domain]/sobre`)
- **Eventos** (`/site/[domain]/eventos`)
- **Cursos** (`/site/[domain]/cursos`)
- **Cultos** (`/site/[domain]/cultos`)
- **Registro** (`/site/[domain]/registro`)

### Área do Membro:
- **Painel do Membro** (`/site/[domain]/membro`)
- **Minha Célula** (`/site/[domain]/membro/minha-celula`)
- **Células Disponíveis** (`/site/[domain]/membro/celulas`)
- **Meus Cursos** (`/site/[domain]/membro/cursos`)
- **Meus Eventos** (`/site/[domain]/membro/eventos`)
- **Loja** (`/site/[domain]/membro/loja`)
- **Meus Pedidos** (`/site/[domain]/membro/pedidos`)

---

## Níveis de Acesso

| Funcionalidade | Pastor | Líder | Membro |
|----------------|--------|-------|--------|
| Dashboard Pastoral | ✅ | ❌ | ❌ |
| Gestão de Células | ✅ | Própria | ❌ |
| Gestão de Membros | ✅ | Célula | ❌ |
| Eventos | ✅ | ❌ | Ver |
| Cursos | ✅ | ❌ | Ver |
| Cultos | ✅ | ✅ | ❌ |
| Loja | ✅ | ❌ | Comprar |
| Financeiro | ✅ | ❌ | ❌ |
| Comunicações | ✅ | ❌ | ❌ |
| Configurações | ✅ | ❌ | ❌ |

---

## Integrações

1. **WhatsApp** - Envio de mensagens e notificações
2. **Pagar.me** - Processamento de pagamentos
3. **Supabase** - Banco de dados e autenticação
4. **Vercel/Railway** - Hospedagem

---

## Diferenciais do Sistema

1. **Multi-tenant** - Cada igreja tem seu próprio ambiente
2. **Site Personalizado** - Cada igreja pode ter seu próprio site
3. **Gestão de Células** - Foco em pequenos grupos
4. **Integração WhatsApp** - Comunicação direta com membros
5. **Loja Integrada** - Venda de produtos e materiais
6. **Cursos Online** - Capacitação de membros
7. **Financeiro Integrado** - Controle de receitas e despesas
8. **Relatórios** - Métricas de crescimento e presença

---

## Páginas para Screenshots (Marketing)

### Prioridade Alta (Principais Features):
1. Dashboard Pastoral - Visão geral
2. Lista de Células
3. Detalhes de uma Célula
4. Lista de Membros
5. Criar/Editar Evento
6. Lista de Eventos
7. Loja - Lista de Produtos
8. Configurações do Site
9. Integração WhatsApp
10. Site Público da Igreja

### Prioridade Média:
11. Cursos
12. Financeiro
13. Comunicações
14. Calendário
15. Área do Membro (site público)

### Prioridade Baixa:
16. Telas de autenticação (Login, Registro)
17. Configurações de assinatura
18. Importação de dados
