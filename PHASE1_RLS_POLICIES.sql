-- ====================================
-- FASE 1: POLÍTICAS DE RLS (ROW LEVEL SECURITY)
-- ====================================
-- Execute este script no SQL Editor do Supabase para proteger seus dados

-- ====================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ====================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_invoices ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 2. POLÍTICAS PARA TABELA "profiles"
-- ====================================

-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Sistema pode inserir novos perfis (durante signup)
CREATE POLICY "System can insert profiles during signup"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ====================================
-- 3. POLÍTICAS PARA TABELA "categories"
-- ====================================

-- Usuários podem ler apenas suas próprias categorias
CREATE POLICY "Users can view own categories"
ON categories FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar categorias para si mesmos
CREATE POLICY "Users can create categories"
ON categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias categorias
CREATE POLICY "Users can update own categories"
ON categories FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias categorias
CREATE POLICY "Users can delete own categories"
ON categories FOR DELETE
USING (auth.uid() = user_id);

-- ====================================
-- 4. POLÍTICAS PARA TABELA "transactions"
-- ====================================

-- Usuários podem ler apenas suas próprias transações
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar transações para si mesmos
CREATE POLICY "Users can create transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias transações
CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias transações
CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- ====================================
-- 5. POLÍTICAS PARA TABELA "credit_cards"
-- ====================================

-- Usuários podem ler apenas seus próprios cartões
CREATE POLICY "Users can view own credit cards"
ON credit_cards FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar cartões para si mesmos
CREATE POLICY "Users can create credit cards"
ON credit_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios cartões
CREATE POLICY "Users can update own credit cards"
ON credit_cards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios cartões
CREATE POLICY "Users can delete own credit cards"
ON credit_cards FOR DELETE
USING (auth.uid() = user_id);

-- ====================================
-- 6. POLÍTICAS PARA TABELA "credit_card_invoices"
-- ====================================

-- Usuários podem ler apenas suas próprias faturas
-- (isso requer join com credit_cards)
CREATE POLICY "Users can view own invoices"
ON credit_card_invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM credit_cards
    WHERE credit_cards.id = credit_card_invoices.credit_card_id
    AND credit_cards.user_id = auth.uid()
  )
);

-- Usuários podem atualizar suas próprias faturas
CREATE POLICY "Users can update own invoices"
ON credit_card_invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM credit_cards
    WHERE credit_cards.id = credit_card_invoices.credit_card_id
    AND credit_cards.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM credit_cards
    WHERE credit_cards.id = credit_card_invoices.credit_card_id
    AND credit_cards.user_id = auth.uid()
  )
);

-- ====================================
-- 7. VERIFICAÇÃO
-- ====================================
-- Para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'categories', 'transactions', 'credit_cards', 'credit_card_invoices');

-- ====================================
-- IMPORTANTE: PRÓXIMOS PASSOS
-- ====================================
-- 1. Execute todo este script no SQL Editor do Supabase
-- 2. Teste o app com um usuário para verificar se está funcionando
-- 3. Se receber erro "new row violates row-level security policy", verifique:
--    - Se a coluna user_id está sendo preenchida corretamente
--    - Se o UUID do usuário autenticado está correto
-- 4. Se precisar desabilitar RLS temporariamente para debug:
--    ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
