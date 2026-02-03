# Auditoria Tecnica - EKKLE

**Data:** 03 de Fevereiro de 2026
**Escopo:** seguranca, performance, arquitetura e debito tecnico

## Resumo executivo

- **Status geral:** precisa de correcoes antes de producao (riscos em dependencias e debito tecnico relevante).
- **Pontos positivos:** headers de seguranca configurados, sanitizacao aplicada em PDF/branding/email, estrutura de rotas bem definida.
- **Pontos criticos atuais:** vulnerabilidades em dependencias (xlsx/face-api.js), erros de typecheck, build falhando por env vars ausentes.

## Achados principais (P0-P3)

### P1 - Vulnerabilidades ativas em dependencias
1) **xlsx (Prototype Pollution + ReDoS)**
   - **Origem:** `npm audit` (sem fix disponivel).
   - **Impacto:** upload de planilhas pode abrir vetor de ataque e travamentos por RegExp.
   - **Onde:** `src/components/import/import-page.tsx` (uso direto do `xlsx`).
   - **Recomendacao:** substituir `xlsx` por biblioteca alternativa (ex.: `sheetjs` com fix, ou importacao via backend com sanitizacao/parse seguro). Se mantiver, isolar parsing em worker e validar tamanho/estrutura do arquivo.

2) **node-fetch via face-api.js**
   - **Origem:** `npm audit` (GHSA-r683-j2x4-v87g, GHSA-w7rc-rwvf-8q5r).
   - **Impacto:** propagacao de headers sensiveis e controle de tamanho apos redirect.
   - **Onde:** `src/lib/face-recognition/index.ts`, `src/hooks/use-face-recognition.ts`.
   - **Recomendacao:** avaliar upgrade do `face-api.js` e/ou isolar uso apenas no client (sem SSR). Se ficar, bloquear uso em server e revisar onde a lib e carregada.

### P2 - Typecheck falhando
- **Descricao:** erros TS em `src/actions/cell.ts` com tipagens inconsistentes.
- **Impacto:** quebra de build em ambientes com `next build` + typecheck.
- **Evidencia:** `tsc_errors.txt`.
- **Recomendacao:** corrigir tipagem dos joins e alinhar `CellMeetingRow` com o retorno real do Supabase.

### P2 - Build falha por env vars ausentes
- **Descricao:** `next build` falha ao coletar data de `/reset-password` quando `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_APP_URL` nao estao definidos.
- **Impacto:** bloqueia deploys (principalmente CI).
- **Evidencia:** `build_error_full.txt`.
- **Recomendacao:** tornar a validacao lazy (apenas no runtime), ou mockar valores no build de CI. Garantir `.env.local` em ambientes de build.

### P3 - Logs em producao
- **Descricao:** 99 ocorrencias de `console.log` no repo.
- **Impacto:** ruido em logs e risco de vazamento de informacoes sensiveis.
- **Recomendacao:** substituir por logger com niveis e remover logs nao essenciais.

## Observacoes positivas (correcoes ja feitas)
- **PDF export**: `src/lib/export-pdf.ts` agora sanitiza HTML via `escapeHtml`.
- **Branding**: `src/lib/branding.ts` valida cores e fontes com whitelist.
- **Email templates**: `src/lib/email.ts` sanitiza entradas.
- **Headers de seguranca**: `next.config.ts` inclui CSP, HSTS, XFO, etc.

## Quick wins (curto prazo)
1) Trocar `xlsx` por alternativa segura ou isolar parsing em backend/worker.
2) Corrigir tipagens em `src/actions/cell.ts` para destravar builds.
3) Definir variaveis de ambiente no pipeline de build e documentar.
4) Remover `console.log` ou migrar para logger com nivel (debug/info).

## Itens estruturais (medio prazo)
1) Revisar dependencias defasadas (ex.: `@supabase/*`, `framer-motion`, `react` e `tailwind`).
2) Criar suite minima de testes (auth, pagamentos, actions criticas).
3) Padronizar schema de retorno de actions e typeguards para Supabase.

## Anexos
- `AUDITORIA-PRE-PRODUCAO.md`
- `ANALISE_SEGURANCA.md`
- `tsc_errors.txt`
- `build_error_full.txt`
