# Setup Supabase para Dash Rafael

## 1. Criar Conta e Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Sign Up" e crie sua conta
3. Crie um novo projeto:
   - Nome: `DashRafael`
   - Região: Escolha a mais próxima de você
   - Senha do banco: Guarde em local seguro

## 2. Obter Credenciais

1. No painel do Supabase, vá para **Settings > API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

3. Crie arquivo `.env` na raiz do projeto:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 3. Criar Tabelas no Banco

No editor SQL do Supabase, execute este script:

```sql
-- Tabela de usuários (estendida)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabela de categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  is_fixed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuário pode ver apenas seus dados
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

-- Mesmas políticas para categorias
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

## 4. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

## 5. Configurar Autenticação por Email

No painel Supabase:
1. Vá para **Authentication > Providers**
2. Certifique-se de que "Email" está ativado
3. (Opcional) Desative "Confirm email" para desenvolvimento rápido

## 6. Pronto!

O app agora funciona com:
- ✅ Autenticação com email/senha
- ✅ Dados isolados por usuário
- ✅ Sync automático em tempo real
- ✅ Escalável para N usuários
