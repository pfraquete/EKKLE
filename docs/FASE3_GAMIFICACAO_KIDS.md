# Fase 3: Gamificação Kids

## Visão Geral

A Fase 3 implementa um sistema completo de gamificação para o ministério infantil, incluindo:

- **Sistema de Versículos** - Memorização com pontos e níveis de dificuldade
- **Medalhas e Conquistas** - Recompensas por marcos alcançados
- **Checklist do Discípulo** - Atividades diárias para formação espiritual
- **Pontos e Níveis** - Progressão visual do crescimento
- **Ranking** - Competição saudável entre as crianças

---

## Estrutura do Banco de Dados

### Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| `kids_memory_verses` | Versículos disponíveis para memorização |
| `kids_child_memorized_verses` | Versículos memorizados por cada criança |
| `kids_badges` | Medalhas disponíveis |
| `kids_child_badges` | Medalhas conquistadas por cada criança |
| `kids_points_log` | Histórico de pontos (log de transações) |
| `kids_disciple_activities` | Atividades do checklist do discípulo |
| `kids_child_activities` | Atividades completadas por cada criança |
| `kids_meeting_activities` | Atividades realizadas em reuniões de célula |
| `kids_levels` | Níveis de progressão |

### Colunas Adicionadas em kids_children

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `total_points` | INTEGER | Total de pontos acumulados |
| `current_streak` | INTEGER | Sequência atual de participação |
| `best_streak` | INTEGER | Melhor sequência já alcançada |
| `current_level_id` | UUID | Nível atual da criança |

---

## Server Actions

### Arquivo: `src/actions/kids-gamification.ts`

#### Versículos
- `getMemoryVerses()` - Lista versículos disponíveis
- `createMemoryVerse(data)` - Cria novo versículo
- `markVerseAsMemorized(childId, verseId, notes?)` - Marca versículo como memorizado
- `getChildMemorizedVerses(childId)` - Lista versículos memorizados pela criança

#### Medalhas
- `getBadges()` - Lista medalhas disponíveis
- `awardBadge(childId, badgeId, notes?)` - Concede medalha à criança
- `getChildBadges(childId)` - Lista medalhas conquistadas pela criança

#### Atividades
- `getDiscipleActivities()` - Lista atividades do checklist
- `recordChildActivity(childId, activityId, notes?)` - Registra atividade completada
- `getChildActivities(childId, date?)` - Lista atividades da criança

#### Pontos
- `addManualPoints(childId, points, reason)` - Adiciona pontos manualmente
- `getChildPointsLog(childId)` - Lista histórico de pontos

#### Níveis e Estatísticas
- `getLevels()` - Lista níveis de progressão
- `getChildGamificationStats(childId)` - Estatísticas completas da criança
- `getKidsRanking(limit?)` - Ranking das crianças

#### Seed
- `seedDefaultGamificationData()` - Cria dados padrão (versículos, medalhas, atividades, níveis)

---

## Componentes React

### Arquivo: `src/components/rede-kids/gamification/`

| Componente | Descrição |
|------------|-----------|
| `AchievementsDashboard` | Dashboard completo de conquistas da criança |
| `DiscipleChecklist` | Checklist de atividades diárias |
| `VerseMemorization` | Interface para memorização de versículos |
| `KidsRanking` | Ranking das crianças por pontos |
| `AwardBadgeDialog` | Diálogo para conceder medalhas |

---

## Páginas

| Rota | Descrição |
|------|-----------|
| `/rede-kids/gamificacao` | Página principal de gamificação |
| `/rede-kids/configuracoes/gamificacao` | Configurações (versículos, medalhas, etc) |

---

## Dados Padrão (Seed)

### Versículos (8)
- João 3:16 (Fácil, 10 pts)
- Salmos 23:1 (Fácil, 10 pts)
- Filipenses 4:13 (Fácil, 10 pts)
- Provérbios 3:5 (Médio, 15 pts)
- Josué 1:9 (Médio, 15 pts)
- Romanos 8:28 (Médio, 15 pts)
- Isaías 41:10 (Difícil, 20 pts)
- Jeremias 29:11 (Difícil, 20 pts)

### Medalhas (10)
- **Versículos**: Primeiro Versículo, Conhecedor da Palavra, Mestre dos Versículos
- **Presença**: Fiel (4 seguidas), Super Fiel (8 seguidas)
- **Atividades**: Discípulo Ativo, Evangelista Mirim
- **Formação**: Trilho Completo
- **Especiais**: Líder Kids, Aniversariante

### Atividades do Discípulo (6)
- Orou (5 pts)
- Leu a Bíblia (10 pts)
- Deu testemunho (15 pts)
- Ajudou alguém (10 pts)
- Convidou um amigo (20 pts)
- Memorizou versículo (15 pts)

### Níveis (5)
1. **Semente** (0-99 pts) - Começando a jornada
2. **Broto** (100-299 pts) - Crescendo na fé
3. **Plantinha** (300-599 pts) - Firmando raízes
4. **Arbusto** (600-999 pts) - Dando frutos
5. **Árvore** (1000+ pts) - Forte e frutífero

---

## Triggers Automáticos

O sistema possui triggers que automatizam a contagem de pontos:

1. **Versículo Memorizado** → Adiciona pontos automaticamente
2. **Atividade Completada** → Adiciona pontos automaticamente
3. **Medalha Conquistada** → Adiciona pontos automaticamente
4. **Qualquer Ponto** → Atualiza `total_points` na criança

---

## Como Usar

### 1. Configuração Inicial

1. Acesse `/rede-kids/configuracoes/gamificacao`
2. Clique em "Criar Dados Padrão"
3. O sistema criará versículos, medalhas, atividades e níveis

### 2. No Perfil da Criança

Adicione os componentes de gamificação:

```tsx
import { 
  AchievementsDashboard, 
  DiscipleChecklist,
  VerseMemorization,
  AwardBadgeDialog
} from '@/components/rede-kids/gamification'

// Dashboard de conquistas
<AchievementsDashboard childId={child.id} childName={child.full_name} />

// Checklist diário
<DiscipleChecklist childId={child.id} />

// Memorização de versículos
<VerseMemorization childId={child.id} />

// Botão para conceder medalha
<AwardBadgeDialog childId={child.id} childName={child.full_name} />
```

### 3. Na Página Principal do Kids

```tsx
import { KidsRanking } from '@/components/rede-kids/gamification'

// Ranking das crianças
<KidsRanking limit={10} />
```

---

## Fluxo de Pontuação

```
Criança memoriza versículo
    ↓
Líder marca como memorizado
    ↓
Trigger insere em kids_points_log
    ↓
Trigger atualiza total_points na criança
    ↓
Dashboard atualiza automaticamente
```

---

## Próximas Melhorias Sugeridas

1. **Notificações** - Avisar quando criança sobe de nível
2. **Certificados** - Gerar PDF de conquistas
3. **Metas Semanais** - Definir objetivos para a semana
4. **Desafios em Grupo** - Competições entre células
5. **Recompensas Físicas** - Integração com sistema de prêmios
