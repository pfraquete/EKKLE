# Plano Estratégico: Funcionalidades para Aquisição de Igrejas

## 🎯 RESUMO EXECUTIVO

**Objetivo**: Transformar EKKLE em ferramenta indispensável para igrejas pequenas (50-200 membros) através de automação via WhatsApp e simplificação radical.

**Diferencial Competitivo**:
- 🔥 **WhatsApp automático** via Evolution API (cada igreja usa seu próprio número)
- ⚡ **Setup em 15 minutos** (QR Code + Import CSV)
- 📊 **Analytics que mostram ROI** (crescimento de células visível)
- 💰 **Preço acessível** (R$ 49/mês vs R$ 200+ de concorrentes)

**Stack Tecnológico**:
```
Frontend:     Next.js 15 + React 19 + TypeScript
Backend:      Next.js Server Actions + Supabase
WhatsApp:     Evolution API (conexão QR Code)
Queue:        Bull + Redis
Deploy:       Railway (multi-container)
Email:        Resend
```

**ROI do Plano**:
- **Custo infra por igreja**: R$ 1-2/mês
- **Preço cobrado**: R$ 49-99/mês
- **Margem**: ~95%
- **Payback**: < 1 mês

---

## Contexto Atual

### Sistema Existente (EKKLE)
- ✅ Gestão de células e membros
- ✅ Registro de reuniões e relatórios
- ✅ Controle de presença (células e cultos)
- ✅ Dashboard com KPIs básicos
- ✅ Gestão de líderes e permissões
- ✅ Exportação de dados (PDF)
- ✅ Envio de email de boas-vindas para líderes
- ✅ Deploy no Railway

### Público-Alvo
**Igrejas pequenas (50-200 membros)**
- Orçamento limitado
- Poucos recursos tecnológicos
- Equipe administrativa reduzida
- Buscam organização e profissionalização
- Já usam WhatsApp para comunicação

### Dores Identificadas
1. **Falta de organização e controle** - dados espalhados
2. **Baixo engajamento dos membros** - faltas, desconexão
3. **Dificuldade de acompanhar crescimento** - sem métricas
4. **Líderes sobrecarregados** - muito tempo em tarefas administrativas

### Infraestrutura
- **Deploy**: Railway (atual)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Email**: Resend
- **WhatsApp**: Evolution API (nova integração)

---

## 💡 EXEMPLOS DE USO (User Stories)

### História 1: Pastor Carlos - Primeira Semana
```
Dia 1 (Segunda, 10h):
- Carlos descobre EKKLE via Google
- Cria conta, faz upload de planilha com 80 membros
- Sistema cria 5 células automaticamente
- Conecta WhatsApp da igreja via QR Code
- ✅ Setup completo em 12 minutos

Dia 2 (Terça, 15h):
- Cria evento "Reunião de Célula - Quinta 19h30"
- Sistema envia lembretes automáticos via WhatsApp
- 68 dos 80 membros confirmam presença
- Carlos está impressionado

Dia 5 (Sexta, 9h):
- Abre dashboard: 72 presentes nas reuniões (90% de taxa)
- Vê que 3 membros faltaram 2x seguidas
- Sistema sugere: "Enviar mensagem de follow-up?"
- Carlos clica, personaliza template, envia
- ✅ Carlos renova assinatura por 1 ano
```

### História 2: Líder Mariana - Rotina Semanal
```
Segunda 9h:
- Recebe notificação: "3 aniversários esta semana"
- Clica, sistema envia WhatsApp automático para aniversariantes

Quarta 18h (1h antes da reunião):
- Sistema já enviou lembretes automáticos
- Mariana só precisa confirmar quem veio via QR Code
- Membros escaneiam ao chegar (5 segundos)

Quarta 21h (fim da reunião):
- Mariana preenche relatório rápido (2 minutos)
- Sistema já tem presença registrada (QR Code)
- Só marca: teve louvor ✓, oração ✓, lanche ✓
- Adiciona 1 visitante novo: João Silva

Quinta 10h:
- Sistema envia WhatsApp para João: "Foi ótimo te conhecer!"
- Mariana nem precisou lembrar
- ✅ Mariana economiza 2h por semana vs antes
```

### História 3: Igreja Crescendo
```
Mês 1: 80 membros, 5 células, 75% presença
Mês 3: 95 membros, 6 células, 82% presença
Mês 6: 120 membros, 8 células, 85% presença

Pastor vê no dashboard:
- 📈 +50% crescimento em 6 meses
- 🎯 Taxa de conversão visitante→membro: 65%
- ⭐ Célula destaque: Líder João (92% presença)
- ⚠️ Alerta: Célula Zona Sul precisa atenção (60% presença)

Decisão baseada em dados:
- Promove João a supervisor
- Visita pessoal à Célula Zona Sul
- ✅ Igreja cresce sustentavelmente
```

---

## 🎯 FUNCIONALIDADES PRIORITÁRIAS (MVP para Vendas)

### 1. Sistema de Comunicação e Engajamento (CRÍTICO)

#### 1.1 Notificações e Lembretes Automáticos via WhatsApp
**Por quê**: Resolve DIRETAMENTE as dores de engajamento e sobrecarga de líderes

**Funcionalidades**:
- 📱 **WhatsApp Oficial da Igreja** (Evolution API)
  - **Setup inicial**: Pastor conecta WhatsApp da igreja via QR Code
  - **Mensagens automáticas**:
    - 24h antes: "🙏 Lembrete: Reunião da célula amanhã às 19h30"
    - Inclui: endereço, horário, mensagem personalizada do líder
  - **Confirmação de presença**:
    - Botões interativos: "✅ Vou confirmar" / "❌ Não posso"
    - Mensagens para quem faltou: "Sentimos sua falta! Como você está?"
  - **Envio em massa segmentado**:
    - Por célula, por estágio do membro, ou personalizado
    - Respeita limites do WhatsApp (evita ban)
- 📧 **Email como backup**
  - Para quem não tem WhatsApp
  - Templates HTML profissionais (Resend)
- 🔔 **Notificações push** (navegador)
  - Avisos de novos eventos
  - Lembretes de aniversários de membros

**Impacto**:
- Reduz 70% do tempo que líderes gastam lembrando membros
- Aumenta presença nas reuniões em 20-30%
- Demonstra valor IMEDIATO para igrejas
- **Diferencial**: Igreja usa SEU PRÓPRIO WhatsApp (não número desconhecido)

