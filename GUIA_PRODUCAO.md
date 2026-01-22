# 🚀 Guia: Configurar Supabase e Escalar o Dashboard

## Passo 1: Criar Conta Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Faça login com GitHub, Google ou email
4. Crie um novo projeto:
   - **Name:** `DashRafael`
   - **Password:** Guarde bem! 🔐
   - **Region:** Escolha a mais próxima (ex: `us-east-1` para América do Norte)

## Passo 2: Copiar Credenciais

1. Dentro do dashboard do Supabase, vá para **Settings > API**
2. Copie:
   - **Project URL** (exemplo: `https://seu-projeto.supabase.co`)
   - **Anon/Public Key** (a chave começando com `eyJh...`)

## Passo 3: Configurar `.env` Localmente

Na raiz do projeto, crie/edite o arquivo `.env`:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
```

⚠️ **Importante:** Nunca comita `.env` no Git! Já está no `.gitignore`.

## Passo 4: Criar Tabelas no Banco

1. No dashboard Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Cole e execute o script abaixo:

```sql
-- Tabela de usuários (estendida)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  is_fixed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Habilitar RLS (segurança)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para transações
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para categorias
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Política para profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

## Passo 5: Testar Localmente

```bash
npm run dev
```

1. Acesse `http://localhost:5173`
2. Clique em **"Criar Conta"**
3. Use um email teste e senha
4. Você será redirecionado ao dashboard
5. Tente adicionar uma despesa
6. Abra em outra aba e faça login com outro usuário - seus dados ficam isolados! ✅

## Passo 6: Deploy para Produção

### Option A: Vercel (Recomendado)
```bash
npm run build
# Depois fazer push do código para GitHub
# E conectar ao Vercel automaticamente
```

**No Vercel, adicione as variáveis de ambiente:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option B: Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Option C: Seu próprio servidor
```bash
npm run build
# Copie a pasta `dist/` para seu servidor
```

## Segurança e Escalabilidade

✅ **O que você tem agora:**
- Múltiplos usuários com dados 100% isolados
- Autenticação segura com Supabase Auth
- Backup automático no Supabase
- Escalável para 1.000+ usuários
- Sem servidor pra manter
- HTTPS automático

🔐 **Proteções ativas:**
- RLS (Row Level Security) - usuários só veem seus dados
- Senhas hasheadas automaticamente
- JWT tokens seguros
- CORS configurado

## Monetizar o Acesso

Agora que você tem multi-usuário, pode:

1. **Criar landing page** com CTA "Criar Conta"
2. **Adicionar planos** (básico/premium)
3. **Integrar pagamento** (Stripe, PagSeguro, etc)
4. **Cada usuário paga pelo acesso**

## Troubleshooting

### Erro: "Missing Supabase URL"
- Verifique `.env` com os valores corretos
- Reinicie o servidor (`npm run dev`)

### Erro: "Row Level Security"
- Execute o script SQL de políticas novamente
- Certifique-se que está em sua conta Supabase

### Dados não aparecem
- Abra DevTools (F12) > Network
- Verifique as requisições ao Supabase
- Confirme que está logado

---

**Próximas melhorias:**
- [ ] Adicionar "Recuperar Senha"
- [ ] Email de verificação
- [ ] 2FA (Two-Factor Authentication)
- [ ] Exportar dados em PDF/Excel
- [ ] Gráficos em tempo real
- [ ] Notificações de despesas

Sucesso! 🎉
