# Trilho de Formação Kids - Documentação

## Visão Geral

O **Trilho de Formação Kids** é uma funcionalidade que permite acompanhar a jornada de desenvolvimento espiritual de cada criança no ministério infantil. Inspirado no "Trilho do Vencedor" da Igreja Videira, este módulo permite que líderes configurem etapas personalizáveis e acompanhem o progresso de cada criança.

## Estrutura de Arquivos

```
src/
├── actions/
│   └── kids-formation.ts          # Server actions para o trilho
├── components/
│   └── rede-kids/
│       └── formation/
│           ├── index.ts                    # Exports
│           ├── formation-track-view.tsx    # Visualização do trilho
│           ├── child-progress-card.tsx     # Card de progresso no perfil
│           └── formation-stage-manager.tsx # Gerenciador de etapas
└── app/
    └── (app)/
        └── rede-kids/
            ├── configuracoes/
            │   ├── page.tsx                # Página de configurações
            │   └── trilho/
            │       └── page.tsx            # Configuração do trilho
            └── criancas/
                └── [id]/
                    └── page.tsx            # Perfil com trilho integrado
```

## Banco de Dados

### Tabelas

#### `kids_formation_stages`
Define as etapas do trilho (personalizável por igreja).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| church_id | UUID | FK para churches |
| name | TEXT | Nome da etapa |
| description | TEXT | Descrição da etapa |
| stage_order | SMALLINT | Ordem de exibição |
| icon_name | TEXT | Nome do ícone Lucide |
| color | TEXT | Cor hex (#RRGGBB) |
| is_active | BOOLEAN | Se está ativa |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

#### `kids_child_formation_progress`
Registra o progresso de cada criança.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| church_id | UUID | FK para churches |
| child_id | UUID | FK para kids_children |
| stage_id | UUID | FK para kids_formation_stages |
| completed_at | TIMESTAMPTZ | Data de conclusão |
| notes | TEXT | Observações |
| completed_by | UUID | FK para profiles (quem marcou) |
| created_at | TIMESTAMPTZ | Data de criação |

### Funções Helper

- `is_kids_network_member(user_id, church_id)` - Verifica se é membro da rede kids
- `is_kids_network_leader(user_id, church_id)` - Verifica se é líder na rede kids
- `seed_default_kids_formation_stages(church_id)` - Cria etapas padrão para uma igreja

## Server Actions

### Gerenciamento de Etapas (Pastor)

```typescript
// Listar etapas
getFormationStages(): Promise<FormationStage[]>
getActiveFormationStages(): Promise<FormationStage[]>

// CRUD
createFormationStage(data): Promise<{ success, data?, error? }>
updateFormationStage(id, data): Promise<{ success, data?, error? }>
deleteFormationStage(id): Promise<{ success, error? }>

// Reordenar
reorderFormationStages(stageIds): Promise<{ success, error? }>

// Seed
seedDefaultFormationStages(): Promise<{ success, error? }>
```

### Progresso das Crianças (Líderes)

```typescript
// Consultar progresso
getChildProgress(childId): Promise<ChildFormationProgress[]>
getChildWithProgress(childId): Promise<ChildWithProgress | null>

// Marcar/Remover progresso
markStageAsCompleted(data): Promise<{ success, data?, error? }>
removeStageFromChild(progressId): Promise<{ success, error? }>

// Estatísticas
getFormationStats(): Promise<FormationStats | null>
```

## Componentes

### FormationTrackView
Visualização do trilho com etapas em formato de timeline.

```tsx
<FormationTrackView
  stages={stages}
  completedProgress={progress}
  currentStageId={currentStage?.id}
  size="md" // sm | md | lg
  showLabels={true}
  interactive={canEdit}
  onStageClick={(stage) => handleClick(stage)}
/>
```

### ChildProgressCard
Card completo para exibir no perfil da criança.

```tsx
<ChildProgressCard
  child={childWithProgress}
  stages={stages}
  canEdit={isLeader}
/>
```

### FormationStageManager
Interface de gerenciamento com drag-and-drop.

```tsx
<FormationStageManager initialStages={stages} />
```

## Permissões

| Ação | PASTOR | PASTORA_KIDS | DISCIPULADORA_KIDS | LEADER_KIDS | MEMBER |
|------|--------|--------------|--------------------|--------------| -------|
| Ver etapas | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar/Editar etapas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deletar etapas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver progresso | ✅ | ✅ | ✅ | ✅ | ❌ |
| Marcar conclusão | ✅ | ✅ | ✅ | ✅ | ❌ |
| Remover progresso | ✅ | ✅ | ❌ | ❌ | ❌ |

## Etapas Padrão

Ao clicar em "Criar Etapas Padrão", as seguintes etapas são criadas:

1. **Evangelizado** (❤️ Vermelho) - A criança aceitou Jesus como Salvador
2. **Encontro com Deus** (✨ Laranja) - Participou do retiro Encontro com Deus Kids
3. **Consolidação** (📖 Verde) - Concluiu o processo de consolidação
4. **Em Treinamento** (🎓 Azul) - Está sendo treinado para ministrar
5. **Líder Kids** (👑 Roxo) - Formado como líder do ministério infantil

## Próximas Fases

### Fase 2: Biblioteca de Conteúdo + Eventos
- Upload de lições e materiais
- Associação de lições às reuniões
- Eventos com autorização parental

### Fase 3: Gamificação
- Memorização de versículos
- Atividades do discípulo
- Sistema de pontos e conquistas