**Tech Stack**:
- **Evolution API** (WhatsApp multi-device)
  - Conexão via QR Code (1 instância por igreja)
  - Webhooks para receber respostas
  - API REST para envio de mensagens
- Resend (email backup)
- Web Push API para notificações browser
- Cron jobs (node-cron no Railway)

---

#### 1.2 Calendário de Eventos da Célula/Igreja
**Por quê**: Organização e engajamento - membros sempre sabem o que vem por aí

**Funcionalidades**:
- 📅 Calendário visual com reuniões, cultos, eventos especiais
- Sincronização com Google Calendar/Outlook
- Membros podem adicionar eventos à sua agenda pessoal
- View por célula e por igreja toda
- Contagem regressiva para próxima reunião no dashboard

**Impacto**:
- Elimina confusão sobre "quando é a próxima reunião?"
- Profissionaliza a imagem da igreja
- Feature diferenciadora vs planilhas

**Tech Stack**:
- FullCalendar.js ou React Big Calendar
- Google Calendar API / Microsoft Graph API
- iCal export (.ics files)

---

### 2. Analytics e Relatórios Automáticos (CRÍTICO)

#### 2.1 Dashboard de Crescimento e Saúde das Células
**Por quê**: Resolve a dor de "dificuldade de acompanhar crescimento"

**Funcionalidades**:
- 📊 **Métricas de crescimento**:
  - Visitantes → Membros (taxa de conversão)
  - Crescimento mês a mês
  - Células mais/menos ativas
  - Taxa de retenção de novos membros
- 🎯 **Alertas automáticos**:
  - Células com queda de presença > 30%
  - Membros que faltaram 3+ reuniões consecutivas
  - Células sem relatório há 2+ semanas
- 📈 **Comparações**:
  - Sua célula vs média da igreja
  - Este mês vs mês anterior
  - Benchmark por bairro/região

**Impacto**:
- Pastores tomam decisões baseadas em dados
- Identifica problemas antes que células morram
- Justifica investimento no sistema (ROI visível)

**Tech Stack**:
- Chart.js ou Recharts (já tem gráfico básico)
- Cálculos de métricas via server actions
- PostgreSQL queries otimizadas com CTEs

---

#### 2.2 Relatórios Automáticos Semanais/Mensais
**Por quê**: Reduz sobrecarga de líderes e pastores

**Funcionalidades**:
- 📤 Email automático semanal para pastores:
  - "Resumo da semana: 8 células reuniram, 45 presentes, 3 decisões"
- 📤 Email mensal para líderes:
  - "Sua célula em Janeiro: 12 membros, 85% presença, 2 novos visitantes"
- 🔄 PDF automático anexado
- Opção de compartilhar relatório com conselho/liderança

**Impacto**:
- Elimina trabalho manual de compilar relatórios
- Mantém liderança informada sem esforço
- Profissionaliza comunicação institucional

**Tech Stack**:
- Resend (emails já funcionam)
- Cron jobs para agendamento
- Templates HTML reutilizáveis
- PDF generation (já existe parcialmente)

---

### 3. Acompanhamento Pastoral e Discipulado

#### 3.1 Histórico e Jornada do Membro
**Por quê**: Resolve organização e permite acompanhamento personalizado

**Funcionalidades**:
- 📝 **Timeline do membro**:
  - Data de primeira visita
  - Quando virou membro regular
  - Presença em reuniões (histórico visual)
  - Notas/observações do líder
  - Decisões tomadas (batismo, liderança, etc.)
- 🏷️ **Tags personalizadas**:
  - "Necessita visita", "Aniversário este mês", "Líder em treinamento"
- 📞 **Lembretes de follow-up**:
  - "João faltou 2x - agendar ligação"
  - "Maria visitou há 1 mês - ainda não voltou"

**Impacto**:
- Nenhum membro "cai nas brechas"
- Líderes sabem exatamente quem precisa atenção
- Demonstra cuidado pastoral organizado

**Tech Stack**:
- Nova tabela: `member_notes` e `member_timeline`
- UI com tabs: Dados Pessoais | Timeline | Notas
- Filtros e tags no member list

---

#### 3.2 Lembretes de Aniversários e Datas Importantes
**Por quê**: Engajamento e cuidado pastoral

**Funcionalidades**:
- 🎂 **Notificação automática** no dashboard: "3 aniversários esta semana"
- 📧 **Email para líder** com lista de aniversariantes do mês
- 🎉 **WhatsApp automático de aniversário**:
  - "Parabéns {nome}! 🎂 Que Deus te abençoe muito neste novo ano de vida!"
  - Enviado do WhatsApp oficial da igreja
  - Personalizado com nome do aniversariante
- 📅 **Datas importantes**:
  - Batismo, casamento, conversão
  - Aniversário de chegada na célula

**Impacto**:
- Pequeno detalhe, grande impacto emocional
- Aumenta senso de comunidade
- Feature "wow" que encanta na demo
- Membros se sentem valorizados

**Tech Stack**:
- Campo `birth_date` na tabela `profiles`
- Queries para aniversários próximos
- Cron job diário verificando aniversários
- Evolution API para envio de mensagens de parabéns

---

### 4. Ferramentas para Reduzir Sobrecarga de Líderes

#### 4.1 Check-in Simplificado de Presença
**Por quê**: Líderes gastam muito tempo fazendo chamada manualmente

**Funcionalidades**:
- ✅ **QR Code check-in**:
  - Líder gera QR code para a reunião
  - Membros escaneiam ao chegar
  - Presença registrada automaticamente
- 📱 **Link de check-in**:
  - Link único por reunião enviado via WhatsApp
  - "Estou presente na reunião de hoje" (um clique)
- 👥 **Lista rápida com fotos**:
  - Interface touch-friendly para marcar presente/ausente
  - Ordenado por quem veio na última reunião (facilita localizar)

**Impacto**:
- Economiza 5-10min por reunião
- Dados mais precisos (menos erros)
- Experiência moderna e profissional

**Tech Stack**:
- QR Code generation (qrcode.react)
- Magic links com tokens temporários
- Touch-optimized UI para mobile

---

#### 4.2 Templates de Mensagens e Comunicação
**Por quê**: Líderes enviam as mesmas mensagens repetidamente

**Funcionalidades**:
- 📝 **Biblioteca de templates pré-prontos**:
  - "🙏 Lembrete de reunião"
  - "👋 Boas-vindas a novos membros"
  - "😢 Falta sentida"
  - "🎉 Convite para evento especial"
  - "📖 Devocional da semana"
  - "💰 Campanha de oração/jejum"
