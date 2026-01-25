# Análise de Segurança: Sentry e Sanitização

## Resumo Executivo

Este documento apresenta uma análise detalhada sobre as ferramentas de segurança implementadas no projeto EKKLE, focando em **Sentry** para error tracking e **isomorphic-dompurify** para sanitização de dados.

---

## 1. Sentry - Error Tracking e Monitoramento

### O que é o Sentry?

O **Sentry** é uma plataforma de monitoramento de erros e performance que captura exceções, erros e eventos em tempo real, fornecendo contexto detalhado para debugging e análise de problemas em produção.

### Benefícios do Sentry

#### ✅ Vantagens

1. **Visibilidade em Tempo Real**
   - Captura automática de erros não tratados no frontend e backend
   - Notificações instantâneas quando erros críticos ocorrem
   - Stack traces completos com contexto do usuário

2. **Debugging Aprimorado**
   - Breadcrumbs (rastro de ações do usuário antes do erro)
   - Informações de ambiente (browser, OS, versão da aplicação)
   - Source maps para código minificado em produção

3. **Performance Monitoring**
   - Rastreamento de transações e queries lentas
   - Identificação de gargalos de performance
   - Métricas de Web Vitals (LCP, FID, CLS)

4. **Gestão de Releases**
   - Rastreamento de erros por versão/release
   - Comparação de estabilidade entre releases
   - Rollback informado baseado em dados

5. **Integração com Workflow**
   - Integração com GitHub, Slack, Jira
   - Criação automática de issues
   - Alertas customizáveis por severidade

#### ⚠️ Considerações

1. **Custo**
   - Plano gratuito: 5.000 eventos/mês
   - Pode ser caro em aplicações de alto tráfego
   - Necessário configurar rate limiting e filtros

2. **Privacidade e LGPD**
   - Pode capturar dados sensíveis inadvertidamente
   - Necessário configurar scrubbing de PII (Personally Identifiable Information)
   - Dados enviados para servidores externos (Sentry SaaS)

3. **Overhead de Performance**
   - Adiciona pequeno overhead no bundle size (~30-50KB)
   - Pode impactar performance se não configurado corretamente
   - Necessário configurar sample rates para ambientes de alto tráfego

### Recomendação para EKKLE

