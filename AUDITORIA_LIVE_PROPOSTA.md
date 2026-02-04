# Auditoria e Proposta Técnica: Live Streaming no EKKLE

**Autor**: Manus AI
**Data**: 04 de fevereiro de 2026
**Status**: Concluído

## 1. Resumo Executivo

Este documento apresenta uma auditoria completa da funcionalidade de transmissão ao vivo (live streaming) no sistema EKKLE. A análise do código-fonte revelou que a capacidade para um pastor transmitir diretamente pelo navegador **já está implementada**, utilizando uma arquitetura robusta que integra as tecnologias **LiveKit** e **Mux**. 

A funcionalidade não está operacional "de fábrica" devido à necessidade de configuração de chaves de API e à dependência de serviços externos pagos. A latência da transmissão é um ponto de atenção, estimada entre 15 a 30 segundos devido à conversão de protocolos.

Este relatório detalha a arquitetura existente, identifica as lacunas que impedem seu funcionamento imediato e apresenta três propostas técnicas para ativar e otimizar o recurso, com diferentes balanços entre custo, complexidade e latência.

## 2. Análise da Arquitetura de Live Streaming Atual

Após uma investigação detalhada no repositório `pfraquete/ekkle`, foi mapeada a seguinte arquitetura para a funcionalidade de transmissão pelo navegador:

> **Fluxo de Transmissão**: O pastor inicia a transmissão em seu navegador, que captura a câmera/tela via WebRTC. O sinal é enviado para uma sala no **LiveKit**, um servidor de mídia WebRTC. O LiveKit então retransmite esse sinal em formato RTMP (Real-Time Messaging Protocol) para a plataforma **Mux**, que por sua vez processa, grava e distribui o vídeo em formato HLS (HTTP Live Streaming) para os espectadores em escala.

Este fluxo é orquestrado por um conjunto de componentes e serviços bem definidos no código:

| Componente/Arquivo | Responsabilidade |
| :--- | :--- |
| `src/components/live/web-broadcaster.tsx` | **Interface do Pastor**: Captura a câmera/tela, gerencia dispositivos e se conecta ao LiveKit. |
| `src/lib/livekit.ts` | **SDK do Servidor LiveKit**: Gerencia a criação de salas, geração de tokens de acesso e o processo de *egress* (saída) para o Mux. |
| `src/actions/live-streams.ts` | **Lógica de Negócio**: Gerencia o ciclo de vida das lives (criar, iniciar, parar) e o chat no banco de dados Supabase. |
| `src/components/live/live-player.tsx` | **Interface do Espectador**: Player de vídeo que exibe a transmissão recebida do Mux. |
| `supabase/migrations/...` | **Banco de Dados**: Esquema que armazena informações das lives, incluindo chaves do Mux e salas do LiveKit. |

## 3. Diagnóstico: Gaps e Limitações

A auditoria identificou os seguintes pontos que impedem a funcionalidade de ser utilizada imediatamente:

1.  **Configuração de Ambiente Incompleta**: O arquivo de exemplo `.env.example` não inclui as variáveis de ambiente necessárias para os serviços Mux e LiveKit. Sem essas chaves, o sistema não consegue se autenticar e a funcionalidade falha silenciosamente.

2.  **Dependência de Serviços Externos Pagos**: A solução depende de duas plataformas de terceiros:
    *   **LiveKit Cloud**: Para a infraestrutura WebRTC (ingestão do vídeo do navegador). O plano gratuito oferece 10.000 minutos de participante por mês, com planos pagos a partir de $50/mês [1].
    *   **Mux**: Para processamento e distribuição do vídeo em escala (transcoding e CDN). Oferece um crédito inicial, com cobrança por uso a partir de ~$0.02/minuto para live [2].

3.  **Latência da Transmissão**: A arquitetura atual (`WebRTC -> RTMP -> HLS`) introduz uma latência (atraso) significativa, estimada entre 15 e 30 segundos. Isso ocorre porque o sinal passa por múltiplas conversões de protocolo. Embora aceitável para cultos, pode não ser ideal para eventos que exigem maior interatividade.

4.  **Complexidade de Setup**: Para um usuário não técnico, o processo de criar contas no Mux e LiveKit, obter as chaves de API e configurar as variáveis de ambiente é uma barreira considerável.

## 4. Propostas Técnicas

A seguir, são apresentadas três soluções para tornar a funcionalidade de transmissão pelo navegador plenamente operacional.

### Proposta 1: Ativar a Arquitetura Existente (Recomendado)

Esta proposta foca em ativar a solução já implementada, que é robusta e escalável, ideal para a maioria dos casos de uso da igreja.