- ✏️ **Editor com variáveis dinâmicas**:
  - `{nome}`, `{data_reuniao}`, `{endereco}`, `{hora}`, `{lider}`
  - Preview em tempo real
  - Suporte a emojis e formatação WhatsApp
- 📤 **Envio em massa inteligente**:
  - Selecionar destinatários (toda célula, só membros, só visitantes)
  - Agendamento de envio
  - Intervalo entre mensagens (evita ban do WhatsApp)
  - Relatório de entrega (entregue, lido, erro)
- 🎨 **Templates customizáveis**:
  - Pastor pode criar templates próprios
  - Compartilhar templates entre células da mesma igreja

**Impacto**:
- Reduz tempo de comunicação em 80%
- Padroniza qualidade das mensagens
- Elimina retrabalho
- Profissionaliza comunicação da igreja

**Tech Stack**:
- Nova tabela: `message_templates`
- String interpolation para variáveis
- Evolution API com rate limiting
- Queue system para envios em massa (Bull + Redis)

---

### 5. Onboarding e Usabilidade para Iniciantes

#### 5.1 Tour Guiado e Vídeos Tutoriais
**Por quê**: Igrejas pequenas têm resistência tecnológica - precisam de mão na roda

**Funcionalidades**:
- 🎓 **Onboarding interativo** (primeira vez):
  - "Bem-vindo! Vamos criar sua primeira célula"
  - Step-by-step com tooltips
- 🎥 **Vídeos curtos embutidos**:
  - "Como adicionar membros" (30s)
  - "Como criar um relatório de reunião" (1min)
- ❓ **Central de ajuda in-app**:
  - Ícone "?" em cada página
  - FAQs contextuais

**Impacto**:
- Reduz fricção na adoção
- Menos suporte necessário
- Aumenta retenção nas primeiras semanas (crítico)

**Tech Stack**:
- React Joyride ou Shepherd.js (tours)
- Loom/YouTube embeds
- Modal com help content

---

#### 5.2 Importação de Dados Facilitada
**Por quê**: Migração de Excel/Google Sheets é barreira de entrada

**Funcionalidades**:
- 📊 **Upload de planilha CSV/XLSX**:
  - Template para download
  - Mapeamento de colunas (Nome → full_name)
  - Validação antes de importar
- 📱 **Importação via Google Contacts**:
  - OAuth login
  - Selecionar contatos
  - Criar membros automaticamente

**Impacto**:
- Remove barreira #1 de adoção
- Migração em minutos vs horas de digitação
- "Convencedor" na demo de vendas

**Tech Stack**:
- SheetJS (xlsx) para parsing
- CSV parser
- Google People API
- Validação com Zod

---

## 📱 INTEGRAÇÃO EVOLUTION API - DETALHAMENTO TÉCNICO

### Arquitetura WhatsApp

#### Modelo de Instâncias
```
EKKLE Backend (Railway)
├── Evolution API Server (Railway - container separado)
│   ├── Instância 1: Igreja Alfa (conexão QR Code 1)
│   ├── Instância 2: Igreja Beta (conexão QR Code 2)
│   └── Instância N: Igreja Omega (conexão QR Code N)
└── Webhook Handler (recebe eventos de todas instâncias)
```

**Cada igreja tem**:
- 1 instância Evolution API dedicada
- 1 sessão WhatsApp conectada via QR Code
- Webhooks configurados para receber mensagens

#### Fluxo de Conexão do WhatsApp

**1. Setup Inicial (Pastor)**
```
1. Pastor acessa: /configuracoes/whatsapp
2. Sistema cria instância Evolution API para igreja
3. Exibe QR Code na tela
4. Pastor escaneia com WhatsApp (Dispositivos Conectados)
5. Sistema detecta conexão via webhook
6. Status muda para "Conectado ✅"
7. Pastor pode enviar mensagem de teste
```

**2. Envio de Mensagens**
```
Líder clica "Enviar lembrete de reunião"
  ↓
Sistema busca template
  ↓
Preenche variáveis ({nome}, {data})
  ↓
Envia para fila de mensagens (Bull Queue)
  ↓
Worker processa fila (rate limit: 1 msg/3s)
  ↓
Evolution API envia via WhatsApp da igreja
  ↓
Webhook retorna status (entregue/lido)
  ↓
Sistema atualiza histórico de comunicação
```

**3. Recebimento de Respostas**
```
Membro responde no WhatsApp
  ↓
Evolution API recebe mensagem
  ↓
Envia webhook para EKKLE
  ↓
Sistema processa resposta:
  - "Confirmo presença" → Marca como confirmado
  - Número desconhecido → Sugere cadastro
  ↓
Notifica líder no dashboard
```

#### Configurações Evolution API

**Variáveis de Ambiente (Railway)**:
```bash
# Evolution API
EVOLUTION_API_URL=https://evolution-api.railway.internal
EVOLUTION_API_KEY=<chave_gerada_randomicamente>

# Webhook
EVOLUTION_WEBHOOK_URL=https://ekkle.com.br/api/webhooks/evolution

# Redis (para queue)
REDIS_URL=<redis_railway_ou_upstash>
```

**Endpoints Evolution API Utilizados**:
```
POST /instance/create          # Criar instância para igreja
GET  /instance/connect/:name   # Obter QR Code
POST /message/sendText/:name   # Enviar mensagem de texto
POST /message/sendButtons/:name # Enviar com botões interativos
GET  /instance/connectionState # Status da conexão
DELETE /instance/logout/:name  # Desconectar WhatsApp
```

#### Tabela de Controle (Database)

```sql
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches UNIQUE,
  instance_name TEXT UNIQUE, -- ex: "church_abc123"
  phone_number TEXT, -- número conectado (extraído do webhook)
  status TEXT, -- DISCONNECTED, CONNECTING, CONNECTED, ERROR
  qr_code TEXT, -- base64 do QR (temporário)
  connected_at TIMESTAMPTZ,
  last_ping TIMESTAMPTZ,
  metadata JSONB, -- info do dispositivo, versão WA, etc
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches,
  instance_name TEXT,
  direction TEXT, -- OUTBOUND, INBOUND
  from_number TEXT, -- número que enviou
  to_number TEXT, -- número que recebeu
  message_type TEXT, -- TEXT, IMAGE, AUDIO, BUTTON_RESPONSE
  content TEXT,
  template_id UUID REFERENCES message_templates (nullable),
  context_type TEXT, -- MEETING_REMINDER, BIRTHDAY, FOLLOW_UP
  context_id UUID, -- ID da reunião, membro, etc
  status TEXT, -- PENDING, SENT, DELIVERED, READ, FAILED
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_whatsapp_messages_church ON whatsapp_messages(church_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
```

