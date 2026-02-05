# Análise do Sistema Cativa Digital

## Feed Web

### Layout Geral
- **Sidebar Esquerda**: Menu de navegação com categorias (Mentoria & Cursos, Desafios, Comunidade, Loja)
- **Centro**: Feed de posts com cards bem diferenciados
- **Sidebar Direita**: Perfil do usuário com selos, conteúdos disponíveis, configurações

### Filtros do Feed
- Highlights (Destaques)
- Public (Público)
- Groups (Grupos)
- Trending (Em alta)

### Tags de Posts
- Dicas, Comunicados, Documentos, Eventos, Inspiração, Saúde, Segurança

### Posts
- Foto do autor + nome + selo (coroa dourada)
- Data + "Post fixado"
- Conteúdo (texto + mídia)
- Curtidas com avatares
- Botões: Curti / Não Curti
- Comentários com GIF e anexos

## Perfil do Usuário (Sidebar Direita)
- Foto + Nome + Pontos (1100)
- Link "Meu perfil"
- Selos conquistados em cards horizontais com scroll
- Conteúdos disponíveis (cursos)
- Configurações (Minha timeline, Painel administrativo, Meu perfil)

## Sistema de Selos

### Campos do Selo
- Nome
- Imagem (50x50)
- Descrição (com link opcional)
- Página de abertura
- Sempre visível (mostrar mesmo sem conquistar)
- Relevância (ordem de exibição)

### Exibição
- Cards com ícone do selo
- Nome do selo
- Indicador de conquistado (check verde)
- Scroll horizontal no perfil

## Ideias para EKKLE

### Selos Sugeridos
1. **Batismo** - Conquistado ao ser batizado
2. **Líder de Célula** - Ao se tornar líder
3. **Anjo da Guarda** - Participação em ministério
4. **Conferência [Nome]** - Participação em eventos
5. **Curso [Nome]** - Conclusão de cursos
6. **Membro Fiel** - X meses de frequência
7. **Dizimista** - Contribuição regular
8. **Discipulador** - Ao discipular alguém
9. **Voluntário** - Participação em ações sociais

### Funcionalidades
- Pastor cria selos personalizados
- Atribuição manual ou automática (baseada em eventos)
- Exibição no perfil do membro
- Gamificação para engajamento

## Detalhes do Formulário de Criação de Badge

### Campos do Formulário

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Name | Texto (obrigatório) | Nome do selo que será exibido |
| Image | Upload de imagem | Tamanho sugerido: 50x50 pixels |
| Badge description | Textarea | Descrição do selo. Se preenchido com link, redireciona ao clicar |
| Opening page | Select | Página de abertura: Feed, Group, Showcase, Courses |
| Always visible | Checkbox | Se marcado, o selo aparece no perfil mesmo quando não conquistado |

### Lista de Badges na Administração

| Coluna | Descrição |
|--------|-----------|
| Image | Ícone/imagem do selo |
| Name | Nome do selo |
| Users | Quantidade de usuários que possuem o selo |
| Relevance | Ordem de exibição (campo numérico editável) |
| Creation date | Data de criação |
| Actions | Ações em massa, editar, excluir |

### Badges Existentes no Cativa (Exemplos)

| Nome | Usuários | Relevância |
|------|----------|------------|
| Premium Vip | 1 | 7 |
| Premium | 8 | 2 |
| l'Inizio | 18 | 1 |
| Innovativa Comunicazione | 1 | 0 |
| Embaixador Meu Acesso | 3 | 0 |
| Presente pra você | 0 | 0 |

## Schema de Banco de Dados para EKKLE

### Tabela: badges

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| church_id | uuid | Foreign key para churches |
| name | text | Nome do selo (obrigatório) |
| description | text | Descrição do selo |
| image_url | text | URL da imagem do selo |
| opening_page | text | Página de abertura |
| always_visible | boolean | Mostrar mesmo sem conquistar |
| relevance | integer | Ordem de exibição |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

### Tabela: user_badges

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key para users |
| badge_id | uuid | Foreign key para badges |
| earned_at | timestamp | Data de conquista |
| created_at | timestamp | Data de criação |
