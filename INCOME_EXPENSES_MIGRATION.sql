-- ====================================
-- MIGRAÇÃO: ADICIONAR SISTEMA DE RECEITAS E DESPESAS
-- ====================================

-- ====================================
-- 1. ADICIONAR COLUNA TYPE NA TABELA TRANSACTIONS
-- ====================================
-- Tipos: 'income' (receita) ou 'expense' (despesa)
ALTER TABLE transactions 
ADD COLUMN type TEXT DEFAULT 'expense' CHECK (type IN ('income', 'expense'));

-- ====================================
-- 2. ADICIONAR COLUNA TYPE NA TABELA CATEGORIES
-- ====================================
-- Tipos: 'income' (receita) ou 'expense' (despesa)
ALTER TABLE categories 
ADD COLUMN type TEXT DEFAULT 'expense' CHECK (type IN ('income', 'expense'));

-- ====================================
-- 3. CRIAR ÍNDICE PARA PERFORMANCE
-- ====================================
CREATE INDEX transactions_type_idx ON transactions(type);
CREATE INDEX transactions_user_type_idx ON transactions(user_id, type);
CREATE INDEX categories_type_idx ON categories(type);
CREATE INDEX categories_user_type_idx ON categories(user_id, type);

-- ====================================
-- 4. CRIAR VIEW PARA CÁLCULOS DE SALDO
-- ====================================
-- Esta view calcula o saldo total (receitas - despesas) por usuário
CREATE OR REPLACE VIEW user_balance AS
SELECT 
  user_id,
  SUM(CASE WHEN type = 'income' THEN value ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN value ELSE -value END) as balance
FROM transactions
GROUP BY user_id;

-- ====================================
-- 5. VIEW PARA SALDO POR MÊS
-- ====================================
-- Esta view calcula o saldo por mês e usuário
CREATE OR REPLACE VIEW user_monthly_balance AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN type = 'income' THEN value ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN value ELSE -value END) as balance
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', date);

-- ====================================
-- VERIFICAÇÃO
-- ====================================
-- Execute estas queries para verificar:
-- SELECT * FROM transactions LIMIT 5;
-- SELECT * FROM categories LIMIT 5;
-- SELECT * FROM user_balance;
-- SELECT * FROM user_monthly_balance;