#### Componentes de UI

**Página de Configuração WhatsApp** (`/configuracoes/whatsapp`)
```tsx
- Status da conexão (badge verde/vermelho)
- Botão "Conectar WhatsApp"
- QR Code (se em processo de conexão)
- Informações: número conectado, data de conexão
- Botão "Desconectar" (com confirmação)
- Teste de envio: campo para número + mensagem
- Histórico de mensagens (últimas 50)
- Estatísticas: enviadas hoje, taxa de entrega
```

**Central de Comunicação** (`/comunicacao`)
```tsx
- Criar nova mensagem
  - Selecionar template ou escrever livre
  - Escolher destinatários (filtros: célula, estágio, última presença)
  - Preview com variáveis preenchidas
  - Agendar ou enviar agora
- Mensagens agendadas (lista)
- Histórico de envios (filtros e busca)
- Caixa de entrada (respostas recebidas)
```

#### Rate Limiting e Segurança

**Limites do WhatsApp (para evitar ban)**:
- Máximo 1 mensagem a cada 3 segundos
- Máximo 256 mensagens por dia para números não salvos
- Evitar mensagens idênticas em sequência
- Não enviar spam ou conteúdo proibido

**Implementação EKKLE**:
```typescript
// Queue com Bull
const messageQueue = new Queue('whatsapp-messages', {
  redis: process.env.REDIS_URL,
  limiter: {
    max: 20, // 20 mensagens
    duration: 60000, // por minuto
  }
});

// Worker
messageQueue.process(async (job) => {
  const { instanceName, to, message } = job.data;

  // Aguarda 3 segundos entre mensagens
  await delay(3000);

  // Envia via Evolution API
  const result = await evolutionApi.sendText(instanceName, to, message);

  // Salva no histórico
  await saveMessageHistory(result);

  return result;
});
```

#### Monitoramento e Alertas

**Ping automático** (cron a cada 5 minutos):
```typescript
// Verifica se WhatsApp está conectado
const status = await evolutionApi.getConnectionState(instanceName);

if (status !== 'open') {
  // Marca como desconectado no DB
  await updateInstanceStatus(churchId, 'DISCONNECTED');

  // Envia email para pastor
  await sendAlert(pastor.email, 'WhatsApp desconectado - reconecte via QR Code');
}
```

**Dashboard de Saúde**:
- Status de todas instâncias
- Taxa de entrega de mensagens
- Erros recentes
- Consumo de API

#### Custos e Escalabilidade

**Evolution API**:
- Self-hosted no Railway (container dedicado)
- Custo estimado: $5-10/mês por instância
- Alternativa: usar serviço gerenciado Evolution Cloud ($15-30/mês)

**Redis** (para queue):
- Upstash free tier: até 10k comandos/dia (suficiente para 20-30 igrejas)
- Railway Redis: $5/mês
- Upgrade quando escalar

**Exemplo de cálculo**:
- 50 igrejas × $7/mês (Evolution) = $350/mês
- Redis: $5-10/mês
- **Total**: ~$360/mês para 50 igrejas
- **Por igreja**: $7/mês de custo operacional

**Modelo de Pricing** (considerando R$7 de custo):
- Plano Essencial R$49/mês: Inclui WhatsApp (margem de R$42)
- Plano Premium R$99/mês: Inclui WhatsApp + features avançadas (margem de R$92)

---

## 🚀 FUNCIONALIDADES COMPLEMENTARES (Fase 2)

### 6. Funcionalidades de Retenção e Upsell

#### 6.1 Modo Multi-Igreja
**Por quê**: Pastores usam em uma igreja, querem em outras que lideram

**Funcionalidades**:
- Usuário pode gerenciar múltiplas igrejas
- Switcher no header
- Dashboard consolidado (opcional)

**Impacto**:
- Aumenta lifetime value
- Cria rede de referências

---

#### 6.2 Planos e Upgrades
**Por quê**: Monetização e escalonamento

**Funcionalidades**:
- **Plano Gratuito** (limitado):
  - 1 célula, 20 membros
  - Relatórios básicos
  - Sem notificações automáticas
- **Plano Essencial** (R$ 49/mês):
  - Células ilimitadas, 200 membros
  - Notificações email
  - Relatórios automáticos
- **Plano Premium** (R$ 99/mês):
  - Membros ilimitados
  - WhatsApp + SMS
  - Analytics avançados
  - Multi-igreja

**Impacto**:
- Permite teste sem risco
- Path claro de monetização
- Incentiva crescimento orgânico

**Tech Stack**:
- Stripe para pagamentos
- Feature flags por plano
- Billing portal

---

### 7. Integrações e Ecossistema

#### 7.1 Integração com Ferramentas de Igreja
**Por quê**: Igrejas já usam outras ferramentas

**Funcionalidades**:
- **WhatsApp** (Evolution API): Comunicação principal ✅
- **Zoom/Google Meet**: Links de reunião online automáticos
- **YouTube/Facebook Live**: Embed de transmissões ao vivo
- **Google Sheets**: Export automático de relatórios
- **Calendly**: Agendamento de visitas pastorais
- **Pix/PagSeguro**: Integração de ofertas/dízimos (futuro)
- **Webhooks**: API para automações personalizadas (Zapier/Make)

**Impacto**:
- Reduz silos de informação
- Atrai igrejas que já têm workflows
- Diferenciador competitivo
- Foco em ferramentas populares no Brasil

---

## 📊 ROADMAP SUGERIDO

### Fase 1 (Mês 1-2): Features de Conversão
1. ✅ Calendário de eventos
2. ✅ Notificações de lembrete (email)
3. ✅ Dashboard de crescimento melhorado
4. ✅ Importação CSV
5. ✅ Tour guiado

**Objetivo**: Reduzir fricção de adoção e mostrar valor rápido

---

### Fase 2 (Mês 3-4): Features de Engajamento
1. ✅ **WhatsApp via Evolution API** (conexão QR Code, envio automático)
2. ✅ QR Code check-in de presença
3. ✅ Templates de mensagens WhatsApp
4. ✅ Histórico do membro (timeline)
5. ✅ Lembretes de aniversário via WhatsApp

**Objetivo**: Aumentar uso diário e engajamento de líderes

---

