# 🚨 Como Resolver o Erro "Database error querying schema"

## O Problema

Seu sistema no Railway está rodando, mas **o banco de dados não foi configurado**. Por isso você vê o erro ao tentar fazer login.

## ✅ Solução Rápida (5 minutos)

### 1️⃣ Acesse o Supabase SQL Editor

1. Vá em: https://supabase.com/dashboard
2. Selecione seu projeto: **lzykenasmeyeznbyvtat**
3. Clique em **SQL Editor** no menu lateral (ícone de dados)

### 2️⃣ Execute o Schema SQL

1. Clique em **+ New query**
2. Abra o arquivo `supabase-schema.sql` (está na raiz do projeto)
3. **Copie TUDO** do arquivo
4. **Cole** no editor SQL do Supabase
5. Clique em **RUN** (ou Ctrl+Enter)
6. Aguarde finalizar (deve demorar ~10 segundos)

### 3️⃣ Crie seu Primeiro Usuário

**No Supabase:**

1. Vá em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - Email: `seu@email.com`
   - Password: `suasenha123` (ou a que preferir)
4. Clique em **Create user**
5. **COPIE o User UID** (você vai precisar no próximo passo)
   - Exemplo: `3fa85f64-5717-4562-b3fc-2c963f66afa6`

### 4️⃣ Crie o Perfil do Usuário

**Volte ao SQL Editor:**

1. Clique em **+ New query** novamente
2. Cole este código (SUBSTITUA `SEU-USER-UID-AQUI` pelo UID que copiou):

```sql
INSERT INTO profiles (id, church_id, full_name, email, role, member_stage, is_active)
VALUES (
  'SEU-USER-UID-AQUI',  -- ⚠️ COLE O UID AQUI
  '00000000-0000-0000-0000-000000000001',
  'Seu Nome Completo',  -- ⚠️ MUDE PARA SEU NOME
  'seu@email.com',      -- ⚠️ MUDE PARA SEU EMAIL
  'PASTOR',
  'MEMBER',
  true
);
```

3. Clique em **RUN**

### 5️⃣ Teste o Login

1. Acesse: https://ekkle.up.railway.app
2. Faça login com:
   - Email: o que você criou no passo 3
   - Senha: a que você criou no passo 3

## 🎉 Pronto!

Se seguiu os passos corretamente, o sistema vai funcionar! Você deve ser redirecionado para o dashboard.

---

## ❌ Se Ainda Não Funcionar

**Possíveis problemas:**

1. **Erro no SQL**: Verifique se executou TODO o conteúdo do `supabase-schema.sql`
2. **User UID errado**: Volte no Authentication → Users e copie o UID correto
3. **Variáveis de ambiente**: Confirme no Railway que as variáveis estão corretas:
   - `NEXT_PUBLIC_SUPABASE_URL`: https://lzykenasmeyeznbyvtat.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (a chave que já está configurada)
   - `NEXT_PUBLIC_APP_URL`: https://ekkle.up.railway.app

---

## 📚 Documentação Completa

Para mais detalhes, consulte o arquivo `README.md` na seção **"3. Configurar o banco de dados no Supabase"**.