**✅ RECOMENDO IMPLEMENTAR** com as seguintes configurações:

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% das transações (ajustar conforme tráfego)
  
  // Error Tracking
  sampleRate: 1.0, // 100% dos erros
  
  // Privacidade - Remover dados sensíveis
  beforeSend(event, hint) {
    // Remover cookies e headers sensíveis
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    
    // Não enviar erros de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    return event;
  },
  
  // Ignorar erros conhecidos/não críticos
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Configurar releases para tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
});
```

**Configurações de Privacidade LGPD:**

```typescript
// Adicionar ao sentry.server.config.ts
Sentry.init({
  // ... outras configs
  
  beforeSend(event) {
    // Scrubbing de dados sensíveis
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // Remover query params sensíveis
    if (event.request?.query_string) {
      const sensitiveParams = ['token', 'password', 'api_key'];
      sensitiveParams.forEach(param => {
        event.request.query_string = event.request.query_string?.replace(
          new RegExp(`${param}=[^&]*`, 'gi'),
          `${param}=[REDACTED]`
        );
      });
    }
    
    return event;
  },
});
```

---

## 2. Sanitização com isomorphic-dompurify

### O que é isomorphic-dompurify?

O **isomorphic-dompurify** é uma biblioteca de sanitização de HTML que funciona tanto no browser quanto no servidor (Node.js), removendo código malicioso de strings HTML para prevenir ataques XSS (Cross-Site Scripting).

### Benefícios da Sanitização

#### ✅ Vantagens

1. **Prevenção de XSS**
   - Remove scripts maliciosos de input do usuário
   - Protege contra injeção de HTML/JavaScript
   - Essencial para campos de texto rico (rich text editors)

2. **Isomórfico**
   - Funciona no cliente e servidor
   - Consistência na sanitização em SSR e CSR
   - Ideal para Next.js

3. **Configurável**
   - Whitelist de tags e atributos permitidos
   - Hooks para customização
   - Suporte a diferentes contextos (HTML, SVG, MathML)

4. **Performance**
   - Baseado em DOMPurify (padrão da indústria)
   - Otimizado para performance
   - Baixo overhead

#### ⚠️ Considerações

1. **Quando Usar**
   - **Necessário**: Quando renderizar HTML de usuários (comentários, posts, descrições)
   - **Opcional**: Para dados estruturados (JSON) sem renderização HTML
   - **Desnecessário**: Para dados já validados no backend com schema strict

2. **Não é Bala de Prata**
   - Não substitui validação de input no backend
   - Não protege contra SQL Injection (usar ORM/prepared statements)
   - Não protege contra CSRF (usar tokens CSRF)

### Análise do Código EKKLE

Analisando o projeto EKKLE, identifiquei os seguintes pontos onde sanitização é relevante:

#### Campos que PRECISAM de Sanitização:

1. **Descrições de Eventos** (`events.description`)
2. **Descrições de Cursos** (`courses.description`)
3. **Descrições de Produtos** (`products.description`)
4. **Descrições de Células** (`cells.description`)
5. **Comentários de Cursos** (`course_comments.content`)
6. **Conteúdo de Posts/Anúncios** (se houver)

#### Campos que NÃO PRECISAM de Sanitização:

1. **Emails, telefones, CPF** (validar formato, não sanitizar HTML)
2. **Datas, números, booleanos** (validar tipo)
3. **IDs, UUIDs** (validar formato UUID)
4. **URLs** (validar formato URL, mas não sanitizar como HTML)

### Recomendação para EKKLE

**✅ RECOMENDO IMPLEMENTAR** nos seguintes cenários:

#### 1. Criar Utility de Sanitização

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

export const sanitizeText = (dirty: string): string => {
  // Remove todas as tags HTML, mantém apenas texto
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};
```

#### 2. Aplicar em Componentes de Renderização

```typescript
// src/components/EventDescription.tsx
import { sanitizeHtml } from '@/lib/sanitize';

export function EventDescription({ description }: { description: string }) {
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: sanitizeHtml(description) 
      }} 
    />
  );
}
```

#### 3. Aplicar em API Routes (Backend)

```typescript
// src/app/api/events/route.ts
import { sanitizeHtml } from '@/lib/sanitize';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Sanitizar antes de salvar no banco
  const sanitizedData = {
    ...body,
    description: sanitizeHtml(body.description),
  };
  
  // Salvar no Supabase
  const { data, error } = await supabase
    .from('events')
    .insert(sanitizedData);
    
  return Response.json(data);
}
```

#### 4. Validação no Backend com Zod

```typescript
// src/lib/validations/event.ts
import { z } from 'zod';
import { sanitizeHtml } from '@/lib/sanitize';

export const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().transform(sanitizeHtml), // Sanitizar automaticamente
  date: z.string().datetime(),
  // ... outros campos
});
```

---

## 3. Comparação: Sanitização Básica vs Avançada

### Sanitização Básica (Atual)

O projeto EKKLE já possui sanitização básica através de:

1. **Validação de Schema com Zod**
   - Valida tipos e formatos
   - Não remove HTML malicioso

2. **RLS (Row Level Security) no Supabase**
   - Protege acesso aos dados
   - Não sanitiza conteúdo

3. **TypeScript**
   - Type safety
   - Não previne XSS

### Sanitização Avançada (com isomorphic-dompurify)

Adiciona:

1. **Remoção de Scripts Maliciosos**
   - Previne XSS
   - Remove tags perigosas

2. **Whitelist de Tags Permitidas**
   - Controle granular
   - Permite formatação segura

3. **Sanitização Isomórfica**
   - Consistência entre cliente e servidor
   - Proteção em SSR

---

## 4. Recomendações Finais

### Para o Projeto EKKLE

| Ferramenta | Prioridade | Justificativa |
|------------|-----------|---------------|
| **Sentry** | 🟡 Média | Útil para monitoramento em produção, mas não crítico para MVP. Implementar após lançamento inicial. |
| **isomorphic-dompurify** | 🟢 Alta | Essencial se houver campos de texto rico (descrições, comentários). Implementar antes do lançamento. |