### Fase 3 (Mês 5-6): Features de Retenção
1. ✅ Relatórios automáticos semanais/mensais
2. ✅ Planos e billing (Stripe)
3. ✅ Modo multi-igreja
4. ✅ Integrações básicas (Zoom, Google Calendar)
5. ✅ Central de ajuda

**Objetivo**: Reduzir churn e aumentar LTV

---

## 🎁 DIFERENCIAIS COMPETITIVOS

### O que torna EKKLE único?

1. **Foco laser em células** (não tenta fazer tudo)
2. **Simplicidade para igrejas pequenas** (sem overwhelm)
3. **Automação de comunicação** (economiza tempo real)
4. **Onboarding perfeito** (sem curva de aprendizado)
5. **Preço acessível** (R$ 49/mês vs R$ 200+ de concorrentes)
6. **Suporte em português** (maioria dos concorrentes é internacional)

---

## 🎯 MÉTRICAS DE SUCESSO

### Para validar cada feature:

- **Taxa de ativação**: % de igrejas que completam setup em 7 dias
- **Features mais usadas**: Ranking de uso por feature
- **NPS**: Satisfação de usuários
- **Churn rate**: % de cancelamentos mensais
- **Tempo até valor**: Dias até primeira reunião registrada
- **Engajamento de líderes**: % que fazem login semanalmente

---

## 💡 MENSAGENS DE VENDA (Landing Page)

### Headline
"Organize sua igreja, engaje seus membros e cresça com propósito"

### Sub-headline
"EKKLE é a plataforma completa para gestão de células. Simples, poderosa e feita para igrejas brasileiras."

### Benefícios
✅ Nunca mais perca um membro por falta de acompanhamento
✅ Reduza 70% do tempo em tarefas administrativas
✅ Veja o crescimento da sua igreja em tempo real
✅ Comece grátis, sem cartão de crédito

### Social Proof
"Desde que começamos a usar EKKLE, nossa presença nas células aumentou 40% e conseguimos acompanhar cada membro de perto" - Pastor João, Igreja da Restauração

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### Arquivos Críticos a Modificar

**Novos Server Actions**:
- `/src/actions/notifications.ts` - Email, SMS, Push notifications
- `/src/actions/calendar.ts` - Eventos e integrações de calendário
- `/src/actions/analytics.ts` - Métricas e relatórios avançados
- `/src/actions/imports.ts` - CSV/Excel upload e validação
- `/src/actions/templates.ts` - Templates de mensagens

**Novas Páginas**:
- `/src/app/(app)/calendario/page.tsx` - Calendário geral
- `/src/app/(app)/comunicacao/page.tsx` - Central de mensagens WhatsApp
- `/src/app/(app)/configuracoes/whatsapp/page.tsx` - Conexão WhatsApp via QR Code
- `/src/app/(app)/importar/page.tsx` - Import wizard
- `/src/app/(app)/analitico/page.tsx` - Analytics avançado
- `/src/app/(app)/ajuda/page.tsx` - Help center
- `/src/app/api/webhooks/evolution/route.ts` - Webhook receiver Evolution API

**Novos Componentes**:
- `/src/components/calendar/` - Componentes de calendário
- `/src/components/whatsapp/` - QR Code connection, message composer, inbox
- `/src/components/notifications/` - Notification center
- `/src/components/qr-code/` - QR code generator/scanner (check-in)
- `/src/components/onboarding/` - Tour guiado
- `/src/components/charts/` - Gráficos avançados
- `/src/components/templates/` - Message template editor

**Novas Tabelas Database**:
```sql
-- Eventos/calendário
CREATE TABLE events (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches,
  cell_id UUID REFERENCES cells (nullable),
  title TEXT,
  description TEXT,
  event_type TEXT, -- CELL_MEETING, SERVICE, SPECIAL_EVENT
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  recurrence_rule TEXT, -- iCal RRULE
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches,
  profile_id UUID REFERENCES profiles (nullable), -- null = broadcast
  type TEXT, -- EMAIL, SMS, PUSH
  title TEXT,
  message TEXT,
  status TEXT, -- PENDING, SENT, FAILED
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Templates de mensagens
CREATE TABLE message_templates (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches,
  name TEXT,
  category TEXT, -- REMINDER, WELCOME, FOLLOW_UP
  subject TEXT,
  body TEXT, -- Com variáveis {nome}, {data}, etc
  channel TEXT, -- EMAIL, SMS, WHATSAPP
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Histórico do membro
CREATE TABLE member_timeline (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles,
  event_type TEXT, -- FIRST_VISIT, BECAME_MEMBER, BAPTISM, etc
  event_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ
);

-- Notas sobre membros
CREATE TABLE member_notes (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles,
  note TEXT,
  tags TEXT[], -- Array de tags
  created_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Instâncias WhatsApp (Evolution API)
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches UNIQUE,
  instance_name TEXT UNIQUE,
  phone_number TEXT,
  status TEXT, -- DISCONNECTED, CONNECTING, CONNECTED, ERROR
  qr_code TEXT,
  connected_at TIMESTAMPTZ,
  last_ping TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Histórico de mensagens WhatsApp
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches,
  instance_name TEXT,
  direction TEXT, -- OUTBOUND, INBOUND
  from_number TEXT,
  to_number TEXT,
  message_type TEXT,
  content TEXT,
  template_id UUID REFERENCES message_templates,
  context_type TEXT,
  context_id UUID,
  status TEXT, -- PENDING, SENT, DELIVERED, READ, FAILED
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

CREATE INDEX idx_whatsapp_messages_church ON whatsapp_messages(church_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
```

**Dependências a Adicionar**:
```json
{
  "@evolution-api/sdk": "^1.0.0",
  "axios": "^1.7.9",
  "bull": "^4.16.3",
  "ioredis": "^5.4.1",
  "node-cron": "^3.0.3",
  "qrcode.react": "^4.1.0",
  "react-big-calendar": "^1.15.0",
  "xlsx": "^0.18.5",
  "stripe": "^17.5.0",
  "react-joyride": "^2.9.2"
}
```

**Variáveis de Ambiente (Railway)**:
```bash
# Existentes
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://ekkle.com.br
RESEND_API_KEY=
FROM_EMAIL=contato@ekkle.com.br

# Novas - Evolution API
EVOLUTION_API_URL=https://evolution-api.railway.internal
EVOLUTION_API_KEY=<generated_key>
EVOLUTION_WEBHOOK_URL=https://ekkle.com.br/api/webhooks/evolution

# Redis (para message queue)
REDIS_URL=<railway_redis_ou_upstash>
```

