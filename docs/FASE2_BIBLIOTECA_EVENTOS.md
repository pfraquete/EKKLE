# Fase 2: Biblioteca de Conteúdo + Eventos Especializados

Este documento descreve a implementação completa da Fase 2 do roadmap Kids do EKKLE.

## Visão Geral

A Fase 2 adiciona duas funcionalidades principais ao módulo Kids:

1. **Biblioteca de Conteúdo** - Repositório centralizado de lições, histórias, músicas e atividades
2. **Autorização Parental** - Sistema completo para eventos kids com check-in/check-out

---

## 1. Biblioteca de Conteúdo

### Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| `kids_library_categories` | Categorias para organizar conteúdos |
| `kids_library_content` | Conteúdos (lições, histórias, músicas, etc) |
| `kids_library_attachments` | Anexos adicionais por conteúdo |
| `kids_cell_meetings` | Reuniões de célula kids |
| `kids_cell_meeting_lessons` | Relação entre reuniões e conteúdos |

### Tipos de Conteúdo

- `lesson` - Lição Bíblica
- `story` - História
- `music` - Música
- `activity` - Atividade/Dinâmica
- `video` - Vídeo
- `document` - Documento
- `image` - Imagem
- `other` - Outro

### Categorias Padrão

Ao clicar em "Criar Categorias Padrão", são criadas:

1. 📖 **Lições Bíblicas** - Estudos e lições para células kids
2. 📚 **Histórias** - Histórias bíblicas ilustradas
3. 🎵 **Músicas** - Louvores e músicas infantis
4. 🧩 **Atividades** - Atividades, jogos e dinâmicas
5. 🎬 **Vídeos** - Vídeos educativos e de louvor
6. 📁 **Recursos** - Materiais de apoio diversos

### Server Actions

| Função | Descrição |
|--------|-----------|
| `getLibraryCategories()` | Lista categorias com contagem de conteúdos |
| `createLibraryCategory()` | Cria nova categoria (Pastor) |
| `deleteLibraryCategory()` | Exclui categoria (Pastor) |
| `seedDefaultLibraryCategories()` | Cria categorias padrão |
| `getLibraryContent()` | Lista conteúdos com filtros |
| `getLibraryContentById()` | Busca conteúdo por ID |
| `createLibraryContent()` | Cria novo conteúdo |
| `updateLibraryContent()` | Atualiza conteúdo |
| `deleteLibraryContent()` | Exclui conteúdo |
| `toggleContentFeatured()` | Marca/desmarca como destaque |
| `attachContentToMeeting()` | Anexa conteúdo a uma reunião |
| `getMeetingLessons()` | Lista lições de uma reunião |
| `removeContentFromMeeting()` | Remove conteúdo de reunião |
| `getLibraryStats()` | Estatísticas da biblioteca |

### Componentes

| Componente | Descrição |
|------------|-----------|
| `ContentCard` | Card de exibição de conteúdo |
| `ContentForm` | Formulário de criação/edição |
| `CategoryGrid` | Grid de categorias |

### Página

- `/rede-kids/biblioteca` - Página principal da biblioteca

---

## 2. Autorização Parental para Eventos

### Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| `event_parental_consents` | Autorizações parentais |
| `event_attendance_log` | Log de check-in/check-out |

### Campos Adicionados em `events`

- `is_kids_event` - Indica se é evento kids
- `requires_parental_consent` - Requer autorização
- `min_age` - Idade mínima
- `max_age` - Idade máxima

### Fluxo de Autorização

```
1. Evento Kids criado
   ↓
2. Crianças são registradas
   ↓
3. Autorização criada (status: pending)
   ↓
4. Pastor/Pastora aprova (status: approved)
   ↓
5. No dia do evento: Check-in
   ↓
6. Ao final: Check-out (com identificação de quem buscou)
```

### Permissões Coletadas

- ✅ Autorização para fotos/vídeos
- ✅ Autorização para transporte
- ✅ Autorização para atividades aquáticas
- ✅ Autorização para administrar medicação

### Informações Médicas

- Alergias (da ficha da criança)
- Condições médicas
- Observações específicas para o evento
- Contato de emergência

### Server Actions

| Função | Descrição |
|--------|-----------|
| `getEventConsents()` | Lista autorizações de um evento |
| `getConsentById()` | Busca autorização por ID |
| `createParentalConsent()` | Cria nova autorização |
| `updateParentalConsent()` | Atualiza autorização |
| `approveConsent()` | Aprova autorização |
| `rejectConsent()` | Rejeita autorização |
| `checkInChild()` | Registra entrada da criança |
| `checkOutChild()` | Registra saída (com identificação) |
| `getAttendanceLog()` | Histórico de check-in/out |
| `getKidsEvents()` | Lista eventos kids |
| `getEventKidsStats()` | Estatísticas do evento |
| `bulkRegisterChildrenForEvent()` | Registro em lote |
| `getConsentsForExport()` | Dados para exportação |

### Componentes

| Componente | Descrição |
|------------|-----------|
| `ConsentCard` | Card de autorização com status |
| `ConsentForm` | Formulário de nova autorização |
| `CheckInOutDialog` | Diálogo de check-in/check-out |

---

## Arquivos Criados

### Migrations
- `supabase/migrations/20260204_kids_library.sql`
- `supabase/migrations/20260204_kids_parental_consent.sql`

### Server Actions
- `src/actions/kids-library.ts`
- `src/actions/kids-parental-consent.ts`

### Componentes
- `src/components/rede-kids/library/content-card.tsx`
- `src/components/rede-kids/library/content-form.tsx`
- `src/components/rede-kids/library/category-grid.tsx`
- `src/components/rede-kids/library/index.ts`
- `src/components/rede-kids/parental-consent/consent-card.tsx`
- `src/components/rede-kids/parental-consent/consent-form.tsx`
- `src/components/rede-kids/parental-consent/check-in-out-dialog.tsx`
- `src/components/rede-kids/parental-consent/index.ts`

### Páginas
- `src/app/(app)/rede-kids/biblioteca/page.tsx`

---

## Como Usar

### Biblioteca

```tsx
import { ContentCard, ContentForm, CategoryGrid } from '@/components/rede-kids/library'
import { getLibraryCategories, getLibraryContent } from '@/actions/kids-library'

// Na página
const categories = await getLibraryCategories()
const content = await getLibraryContent({ category_id: 'xxx' })

<CategoryGrid categories={categories} />
<ContentCard content={content[0]} />
```

### Autorização Parental

```tsx
import { ConsentCard, ConsentForm, CheckInOutDialog } from '@/components/rede-kids/parental-consent'
import { getEventConsents, checkInChild } from '@/actions/kids-parental-consent'

// Na página de evento
const consents = await getEventConsents(eventId)

<ConsentCard 
  consent={consents[0]} 
  onCheckIn={() => checkInChild({ consent_id: consents[0].id })}
/>
```

---

## Próximos Passos

### Fase 3: Gamificação
- Sistema de memorização de versículos
- Pontos e medalhas
- Checklist de atividades do discípulo
- Dashboard de conquistas
