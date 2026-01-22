-- -- ====================================
-- MIGRAÇÃO: ADICIONAR SISTEMA DE CARTÕES DE CRÉDITO
-- ====================================

-- ====================================
-- CRIAR TABELA DE CARTÕES DE CRÉDITO
-- ====================================
CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL,
  closing_day INTEGER NOT NULL,
  due_day INTEGER NOT NULL,
  color TEXT DEFAULT '#475569',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- ADICIONAR COLUNA credit_card_id NA TABELA transactions
-- ====================================
ALTER TABLE transactions 
ADD COLUMN credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL;

-- ====================================
-- CRIAR TABELA DE FATURAS
-- ====================================
CREATE TABLE credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(credit_card_id, month, year)
);

-- ====================================
-- DESABILITAR RLS PARA TESTES
-- ====================================
ALTER TABLE credit_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_invoices DISABLE ROW LEVEL SECURITY;

-- ====================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ====================================
CREATE INDEX credit_cards_user_id_idx ON credit_cards(user_id);
CREATE INDEX credit_card_invoices_card_id_idx ON credit_card_invoices(credit_card_id);
CREATE INDEX transactions_credit_card_id_idx ON transactions(credit_card_id);

-- ====================================
-- VERIFICAÇÃO
-- ====================================
-- Execute estas queries para verificar se tudo foi criado:
-- SELECT * FROM credit_cards;
-- SELECT * FROM credit_card_invoices;
-- SELECT * FROM transactions LIMIT 1;