**Deploy Railway - Configuração Multi-Container**:
```yaml
# railway.json (ou Railway dashboard)
services:
  - name: ekkle-web
    source: .
    buildCommand: npm run build
    startCommand: npm start
    healthcheck: /api/health
    env:
      - NODE_ENV=production

  - name: evolution-api
    image: atendai/evolution-api:latest
    env:
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - DATABASE_ENABLED=true
      - DATABASE_CONNECTION_URI=${DATABASE_URL}
    healthcheck: /
    port: 8080
```

---

## 🚂 DEPLOY NO RAILWAY - GUIA COMPLETO

### Arquitetura de Deploy

```
Railway Project: EKKLE Production
├── Service 1: ekkle-web (Next.js app)
│   ├── Build: npm install && npm run build
│   ├── Start: npm start
│   ├── Port: 3000
│   └── Domain: ekkle.com.br
│
├── Service 2: evolution-api (WhatsApp)
│   ├── Image: atendai/evolution-api:latest
│   ├── Port: 8080
│   ├── Internal URL: evolution-api.railway.internal:8080
│   └── Volumes: /evolution/instances (persist QR codes)
│
├── Service 3: redis (Message Queue)
│   ├── Image: redis:7-alpine
│   ├── Port: 6379
│   ├── Internal URL: redis.railway.internal:6379
│   └── Volumes: /data
│
└── Database: Supabase PostgreSQL (external)
```

### Passo a Passo de Deploy

#### 1. Setup Inicial do Projeto

**No Railway Dashboard**:
1. Criar novo projeto: "EKKLE Production"
2. Conectar repositório GitHub: `pfraquete/EKKLE`
3. Branch principal: `main` (ou a que preferir)

#### 2. Deploy do Next.js App

**Service: ekkle-web**
```bash
# Settings
Root Directory: /
Build Command: npm install && npm run build
Start Command: npm start
Watch Paths: src/**, package.json

# Environment Variables (copiar do .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://ekkle.com.br
RESEND_API_KEY=re_...
FROM_EMAIL=contato@ekkle.com.br

# Novas variáveis
EVOLUTION_API_URL=${{evolution-api.RAILWAY_PRIVATE_DOMAIN}}
EVOLUTION_API_KEY=<gerar_chave_aleatoria_forte>
REDIS_URL=redis://${{redis.RAILWAY_PRIVATE_DOMAIN}}:6379
```

**Gerar domínio**:
- Railway auto-gera: `ekkle-production.up.railway.app`
- Adicionar domínio customizado: `ekkle.com.br` (configurar DNS)

#### 3. Deploy do Evolution API

**Service: evolution-api**
```bash
# Source
Deploy from: Docker Image
Image: atendai/evolution-api:latest
Port: 8080

# Environment Variables
AUTHENTICATION_API_KEY=${{ekkle-web.EVOLUTION_API_KEY}} # mesma chave
SERVER_URL=https://evolution-api-ekkle.up.railway.app
CORS_ORIGIN=https://ekkle.com.br
CORS_CREDENTIALS=true

# Database (Evolution API pode usar mesmo Postgres do Supabase)
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
DATABASE_CONNECTION_CLIENT_NAME=evolution_api

# Storage (para QR codes e sessions)
STORE_MESSAGES=true
STORE_MESSAGE_UP=true
STORE_CONTACTS=true

# Webhooks
WEBHOOK_GLOBAL_URL=https://ekkle.com.br/api/webhooks/evolution
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
```

**Volumes** (persistir sessões):
- Mount Path: `/evolution/instances`
- Size: 1GB (suficiente para 100+ igrejas)

#### 4. Deploy do Redis

**Service: redis**
```bash
# Source
Deploy from: Docker Image
Image: redis:7-alpine
Port: 6379

# Command
redis-server --appendonly yes --requirepass ${{REDIS_PASSWORD}}

# Environment Variables
REDIS_PASSWORD=<gerar_senha_forte>

# Volumes
Mount Path: /data
Size: 512MB
```

**Alternativa**: Usar Upstash Redis (managed, free tier disponível)
- Criar conta em upstash.com
- Criar database Redis
- Copiar `REDIS_URL` (já vem com senha)
- Usar no lugar do container Redis

#### 5. Configuração de Networking

**Comunicação interna** (não exposta publicamente):
```
ekkle-web → evolution-api: ${{evolution-api.RAILWAY_PRIVATE_DOMAIN}}:8080
ekkle-web → redis: ${{redis.RAILWAY_PRIVATE_DOMAIN}}:6379
evolution-api → ekkle-web (webhooks): https://ekkle.com.br/api/webhooks/evolution
```

**Comunicação externa**:
- ekkle.com.br (usuários finais)
- evolution-api pode ter domínio público (opcional, para debug)

#### 6. Health Checks

**ekkle-web**:
```typescript
// src/app/api/health/route.ts
export async function GET() {
  // Verifica conexões
  const supabase = await checkSupabase();
  const redis = await checkRedis();
  const evolution = await checkEvolution();

  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: { supabase, redis, evolution }
  });
}
```

**Railway Health Check**:
- Path: `/api/health`
- Interval: 30s
- Timeout: 10s
- Restart se falhar 3x

#### 7. Cron Jobs (Agendamento)

**Opção 1: Railway Cron (recomendado)**
```bash
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  },
  "cron": [
    {
      "schedule": "0 9 * * *",
      "command": "node scripts/send-daily-reminders.js"
    },
    {
      "schedule": "*/5 * * * *",
      "command": "node scripts/check-whatsapp-health.js"
    }
  ]
}
```

**Opção 2: node-cron interno**
```typescript
// src/lib/cron.ts
import cron from 'node-cron';

// Verificar WhatsApp a cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  await checkWhatsAppHealth();
});

// Enviar lembretes às 9h
cron.schedule('0 9 * * *', async () => {
  await sendDailyReminders();
});

// Aniversários às 8h
cron.schedule('0 8 * * *', async () => {
  await sendBirthdayMessages();
});
```

#### 8. Monitoramento e Logs

**Railway Logs**:
- Acessar via dashboard ou CLI: `railway logs`
- Filtrar por service: `railway logs --service ekkle-web`
- Follow em tempo real: `railway logs -f`

**Logs estruturados** (implementar):
```typescript
// src/lib/logger.ts
export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', msg, meta, timestamp: new Date() }));
  },
  error: (msg: string, error?: any) => {
    console.error(JSON.stringify({ level: 'error', msg, error: error?.message, stack: error?.stack, timestamp: new Date() }));
  }
};
```