*   **Descrição**: Manter a arquitetura `LiveKit + Mux`. O foco será em documentar e facilitar o processo de configuração.
*   **Ações Requeridas**:
    1.  **Atualizar o arquivo `.env.example`**: Adicionar as variáveis `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `MUX_TOKEN_ID` e `MUX_TOKEN_SECRET` com instruções claras.
    2.  **Criar um Guia de Configuração**: Elaborar um documento `SETUP_LIVE.md` com o passo a passo para criar contas no LiveKit Cloud e Mux, obter as chaves e configurar o sistema.
    3.  **Implementar Verificações no Painel**: Adicionar uma seção no painel de administração que verifique se as chaves de API estão configuradas e exiba um alerta caso contrário, guiando o usuário para o setup.
*   **Vantagens**: Aproveita o código existente, solução escalável e confiável, menor esforço de desenvolvimento.
*   **Desvantagens**: Mantém o custo operacional dos serviços e a latência de 15-30 segundos.

### Proposta 2: Simplificar com Mux Spaces (Custo-Benefício)

O Mux oferece um produto chamado "Spaces" (agora descontinuado e migrado para o LiveKit [3], mas a lógica de usar um único provedor é válida) que lida tanto com a ingestão WebRTC quanto com a distribuição, simplificando a arquitetura.

*   **Descrição**: Remover a dependência do LiveKit e utilizar apenas o Mux para todo o fluxo de vídeo. O pastor transmitiria via WebRTC diretamente para o Mux, que distribuiria o conteúdo.
*   **Ações Requeridas**:
    1.  Refatorar `src/actions/livekit.ts` e `src/lib/livekit.ts` para usar a API do Mux para criar "Real-Time Streams".
    2.  Adaptar o `web-broadcaster.tsx` para se conectar diretamente ao endpoint WebRTC do Mux em vez do LiveKit.
    3.  Simplificar o formulário de criação de live, removendo a lógica de múltiplos provedores para o modo "browser".
*   **Vantagens**: Reduz a complexidade para um único provedor, potencialmente menor custo e mais fácil de gerenciar.
*   **Desvantagens**: Requer um esforço de desenvolvimento significativo para refatorar a integração. A latência pode permanecer similar.

### Proposta 3: Solução Open Source com Jitsi (Baixo Custo, Alta Complexidade)

Para controle total e custo mínimo, é possível substituir os serviços pagos por uma solução auto-hospedada como o Jitsi.

*   **Descrição**: Substituir LiveKit e Mux por uma instância auto-hospedada do Jitsi. O Jitsi pode gerenciar a conferência WebRTC e possui uma funcionalidade de live streaming (via Jibri) que pode enviar um sinal RTMP para plataformas gratuitas como YouTube ou Twitch.
*   **Ações Requeridas**:
    1.  **Provisionar Servidor**: Configurar um servidor dedicado para hospedar o Jitsi e o Jibri.
    2.  **Desenvolver Integração**: Criar uma nova camada de serviço para interagir com a API do Jitsi, gerenciando a criação de salas e o início/fim da transmissão.
    3.  **Refatorar Componentes**: Modificar `web-broadcaster.tsx` para usar a biblioteca do Jitsi.
*   **Vantagens**: Custo de software zero, controle total sobre a infraestrutura e dados.
*   **Desvantagens**: **Altamente complexo** de implementar e manter. Exige conhecimento avançado em administração de sistemas e infraestrutura de vídeo. A confiabilidade e escalabilidade dependerão da qualidade do servidor provisionado.

## 5. Conclusão e Recomendação

A funcionalidade de transmissão ao vivo pelo navegador **é um recurso já presente e bem arquitetado no sistema EKKLE**. A principal barreira para seu uso é a falta de configuração e documentação clara sobre as dependências de serviços externos (LiveKit e Mux).

**Recomenda-se a implementação da Proposta 1**, por ser a mais rápida, segura e que aproveita todo o desenvolvimento já realizado. As ações se concentram em melhorar a experiência de configuração para o administrador do sistema, garantindo que ele possa ativar a funcionalidade com um guia claro e alertas no painel.

As propostas 2 e 3 são alternativas viáveis, mas representam um esforço de desenvolvimento e manutenção consideravelmente maior, sendo mais indicadas para uma futura fase do projeto, caso os custos ou a latência da solução atual se tornem um problema crítico.

---

### Referências

[1] LiveKit. "Pricing". Acessado em 04 de fevereiro de 2026. [https://livekit.io/pricing](https://livekit.io/pricing)

[2] Mux. "Pricing". Acessado em 04 de fevereiro de 2026. [https://www.mux.com/pricing](https://www.mux.com/pricing)

[3] Mux. "Migrate to LiveKit Web SDK". Acessado em 04 de fevereiro de 2026. [https://www.mux.com/docs/guides/spaces-to-livekit](https://www.mux.com/docs/guides/spaces-to-livekit)
