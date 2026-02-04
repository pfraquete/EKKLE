# Guia de Configuração: Live Streaming pelo Navegador

Este guia explica como configurar a funcionalidade de transmissão ao vivo diretamente pelo navegador no sistema EKKLE.

## Visão Geral

O EKKLE permite que o pastor transmita ao vivo diretamente do navegador, sem precisar de programas externos como OBS. A arquitetura utiliza:

- **LiveKit**: Captura o vídeo/áudio do navegador via WebRTC
- **Mux**: Processa e distribui o vídeo para os espectadores

## Pré-requisitos

1. Conta no [LiveKit Cloud](https://cloud.livekit.io) (gratuito para começar)
2. Conta no [Mux](https://dashboard.mux.com) (gratuito para começar)

## Passo 1: Configurar LiveKit

1. Acesse [cloud.livekit.io](https://cloud.livekit.io)
2. Crie um novo projeto (ou use um existente)
3. Vá em **Settings** > **API Keys**
4. Copie os seguintes valores:
   - **URL** (ex: `wss://seu-projeto.livekit.cloud`)
   - **API Key** (ex: `APICxxxxxx`)
   - **API Secret** (ex: `vaPTOeoz...`)

## Passo 2: Configurar Mux

1. Acesse [dashboard.mux.com](https://dashboard.mux.com)
2. Vá em **Settings** > **API Access Tokens**
3. Clique em **Generate new token**
4. Selecione as permissões:
   - ✅ Mux Video (Full Access)
   - ✅ Mux Data (Read)
5. Copie os valores:
   - **Token ID** (ex: `2f9c9630-12d2-45e5-...`)
   - **Token Secret** (ex: `Odv3Bdy2j0wEKe3...`)

## Passo 3: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env` (ou nas variáveis de ambiente do Railway/Vercel):

```env
# LiveKit Configuration
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=APICxxxxxx
LIVEKIT_API_SECRET=vaPTOeoz...

# Mux Configuration
MUX_TOKEN_ID=2f9c9630-12d2-45e5-...
MUX_TOKEN_SECRET=Odv3Bdy2j0wEKe3...
```

## Passo 4: Testar a Configuração

1. Faça login como **Pastor** no sistema
2. Vá em **Dashboard** > **Lives** > **Nova Live**
3. Selecione:
   - **Provedor**: Mux
   - **Tipo de Transmissão**: Navegador
4. Crie a live
5. Na página da live, clique em **Transmitir pelo Navegador**
6. Permita o acesso à câmera/microfone
7. Clique em **Iniciar Transmissão**

## Como Funciona

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Navegador     │────▶│    LiveKit      │────▶│      Mux        │
│   do Pastor     │     │   (WebRTC)      │     │   (CDN/HLS)     │
│   (Câmera)      │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Espectadores  │
                                               │   (Membros)     │
                                               └─────────────────┘
```

1. O pastor abre a página de transmissão no navegador
2. O navegador captura câmera/tela via WebRTC
3. O vídeo é enviado para o LiveKit (servidor WebRTC)
4. O LiveKit converte para RTMP e envia para o Mux
5. O Mux processa e distribui via CDN para os espectadores

## Custos Estimados

### LiveKit Cloud
- **Gratuito**: 10.000 minutos de participante/mês
- **Ship ($50/mês)**: 150.000 minutos/mês
- **Scale ($500/mês)**: 1.5M minutos/mês

### Mux
- **Gratuito**: 100.000 minutos de entrega/mês
- **Pay-as-you-go**: ~$0.02/minuto de live streaming

### Exemplo de Custo
Uma live de 1 hora com 100 espectadores:
- LiveKit: ~60 minutos de participante (pastor)
- Mux: ~6.000 minutos de entrega (100 espectadores × 60 min)
- **Custo estimado**: ~$3-5 (dentro do tier gratuito inicial)

## Solução de Problemas

### "LiveKit não configurado"
Verifique se as variáveis `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` estão corretas.

### "Credenciais do Mux não configuradas"
Verifique se as variáveis `MUX_TOKEN_ID` e `MUX_TOKEN_SECRET` estão corretas.

### "Erro ao criar sala no LiveKit"
- Verifique se a URL do LiveKit está no formato correto (`wss://...`)
- Confirme que o API Key e Secret são do mesmo projeto

### "Erro ao iniciar transmissão"
- Certifique-se de que há vídeo sendo transmitido (câmera ligada)
- Verifique se o navegador tem permissão para acessar câmera/microfone

## Suporte

Para mais informações:
- [Documentação do LiveKit](https://docs.livekit.io)
- [Documentação do Mux](https://docs.mux.com)