**Integração com Sentry** (opcional):
```bash
npm install @sentry/nextjs

# .env
NEXT_PUBLIC_SENTRY_DSN=https://...
```

#### 9. Backups e Disaster Recovery

**Database** (Supabase):
- Backups automáticos diários (Supabase gerencia)
- Point-in-time recovery disponível

**Evolution API Sessions**:
- Volumes do Railway têm snapshot automático
- Baixar backup manual: `railway volume download`

**Código**:
- Git é a fonte da verdade
- Tags de versão: `git tag v1.0.0 && git push --tags`

#### 10. CI/CD Pipeline

**Automatic Deploys** (Railway default):
```
Push to main → Railway detecta → Build → Deploy → Health check → Live
```

**Deploy Preview** (branches):
- Criar PR → Railway cria ambiente temporário
- URL: `pr-123-ekkle.up.railway.app`
- Testa antes de merge

**Rollback**:
- Railway dashboard → Deployments → Rollback to previous

#### 11. Custos Estimados (Railway)

```
Next.js App (ekkle-web):      $5-10/mês  (depende do uso)
Evolution API:                 $5-7/mês   (1 container)
Redis:                         $5/mês     (ou Upstash free)
Outbound bandwidth:            Incluído até 100GB

Total estimado: $15-22/mês para infraestrutura

Por igreja (50 igrejas):       $0.30-0.44/mês
Preço cobrado:                 R$49/mês (~$10)
Margem:                        ~95%+ 🚀
```

**Alternativas para reduzir custo**:
- Redis: Upstash free tier (10k req/day)
- Evolution API: 1 container shared para múltiplas igrejas
- Auto-scaling: Desliga à noite se não houver uso

---

## ✅ VERIFICAÇÃO

### Como testar as features implementadas:

1. **Conexão WhatsApp (Evolution API)**:
   - Acessar `/configuracoes/whatsapp`
   - Clicar "Conectar WhatsApp"
   - Verificar se QR Code aparece
   - Escanear com WhatsApp (Dispositivos Conectados)
   - Confirmar status mudou para "Conectado ✅"
   - Enviar mensagem de teste para seu próprio número
   - Verificar recebimento no WhatsApp

2. **Notificações WhatsApp Automáticas**:
   - Criar reunião agendada para daqui 1 hora
   - Adicionar membros com números de WhatsApp
   - Aguardar cron job executar (ou trigger manual)
   - Verificar se membros receberam mensagem
   - Checar histórico em `/comunicacao`
   - Validar status: SENT → DELIVERED → READ

3. **Templates de Mensagens**:
   - Criar novo template: "Lembrete de Reunião"
   - Adicionar variáveis: {nome}, {data_reuniao}
   - Selecionar destinatários (filtro: célula X)
   - Preview com dados reais
   - Enviar e verificar queue processing
   - Validar intervalo de 3s entre mensagens

4. **Calendário**:
   - Criar evento
   - Verificar exibição no calendário
   - Testar export .ics
   - Sincronizar com Google Calendar

5. **Import CSV**:
   - Baixar template
   - Preencher com dados de teste
   - Upload e verificar validação
   - Confirmar import e checar membros criados

6. **QR Code Check-in**:
   - Gerar QR code para reunião
   - Escanear com celular
   - Verificar presença registrada em tempo real

7. **Dashboard Analytics**:
   - Verificar cálculo de taxa de conversão
   - Testar alertas (criar cenário de célula com queda de presença)
   - Validar gráficos com dados reais

8. **Webhooks Evolution API**:
   - Responder mensagem no WhatsApp
   - Verificar se webhook chegou em `/api/webhooks/evolution`
   - Validar processamento (salvar em `whatsapp_messages`)
   - Testar diferentes tipos: texto, imagem, áudio

9. **Health Checks**:
   - Acessar `/api/health`
   - Verificar status de todos serviços (Supabase, Redis, Evolution)
   - Simular falha (desconectar WhatsApp)
   - Verificar alerta por email para pastor

10. **Performance e Rate Limiting**:
    - Enviar 100 mensagens em massa
    - Verificar queue processing (1 msg a cada 3s)
    - Monitorar logs para erros
    - Validar taxa de entrega > 95%

---

## 📝 NOTAS FINAIS

Este plano prioriza funcionalidades que:
✅ Resolvem dores reais das igrejas alvo
✅ São tecnicamente viáveis com o stack atual (Next.js + Railway + Evolution API)
✅ Têm alto impacto na aquisição e retenção
✅ Diferenciam EKKLE da concorrência
✅ Podem ser implementadas incrementalmente
✅ Usam ferramentas brasileiras e acessíveis (Evolution API vs Twilio)

O foco está em **reduzir fricção, automatizar trabalho manual e demonstrar valor rapidamente** - crítico para converter igrejas pequenas com orçamento limitado.

### Vantagens da Arquitetura Escolhida

**Evolution API** (vs Twilio/WhatsApp Business API):
- ✅ **Custo**: ~$7/mês vs $50+/mês do Twilio
- ✅ **Simplicidade**: QR Code vs processo de aprovação Facebook
- ✅ **Confiança**: Igreja usa próprio número (não número desconhecido)
- ✅ **Flexibilidade**: Funciona com WhatsApp pessoal/business
- ✅ **Brasil**: Solução brasileira, suporte em PT-BR

**Railway** (vs Vercel/AWS):
- ✅ **Multi-container**: Next.js + Evolution API + Redis em um projeto
- ✅ **Simplicidade**: Deploy automático via Git
- ✅ **Previsibilidade**: Preço fixo, sem surpresas
- ✅ **Networking**: Comunicação interna entre services
- ✅ **Volumes**: Persistência de sessões WhatsApp

### Próximos Passos

1. **Validar com usuários** (2-3 igrejas beta):
   - Quais features trazem mais valor?
   - O que está faltando?
   - UX está clara?

2. **Métricas de sucesso**:
   - Tempo de setup: < 15 minutos
   - Primeira mensagem enviada: < 24h após cadastro
   - Retenção 30 dias: > 80%
   - NPS: > 50

3. **Iteração**:
   - Fase 1 (Mês 1-2): MVP com calendário, notificações email, import
   - Fase 2 (Mês 3-4): WhatsApp Evolution API + templates + QR check-in
   - Fase 3 (Mês 5-6): Analytics avançado + billing + integrações

