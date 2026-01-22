# WhatsApp AI Agent - Documentação Completa

## 📱 Visão Geral

O **WhatsApp AI Agent** é um assistente inteligente que permite aos pastores gerenciarem todo o sistema Ekkle através de mensagens naturais em português pelo WhatsApp.

### Características Principais

- ✅ **Conversação Natural**: Fale com o sistema como se fosse uma pessoa
- ✅ **Gestão Completa**: Acesso a todas as funcionalidades do sistema
- ✅ **Onboarding Automático**: Guia novos pastores pela configuração inicial
- ✅ **Confirmações de Segurança**: Ações críticas exigem confirmação explícita
- ✅ **Histórico Persistente**: Mantém contexto de conversas anteriores
- ✅ **Audit Trail**: Registra todas as ações para auditoria

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                        PASTOR                                │
│                          ↓ ↑                                 │
│                     (WhatsApp)                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   TWILIO    │
                    │  (Webhook)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                                     │
  ┌─────▼─────┐                      ┌───────▼────────┐
  │  Message  │                      │   OpenAI       │
  │ Processor │◄────────────────────►│   GPT-4o       │
  └─────┬─────┘                      └────────────────┘
        │
   ┌────┴────┐
   │Function │
   │Executor │
   └────┬────┘
        │
   ┌────┴──────────────┐
   │  Server Actions   │
   │  (CRUD, etc)      │
   └────┬──────────────┘
        │
   ┌────▼────┐
   │Supabase │
   │   DB    │
   └─────────┘
```

### Tecnologias Utilizadas

- **Twilio**: WhatsApp Business API para comunicação com pastores
- **OpenAI GPT-4o**: Inteligência conversacional
- **Supabase**: Banco de dados e armazenamento de conversas
- **Next.js**: Framework web (API routes + server actions)

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `whatsapp_agent_conversations`
Armazena histórico completo de conversas.

```sql
- id: UUID (PK)
- church_id: UUID (FK)
- pastor_id: UUID (FK)
- phone_number: TEXT
- status: ENUM('active', 'paused', 'archived')
- messages: JSONB (array de mensagens)
- current_intent: TEXT
- context_data: JSONB
- last_message_at: TIMESTAMPTZ
```

#### 2. `whatsapp_agent_onboarding`
Rastreia progresso de onboarding.

```sql
- id: UUID (PK)
- church_id: UUID (FK)
- pastor_id: UUID (FK)
- step_church_name_completed: BOOLEAN
- step_first_cell_completed: BOOLEAN
- step_initial_members_completed: BOOLEAN
- step_website_config_completed: BOOLEAN
- is_completed: BOOLEAN (computed)
- completed_at: TIMESTAMPTZ
```

#### 3. `whatsapp_agent_confirmations`
Armazena confirmações pendentes para ações críticas.

```sql
- id: UUID (PK)
- conversation_id: UUID (FK)
- pastor_id: UUID (FK)
- action_type: TEXT
- action_payload: JSONB
- confirmation_message: TEXT
- status: ENUM('pending', 'confirmed', 'rejected', 'expired')
- expires_at: TIMESTAMPTZ (5 minutos)
```

#### 4. `whatsapp_agent_audit_log`
Registro de auditoria de todas as ações.

```sql
- id: UUID (PK)
- church_id: UUID (FK)
- pastor_id: UUID (FK)
- conversation_id: UUID (FK, nullable)
- action_type: TEXT
- action_description: TEXT
- input_data: JSONB
- output_data: JSONB
- status: ENUM('success', 'error', 'pending')
- error_message: TEXT
- created_at: TIMESTAMPTZ
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env`:

```bash
# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=AC_your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_SECRET=your_webhook_secret

# OpenAI
OPENAI_API_KEY=sk-your_openai_key
OPENAI_MODEL=gpt-4o
```

### 2. Configurar Twilio

1. Criar conta em [twilio.com](https://www.twilio.com/console)
2. Ativar WhatsApp Business API
3. Configurar webhook:
   - URL: `https://seu-dominio.com/api/webhooks/twilio-whatsapp`
   - Método: POST
4. Para testes, usar Twilio Sandbox

### 3. Configurar OpenAI