### Plano de Implementação Sugerido

#### Fase 1: Segurança Crítica (Antes do Lançamento)

1. ✅ Aplicar migration de security hardening (CONCLUÍDO)
2. ✅ Instalar isomorphic-dompurify (CONCLUÍDO)
3. ⚠️ Implementar sanitização em campos de texto rico
4. ⚠️ Adicionar validação de input com Zod + sanitização

#### Fase 2: Monitoramento (Pós-Lançamento)

1. ⚠️ Configurar Sentry (requer conta e DSN)
2. ⚠️ Configurar alertas e integrações
3. ⚠️ Implementar logging estruturado

#### Fase 3: Compliance LGPD (Contínuo)

1. ⚠️ Configurar scrubbing de PII no Sentry
2. ⚠️ Implementar audit logs (já criado na migration)
3. ⚠️ Adicionar consentimento de cookies
4. ⚠️ Implementar exportação de dados do usuário

---

## 5. Código de Exemplo: Implementação Completa

### Estrutura de Arquivos Sugerida

```
src/
├── lib/
│   ├── sanitize.ts          # Utilities de sanitização
│   ├── sentry.ts            # Configuração do Sentry
│   └── validations/
│       ├── event.ts         # Schemas de validação
│       └── course.ts
├── components/
│   └── SafeHtml.tsx         # Componente para renderizar HTML sanitizado
└── app/
    └── api/
        └── events/
            └── route.ts     # API com sanitização
```

### SafeHtml Component

```typescript
// src/components/SafeHtml.tsx
import { sanitizeHtml } from '@/lib/sanitize';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitized = sanitizeHtml(html);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

### Hook de Sanitização

```typescript
// src/hooks/useSanitize.ts
import { useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

export function useSanitize(html: string) {
  return useMemo(() => sanitizeHtml(html), [html]);
}

// Uso:
// const sanitizedDescription = useSanitize(event.description);
```

---

## 6. Checklist de Segurança

### Antes do Deploy

- [x] Migration de security hardening aplicada
- [x] isomorphic-dompurify instalado
- [ ] Sanitização implementada em campos de texto rico
- [ ] Validação de input com Zod em todas as API routes
- [ ] RLS policies testadas
- [ ] Testes de XSS realizados
- [ ] Variáveis de ambiente seguras (não commitadas)
- [ ] HTTPS configurado
- [ ] Rate limiting configurado

### Pós-Deploy

- [ ] Sentry configurado e testado
- [ ] Alertas de erro configurados
- [ ] Monitoring de performance ativo
- [ ] Logs de auditoria funcionando
- [ ] Backup de banco de dados configurado
- [ ] Plano de resposta a incidentes documentado

---

## 7. Recursos Adicionais

### Documentação

- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd)

### Ferramentas de Teste

- [XSS Strike](https://github.com/s0md3v/XSStrike) - Ferramenta de teste de XSS
- [Burp Suite](https://portswigger.net/burp) - Teste de segurança web
- [OWASP ZAP](https://www.zaproxy.org/) - Scanner de vulnerabilidades

---

## Conclusão

A implementação de **Sentry** e **isomorphic-dompurify** adiciona camadas importantes de segurança e observabilidade ao projeto EKKLE. Enquanto o Sentry é opcional para o MVP (mas altamente recomendado para produção), a sanitização de HTML é **essencial** para prevenir ataques XSS em campos de texto rico.

A migration de security hardening já aplicada fortaleceu significativamente a segurança do banco de dados com RLS policies, constraints únicos e soft deletes. Combinada com sanitização adequada no frontend e backend, o projeto estará bem protegido contra as vulnerabilidades mais comuns.

**Próximos Passos Recomendados:**

1. Implementar sanitização em todos os campos de texto rico
2. Configurar Sentry após criar conta no sentry.io
3. Adicionar testes automatizados de segurança
4. Documentar políticas de segurança e privacidade
5. Realizar auditoria de segurança antes do lançamento público