4. **Marketing**:
   - Landing page focada em dores (não features)
   - Vídeo demo 2min mostrando WhatsApp automático
   - Case study de igreja beta
   - Free trial 14 dias (sem cartão)

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| WhatsApp banir número da igreja | Média | Alto | Rate limiting rigoroso, educação sobre boas práticas, disclaimer no setup |
| Evolution API ficar offline | Baixa | Alto | Monitoramento + alertas, fallback para email, SLA com provider |
| Custo de infra escalar rápido | Média | Médio | Monitorar uso, otimizar queries, considerar auto-scaling |
| Adoção baixa por resistência tecnológica | Alta | Alto | Onboarding impecável, suporte proativo, vídeos tutoriais |
| Concorrência copiar features | Média | Baixo | Execução rápida, relacionamento próximo com clientes, features únicas |

### Conclusão

Este plano oferece um caminho claro para transformar EKKLE em uma ferramenta indispensável para igrejas pequenas no Brasil. O diferencial competitivo está na **simplicidade, automação via WhatsApp, e foco laser em células** - algo que grandes players internacionais não fazem bem.

Com implementação cuidadosa e foco no usuário, EKKLE pode se tornar o **padrão de mercado para gestão de células no Brasil**. 🚀

---

## ❓ FAQ - Dúvidas Antecipadas

### Sobre WhatsApp

**P: Meu WhatsApp pode ser banido por enviar mensagens automáticas?**
R: Não, se seguir as boas práticas. EKKLE implementa rate limiting (máximo 1 mensagem a cada 3 segundos) e você só envia para pessoas que já conhecem a igreja. Evite spam e mensagens idênticas em massa.

**P: Preciso de um número novo ou posso usar o WhatsApp da igreja?**
R: Pode usar o WhatsApp atual da igreja. Conecta via QR Code em "Dispositivos Conectados" (igual WhatsApp Web).

**P: E se eu desconectar o WhatsApp acidentalmente?**
R: Sistema envia alerta por email. É só reconectar via QR Code novamente. Sessões ficam salvas no servidor.

**P: Funciona com WhatsApp Business?**
R: Sim! Funciona tanto com WhatsApp normal quanto Business.

### Sobre Custos

**P: Quanto custa realmente? Tem taxa escondida?**
R: R$ 49/mês no plano Essencial, R$ 99/mês no Premium. Sem taxa de setup, sem cobrança por mensagem, sem surpresas. Cancela quando quiser.

**P: Por que é mais barato que concorrentes?**
R: Focamos só em células (não fazemos tudo). Usamos tecnologia eficiente (Evolution API vs Twilio). Somos brasileiros, sem custos de conversão de moeda.

**P: Tem teste grátis?**
R: Sim! 14 dias grátis, sem pedir cartão de crédito. Só email e senha.

### Sobre Privacidade e Segurança

**P: Os dados da minha igreja estão seguros?**
R: Sim. Usamos Supabase (banco de dados criptografado) com Row Level Security. Cada igreja só vê seus próprios dados. Backups diários automáticos.

**P: Vocês vendem dados de membros?**
R: NUNCA. Seus dados são seus. Não compartilhamos, não vendemos, não usamos para propaganda.

**P: E se eu quiser sair do EKKLE?**
R: Pode exportar todos os dados (CSV/PDF) a qualquer momento. Sem lock-in.

### Sobre Usabilidade

**P: Sou pastor, não entendo de tecnologia. É difícil?**
R: Foi feito pensando em você! Setup em 15 minutos com vídeos guiados. Suporte via WhatsApp em português. A maioria dos pastores aprende sozinho.

**P: Funciona no celular?**
R: Sim! Responsivo. Funciona em qualquer celular, tablet ou computador. Não precisa instalar app.

**P: E se eu tiver dúvida?**
R: Suporte via WhatsApp, email e central de ajuda com vídeos. Resposta em até 24h (geralmente mais rápido).

### Sobre Funcionalidades

**P: Posso gerenciar mais de uma igreja?**
R: Sim, no plano Premium. Troca entre igrejas com 1 clique.

**P: Funciona para igreja sem células?**
R: Funciona, mas é otimizado para modelo de células. Se sua igreja não tem células, talvez não seja ideal.

**P: Posso personalizar (cores, logo)?**
R: Ainda não, mas está no roadmap para 2026.

**P: Integra com meu sistema de dízimos/ofertas?**
R: Ainda não, mas podemos avaliar integração se houver demanda.

### Sobre Suporte e Roadmap

**P: Com que frequência lançam novidades?**
R: A cada 2-4 semanas. Roadmap público em ekkle.com.br/roadmap.

**P: Posso sugerir funcionalidades?**
R: Sim! Adoramos feedback. Votação de features em ekkle.com.br/sugestoes.

**P: E se der problema durante uma reunião?**
R: Suporte prioritário por WhatsApp. Mas o sistema funciona offline - dados sincronizam depois.

---

## 📞 CALL TO ACTION (Landing Page)

### Hero Section
```
🚀 Faça Suas Células Crescerem com Automação Inteligente

EKKLE é a plataforma completa para gestão de células.
Conecte seu WhatsApp, importe seus membros e economize 10h por semana.

[Começar Grátis →] [Ver Demo 2min ▶]

✅ Setup em 15 minutos
✅ WhatsApp automático
✅ Sem cartão de crédito
```

### Social Proof
```
⭐⭐⭐⭐⭐ "Desde que começamos a usar EKKLE, nossa presença nas células
aumentou 40% e conseguimos acompanhar cada membro de perto"
— Pastor João Silva, Igreja Batista Renovação (120 membros)
```

### Features (com ícones)
```
📱 WhatsApp Automático     →  Lembretes de reunião, follow-up, aniversários
📊 Dashboard Inteligente   →  Veja crescimento, alertas, células em risco
⚡ Setup Instantâneo       →  Import Excel, conecta WhatsApp, pronto!
🔒 Seguro e Confiável      →  Dados criptografados, backups diários
```

### Pricing
```
PLANO ESSENCIAL - R$ 49/mês
✓ Células ilimitadas
✓ Até 200 membros
✓ WhatsApp automático (email)
✓ Relatórios e analytics
[Testar 14 dias grátis]

PLANO PREMIUM - R$ 99/mês ⭐ Mais popular
✓ Tudo do Essencial
✓ Membros ilimitados
✓ WhatsApp + SMS
✓ Multi-igreja
✓ Suporte prioritário
[Testar 14 dias grátis]
```

### Final CTA
```
Junte-se a 50+ igrejas que já usam EKKLE

[Começar Agora - Grátis por 14 dias →]

Sem cartão de crédito • Cancele quando quiser • Suporte em português
```