1. Criar conta em [platform.openai.com](https://platform.openai.com)
2. Gerar API key
3. Configurar billing (modelo gpt-4o é pago)

### 4. Executar Migration

```bash
# Aplicar migration do Supabase
npx supabase migration up
```

## 💬 Funcionalidades Disponíveis

### 1. Gestão de Células

**Criar célula:**
```
Pastor: "Quero criar uma nova célula"
Agent: "Claro! Preciso de:
1. Nome da célula
2. Nome do líder
3. Email do líder"

Pastor: "Célula da Paz, líder João Silva, joao@email.com"
Agent: "✅ Célula 'Célula da Paz' criada com sucesso!"
```

**Listar células:**
```
Pastor: "Quais células tenho?"
Agent: "Você tem 5 células:
1. Célula da Paz (Líder: João Silva)
2. Célula Jovem (Líder: Maria Santos)
..."
```

**Deletar célula (ação crítica):**
```
Pastor: "Deletar célula Célula da Paz"
Agent: "⚠️ ATENÇÃO: Você está prestes a deletar a célula 'Célula da Paz'.
Esta ação NÃO PODE ser desfeita.

Digite SIM para confirmar ou NÃO para cancelar."

Pastor: "SIM"
Agent: "✅ Célula deletada com sucesso."
```

### 2. Gestão de Membros

**Adicionar membro:**
```
Pastor: "Adicionar membro Carlos Lima, telefone (11) 99999-9999, célula da Paz, visitante"
Agent: "✅ Membro 'Carlos Lima' adicionado com sucesso!"
```

**Listar membros:**
```
Pastor: "Quantos membros tenho?"
Agent: "Você tem 47 membros cadastrados!"
```

**Buscar membro:**
```
Pastor: "Buscar membro João"
Agent: "Encontrei 3 membros com 'João' no nome:
1. João Silva (Célula da Paz)
2. João Pedro (Célula Jovem)
..."
```

### 3. Gestão de Cultos

**Criar culto:**
```
Pastor: "Criar culto de domingo"
Agent: "Qual data, horário e tipo (PRESENCIAL/ONLINE/HIBRIDO)?"

Pastor: "2026-01-25, 10:00, PRESENCIAL"
Agent: "✅ Culto criado para 25/01/2026 às 10:00!"
```

**Ver agenda:**
```
Pastor: "Quais cultos tenho agendados?"
Agent: "Próximos cultos:
📅 25/01 - 10:00 - Culto de Domingo (Presencial)
📅 28/01 - 19:30 - Culto de Oração (Online)
..."
```

### 4. Enviar Mensagens em Massa

**Enviar para todos os membros:**
```
Pastor: "Avisar todos os membros sobre o culto de domingo"
Agent: "Qual mensagem deseja enviar?

💡 Use {{nome}} para personalizar"

Pastor: "Olá {{nome}}! Lembrete: culto domingo às 10h. Não falte!"
Agent: "✅ Mensagem enviada para 47 pessoas!"
```

**Enviar segmentado:**
```
Pastor: "Enviar mensagem apenas para visitantes"
Agent: "Qual mensagem?"

Pastor: "Olá! Seja bem-vindo à nossa igreja!"
Agent: "✅ Mensagem enviada para 12 visitantes!"
```

### 5. Informações da Igreja

**Ver configurações:**
```
Pastor: "Qual o nome da minha igreja?"
Agent: "Nome: Igreja Batista Central
Slug: igreja-batista-central
Site: https://igreja-batista-central.ekkle.com.br"
```

**Atualizar configurações:**
```
Pastor: "Mudar nome da igreja para Igreja da Paz"
Agent: "✅ Nome da igreja atualizado!"
```

### 6. Finanças (Somente PASTOR)

**Ver resumo:**
```
Pastor: "Quanto arrecadamos este mês?"
Agent: "💰 Resumo Financeiro - Janeiro 2026

Receitas: R$ 12.450,00
Despesas: R$ 8.320,00
━━━━━━━━━━━━━━━
Saldo: R$ 4.130,00"
```

## 🎯 Fluxo de Onboarding

O agente guia automaticamente novos pastores através de 4 passos essenciais:

### Passo 1: Nome da Igreja
```
Agent: "🎉 Bem-vindo ao Ekkle!

Passo 1 de 4: Nome da Igreja

Qual é o nome da sua igreja?"
```

### Passo 2: Primeira Célula
```
Agent: "✅ Nome da igreja configurado!

Passo 2 de 4: Primeira Célula

Para criar sua primeira célula, preciso de:
• Nome da célula
• Nome do líder
• Email do líder"
```

### Passo 3: Membros Iniciais
```
Agent: "✅ Primeira célula criada!

Passo 3 de 4: Membros Iniciais

Vamos adicionar pelo menos 3 membros.
Qual o primeiro membro?"
```

### Passo 4: Site Público
```
Agent: "✅ Membros adicionados!

Passo 4 de 4: Site Público

Qual slug você quer usar?
Seu site ficará: https://[slug].ekkle.com.br"
```

### Conclusão
```
Agent: "🎊 Parabéns! Onboarding completo!

Agora você pode usar todas as funcionalidades do Ekkle!

Como posso ajudar hoje?"
```

## 🔒 Segurança

### Validação de Assinatura Twilio

Todas as requisições do Twilio são validadas através de assinatura HMAC SHA1:

```typescript
TwilioService.validateWebhookSignature(signature, url, params)
```

### Confirmações para Ações Críticas

Ações que requerem "Digite SIM para confirmar":

- Deletar célula
- Deletar membro
- Deletar culto/evento
- Processar pagamentos
- Deletar produtos

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS que garantem:
- Pastores só acessam dados da própria igreja
- Isolamento completo entre igrejas
- Auditoria por church_id

### Rate Limiting

- Máximo de 10 mensagens por minuto por pastor
- Confirmações expiram em 5 minutos
- Proteção contra spam e abuso

## 📁 Estrutura de Arquivos

```
/src
  /lib
    /ai-agent
      - system-prompt.ts         # Personalidade e instruções do agente
      - function-definitions.ts  # Mapeamento de funções OpenAI
      - function-executor.ts     # Execução das funções
      - message-processor.ts     # Orquestrador principal
      - onboarding.ts            # Sistema de onboarding
    - twilio.ts                  # Integração Twilio
    - openai.ts                  # Integração OpenAI

  /app/api/webhooks
    /twilio-whatsapp
      - route.ts                 # Webhook endpoint

  /actions
    - whatsapp-agent.ts          # Server actions do agente
    - cells.ts                   # Helpers adicionados
    - members.ts                 # Helpers adicionados

/supabase/migrations
  - 20260122_whatsapp_ai_agent.sql  # Migration do banco
```

## 🧪 Testes

### Testar com Twilio Sandbox

1. Acesse [Twilio Console](https://www.twilio.com/console/sms/whatsapp/learn)
2. Entre no sandbox enviando código para +1 (415) 523-8886
3. Envie mensagem de teste
4. Verifique logs em `/api/webhooks/twilio-whatsapp`

### Testar Localmente

```bash
# 1. Instalar ngrok para expor localhost
npm install -g ngrok

# 2. Rodar aplicação
npm run dev

# 3. Expor porta 3000
ngrok http 3000

# 4. Configurar webhook Twilio com URL do ngrok
https://your-ngrok-url.ngrok.io/api/webhooks/twilio-whatsapp
```

## 📊 Monitoramento

### Verificar Conversas

```typescript
import { getConversationHistory } from '@/actions/whatsapp-agent'

const { data } = await getConversationHistory()
console.log(data.messages)
```

### Verificar Audit Log

```typescript
import { getAgentAuditLog } from '@/actions/whatsapp-agent'

const { data } = await getAgentAuditLog(100)
console.log(data) // Últimas 100 ações
```

### Estatísticas

```typescript
import { getAgentStatistics } from '@/actions/whatsapp-agent'

const { data } = await getAgentStatistics()
/*
{
  totalMessages: 342,
  totalActions: 87,
  successfulActions: 85,
  failedActions: 2,
  onboardingCompleted: true
}
*/
```

## 🚀 Deployment

### Railway

1. Adicionar variáveis de ambiente no Railway Dashboard
2. Deploy automático via Git
3. Configurar webhook Twilio com URL do Railway

### Vercel

```bash
# 1. Deploy
vercel --prod

# 2. Configurar env vars
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add OPENAI_API_KEY

# 3. Redeploy
vercel --prod
```

## 💡 Boas Práticas

### Para Pastores

1. **Seja específico**: "Criar célula Célula da Paz com João Silva" é melhor que "criar célula"
2. **Use linguagem natural**: O agente entende português coloquial
3. **Confirme ações críticas**: Sempre leia a confirmação antes de digitar SIM
4. **Aproveite placeholders**: Use `{{nome}}` em mensagens em massa

### Para Desenvolvedores

1. **Sempre validar entrada**: Use Zod schemas
2. **Tratar erros gracefully**: Mensagens de erro amigáveis
3. **Log extensivo**: Console.log para debugging
4. **Testar function calling**: Garantir que funções são chamadas corretamente
5. **Monitorar custos**: OpenAI pode ficar caro em produção

## 🐛 Troubleshooting

### Agente não responde

1. Verificar variáveis de ambiente
2. Verificar logs em `/api/webhooks/twilio-whatsapp`
3. Validar assinatura Twilio
4. Verificar se pastor está cadastrado com telefone correto

### Função não é executada

1. Verificar se função está em `function-definitions.ts`
2. Verificar se `function-executor.ts` tem o handler
3. Ver logs do OpenAI (pode estar chamando função errada)

### Erro de permissão

1. Verificar RLS policies
2. Verificar role do pastor (deve ser PASTOR)
3. Verificar church_id matching

## 📞 Suporte

- **Documentação**: Este arquivo
- **Issues**: [GitHub Issues](https://github.com/seu-repo/issues)
- **Email**: suporte@ekkle.com.br

## 📝 Changelog

### v1.0.0 (2026-01-22)
- ✅ Implementação inicial
- ✅ 25+ funções disponíveis
- ✅ Onboarding automático
- ✅ Confirmações de segurança
- ✅ Audit trail completo

---

**Desenvolvido com ❤️ para Ekkle**
