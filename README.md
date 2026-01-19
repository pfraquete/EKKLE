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

### 3. Configurar variáveis de ambiente

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

### 4. Executar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para ver o resultado.

## Deploy no Railway

### Configurar variáveis de ambiente no Railway

1. Acesse seu projeto no [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **Variables**
3. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-aqui
NEXT_PUBLIC_APP_URL=https://seu-app.up.railway.app
```

⚠️ **IMPORTANTE**: Sem essas variáveis configuradas, você verá o erro "Database error querying schema" ao tentar acessar o sistema.

### Deploy automático

O Railway está configurado para fazer deploy automático quando você fizer push para o repositório.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
