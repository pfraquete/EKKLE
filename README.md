# Videira São José dos Campos - Gestão de Células

Sistema de gestão de células da igreja Videira São José dos Campos, construído com Next.js e Supabase.

## Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- (Opcional) Conta no [Railway](https://railway.app) para deploy

## Configuração Inicial

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd videirasaojosedoscampos
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o banco de dados no Supabase

⚠️ **ETAPA CRÍTICA**: Você precisa criar o banco de dados antes de rodar a aplicação!

**3.1. Criar/Acessar projeto no Supabase:**

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto ou selecione um existente
3. Aguarde a criação do banco de dados (leva ~2 minutos)

**3.2. Executar o schema SQL:**

1. No dashboard do Supabase, vá em **SQL Editor** (ícone de banco de dados no menu lateral)
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase-schema.sql` (na raiz do projeto)
4. Cole no editor SQL e clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a execução (deve completar sem erros)

**3.3. Criar seu primeiro usuário:**

1. Vá em **Authentication** → **Users** no dashboard do Supabase
2. Clique em **Add user** → **Create new user**
3. Preencha email e senha
4. Copie o **User UID** (você vai precisar)

**3.4. Criar o perfil do primeiro usuário:**

1. Volte ao **SQL Editor**
2. Execute este comando (SUBSTITUA os valores):

```sql
INSERT INTO profiles (id, church_id, full_name, email, role, member_stage, is_active)
VALUES (
  'SEU-USER-UID-AQUI',  -- Cole o User UID do passo 3.3
  '00000000-0000-0000-0000-000000000001',  -- ID da igreja padrão
  'Seu Nome Completo',
  'seu@email.com',
  'PASTOR',  -- Ou 'LEADER' ou 'MEMBER'
  'MEMBER',
  true
);
```

3. Clique em **Run**

✅ Pronto! Seu banco de dados está configurado e você tem um usuário administrador.

### 4. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e preencha com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Como obter as credenciais do Supabase:**

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Executar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para ver o resultado.

## Deploy no Railway

### Pré-requisito: Configure o banco de dados primeiro!

⚠️ **IMPORTANTE**: Antes de fazer deploy, você DEVE configurar o banco de dados no Supabase seguindo o **passo 3** acima. Sem o banco de dados configurado, você verá o erro "Database error querying schema".

### Configurar variáveis de ambiente no Railway

1. Acesse seu projeto no [Railway Dashboard](https://railway.app/dashboard)
2. Selecione seu serviço/projeto
3. Clique na aba **Variables**
4. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-aqui
NEXT_PUBLIC_APP_URL=https://seu-app.up.railway.app
```

**Como obter os valores:**
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Veja o **passo 4** acima
- `NEXT_PUBLIC_APP_URL`: Sua URL do Railway (pode ver na aba **Settings** → **Domains**)

### Deploy automático

O Railway está configurado para fazer deploy automático quando você fizer push para o repositório.

### Checklist de Deploy ✅

Antes de testar o sistema em produção, verifique:

- [ ] Banco de dados criado no Supabase (executou `supabase-schema.sql`)
- [ ] Primeiro usuário criado no Supabase Authentication
- [ ] Perfil do primeiro usuário criado na tabela `profiles`
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Deploy concluído sem erros no Railway
- [ ] Consegue acessar a URL do Railway
- [ ] Consegue fazer login com o usuário criado

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
