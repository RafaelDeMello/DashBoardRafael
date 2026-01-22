# Configuração Detalhada do Supabase

## 🔧 Passo 1: Criar o Bucket de Storage para Avatars

### 1.1 Acessar o Painel do Supabase
1. Acesse https://app.supabase.com
2. Clique no seu projeto (DashRafael ou similar)
3. No menu lateral esquerdo, clique em **"Storage"**

### 1.2 Criar um novo Bucket
1. Clique no botão **"New Bucket"** (ou "Create bucket")
2. Na caixa de diálogo que aparecer:
   - **Name**: `avatars` (exatamente assim, em minúsculas)
   - **Public bucket**: ☑️ Marque a checkbox "Public bucket"
3. Clique em **"Create bucket"**

### 1.3 Verificar
- Você deve ver um bucket chamado `avatars` listado
- O bucket deve estar marcado como público

---

## 🔐 Passo 2: Desabilitar/Corrigir Row Level Security (RLS)

### 2.1 Acessar SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"**

### 2.2 SOLUÇÃO COMPLETA (Copie e Cole TUDO isto):

```sql
-- ====================================
-- DESABILITAR RLS DA TABELA PROFILES
-- ====================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

3. Clique em **"Run"** (botão verde)
4. Você deve ver uma mensagem de sucesso

### 2.3 Configurar Políticas de Storage (via Interface)

Você precisa fazer isso direto na interface do Supabase (não pelo SQL):

1. Vá para **Storage** > **Buckets**
2. Clique no bucket **avatars**
3. Clique em **Policies** (ou **RLS**)
4. Clique em **New Policy** ou **Add Policy**
5. Escolha um template ou crie do zero:
   - Nome: `Allow public uploads`
   - Type: **INSERT**
   - Check: `true` (deixe vazio para permitir tudo)
6. Salve a política

7. Crie outra política:
   - Nome: `Allow public read`
   - Type: **SELECT**
   - Check: `true` (deixe vazio para permitir tudo)
8. Salve

### ✅ Resumo do que foi feito:
- ✓ RLS da tabela `profiles` desabilitado
- ✓ Políticas de Storage permitem upload público
- ✓ Agora todos podem fazer upload de avatares
- ✓ Agora todos podem ler perfis

---

## 📊 Passo 3: Verificar a Tabela Profiles

### 3.1 Acessar a Tabela
1. No menu lateral esquerdo, clique em **"Table Editor"**
2. Procure por uma tabela chamada `profiles`
3. Se não existir, você precisa criar (veja Passo 3.2)

### 3.2 Verificar as Colunas
Se a tabela `profiles` existir, ela deve ter estas colunas:
- ✅ `id` (UUID, Primary Key)
- ✅ `email` (Text)
- ✅ `gender` (Text)
- ✅ `avatar_url` (Text, pode ser NULL)

### 3.3 Criar a Tabela (Se não existir)

Se a tabela não existe, execute este SQL:

```sql
-- Criar tabela profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  gender TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Desabilitar RLS para teste
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Criar índice para melhor performance
CREATE INDEX profiles_id_idx ON profiles(id);
```

---

## 🧪 Passo 4: Testar a Configuração

### 4.1 No seu navegador:
1. Recarregue a página da aplicação (F5)
2. Limpe o cache (Ctrl + Shift + Delete) se necessário
3. Tente criar uma nova conta com foto

### 4.2 Procure pelos logs no Console do Navegador (F12):
Você deve ver logs como:
```
📤 Fazendo upload da imagem: [ID].jpg
✓ URL da imagem: https://utykgwqqtcdppqedwaxk.supabase.co/storage/v1/object/public/avatars/[ID].jpg
💾 Salvando perfil com avatar_url: https://...
✓ Perfil criado com sucesso
```

---

## ✅ Checklist Final

- [ ] Bucket `avatars` criado e público
- [ ] RLS desabilitado OU políticas corretas criadas
- [ ] Tabela `profiles` existe com as colunas certas
- [ ] Página recarregada e cache limpo
- [ ] Nova conta criada com sucesso
- [ ] Foto aparece na sidebar ao fazer login
- [ ] Avatar carrega corretamente no dashboard

---

## 🆘 Solução de Problemas

### Erro: "Bucket not found"
- ✓ Verifique se o bucket foi criado com o nome exato `avatars`
- ✓ Verifique se está marcado como público

### Erro: "new row violates row-level security policy"
- ✓ Execute o comando `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`
- ✓ Ou crie as políticas RLS corretamente (Passo 2.2 ALTERNATIVA)

### Erro: "The result contains 0 rows"
- ✓ A tabela `profiles` pode estar vazia ou ter RLS ativo
- ✓ Desabilite RLS e tente novamente

### Foto não aparece
- ✓ Verifique se o bucket é público
- ✓ Verifique se a URL gerada é acessível (clique nela no console)
- ✓ Limpe o cache do navegador (Ctrl + Shift + Delete)

---

## 📞 Próximos Passos

Após completar esta configuração:
1. Teste o login e signup com uma foto
2. Verifique se a foto aparece na sidebar
3. Verifique se o gênero muda o tema (rosa/cinza)
4. Se tudo funcionar, a aplicação está pronta! 🎉
