# Auditoria de Live Streaming - EKKLE

## Análise da Arquitetura Atual

### 1. Estrutura de Arquivos Identificada

#### Actions (Server Actions)
- `src/actions/live-streams.ts` - CRUD de lives, chat, viewers
- `src/actions/livekit.ts` - Integração LiveKit para broadcast pelo navegador
- `src/actions/course-live-lessons.ts` - Lives para cursos (professores)

#### Componentes
- `src/components/live/live-player.tsx` - Player de vídeo (Mux, YouTube, Custom)
- `src/components/live/live-chat.tsx` - Chat em tempo real
- `src/components/live/live-stream-controls.tsx` - Controles básicos
- `src/components/live/new-live-stream-form.tsx` - Formulário de criação
- `src/components/live/browser-broadcast-manager.tsx` - Gerenciador de broadcast
- `src/components/live/web-broadcaster.tsx` - **COMPONENTE PRINCIPAL** de transmissão pelo navegador

#### Biblioteca
- `src/lib/livekit.ts` - SDK LiveKit (tokens, rooms, egress RTMP)

#### Páginas
- `/dashboard/lives` - Listagem de lives
- `/dashboard/lives/novo` - Criar nova live
- `/dashboard/lives/[id]` - Detalhes e transmissão

### 2. Provedores de Streaming Suportados

| Provedor | Tipo | Status | Descrição |
|----------|------|--------|-----------|
| **MUX** | RTMP/Browser | ✅ Implementado | Streaming profissional via OBS ou navegador |
| **YouTube** | Embed | ✅ Implementado | Incorpora lives do YouTube |
| **Custom** | Embed/HLS | ✅ Implementado | Links externos ou HLS |

### 3. Modos de Transmissão MUX

| Modo | Status | Descrição |
|------|--------|-----------|
| **RTMP** | ✅ Funcional | Requer OBS Studio ou software externo |
| **Browser** | ⚠️ Parcialmente | Usa LiveKit + Mux (requer configuração) |

---

## Análise do Modo "Browser" (Transmissão pelo Navegador)

### Fluxo Atual Implementado

```
[Pastor no Navegador]
       ↓
[WebBroadcaster] → Captura câmera/tela via WebRTC
       ↓
[LiveKit Room] → Sala de streaming WebRTC
       ↓
[LiveKit Egress] → Converte WebRTC para RTMP
       ↓
[Mux Live Stream] → Distribui via HLS para espectadores
       ↓
[MuxPlayer] → Reproduz no navegador dos membros
```

### Componentes Chave

1. **WebBroadcaster** (`web-broadcaster.tsx`)
   - Captura câmera/tela do pastor
   - Conecta ao LiveKit via WebSocket
   - Publica tracks de áudio/vídeo
   - Permite alternar entre câmera e compartilhamento de tela
   - Controles de mute/unmute

2. **LiveKit Integration** (`lib/livekit.ts`)
   - Gera tokens JWT para autenticação
   - Cria/deleta rooms
   - Inicia egress RTMP para Mux

3. **BrowserBroadcastManager** (`browser-broadcast-manager.tsx`)
   - Orquestra o fluxo completo
   - Obtém token do LiveKit
   - Gerencia estados (preview, live, ended)

---

## GAPS E LIMITAÇÕES IDENTIFICADOS

### 1. Variáveis de Ambiente Faltantes no .env.example

**CRÍTICO**: As variáveis do LiveKit e Mux NÃO estão documentadas no `.env.example`:

```env
# FALTANDO - LiveKit
LIVEKIT_URL=wss://your-app.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# FALTANDO - Mux
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret
```

### 2. Dependência de Serviços Externos Pagos

| Serviço | Custo | Necessidade |
|---------|-------|-------------|
| **LiveKit Cloud** | ~$50/mês base | Obrigatório para browser broadcast |
| **Mux** | ~$0.025/min streaming | Obrigatório para distribuição |

### 3. Complexidade da Arquitetura

O fluxo atual é:
```
Câmera → LiveKit → Egress RTMP → Mux → HLS → Espectadores
```

**Problema**: Latência alta (10-30 segundos) devido à conversão WebRTC → RTMP → HLS

### 4. Falta de Fallback

Se LiveKit não estiver configurado, o modo browser simplesmente não funciona, sem alternativa.

### 5. UX Incompleta

- Não há indicador de qualidade de conexão em tempo real
- Não há preview do que os espectadores veem antes de ir ao vivo
- Não há gravação automática local como backup

---

## PONTOS POSITIVOS

1. ✅ Arquitetura bem estruturada e modular
2. ✅ Suporte a múltiplos provedores
3. ✅ Chat em tempo real com Supabase Realtime
4. ✅ Controle de viewers e estatísticas
5. ✅ Permissões por role (apenas PASTOR pode transmitir)
6. ✅ Suporte a lives públicas (sem login)
7. ✅ Componente WebBroadcaster completo com:
   - Seleção de dispositivos
   - Toggle câmera/tela
   - Indicadores de status
   - Preview antes de ir ao vivo

---

## CONCLUSÃO PARCIAL

A funcionalidade de **transmissão pelo navegador JÁ ESTÁ IMPLEMENTADA** no código, mas:

1. **Requer configuração** de LiveKit e Mux (variáveis de ambiente)
2. **Tem custo mensal** dos serviços cloud
3. **Documentação incompleta** no .env.example

O código está pronto, mas precisa de:
- Documentação das variáveis de ambiente
- Configuração dos serviços externos
- Possível otimização para reduzir latência
