import { create } from 'zustand'
import { supabase } from './lib/supabaseClient'

const useStore = create((set, get) => ({
  transactions: [],
  categories: [],
  user: null,
  userProfile: null,
  isLoading: false,
  error: null,

  // Definir usuário logado
  setUser: (user) => set({ user }),

  // Carregar perfil do usuário (com gênero)
  loadUserProfile: async (userId) => {
    if (!userId) {
      console.warn('⚠ userId não fornecido')
      return
    }

    try {
      console.log('📥 Carregando perfil para:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        return
      }

      console.log('✓ Perfil carregado com sucesso:', data)
      set({ userProfile: data })
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    }
  },
  loadCategories: async (userId) => {
    if (!userId) return

    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      set({
        categories: data || [],
        isLoading: false,
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  // Carregar transações do Supabase
  loadTransactions: async (userId) => {
    if (!userId) {
      console.warn('⚠ userId não fornecido para loadTransactions')
      return
    }

    set({ isLoading: true, error: null })
    try {
      console.log('📥 Carregando transações para:', userId)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar transações:', error)
        throw error
      }

      console.log('✓ Transações carregadas:', data?.length || 0, 'itens')
      console.log('Dados:', data)

      set({
        transactions: data || [],
        isLoading: false,
      })
    } catch (err) {
      console.error('💥 Erro ao carregar transações:', err)
      set({ error: err.message, isLoading: false })
    }
  },

  // Adicionar transação
  addTransaction: async (transaction) => {
    let user = get().user
    
    // Se não houver user na store, buscar do Supabase
    if (!user) {
      console.log('📝 User não está na store, buscando do Supabase...')
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    }
    
    if (!user) {
      console.warn('⚠ Sem usuário para adicionar transação')
      return
    }

    try {
      console.log('📝 Adicionando transação:', transaction)
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            date: transaction.date,
            category: transaction.category,
            value: transaction.value,
            description: transaction.description || '',
            credit_card_id: transaction.credit_card_id || null,
          },
        ])
        .select()

      if (error) {
        console.error('❌ Erro ao inserir transação:', error)
        throw error
      }

      console.log('✓ Transação inserida:', data[0])
      
      // Se a transação é de cartão de crédito, atualizar a fatura
      if (transaction.credit_card_id) {
        const date = new Date(transaction.date)
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        
        console.log('💳 Atualizando fatura do cartão:', transaction.credit_card_id)
        // Buscar fatura existente
        const { data: invoices, error: invoiceError } = await supabase
          .from('credit_card_invoices')
          .select('id, total_amount')
          .eq('credit_card_id', transaction.credit_card_id)
          .eq('month', month)
          .eq('year', year)
        
        if (!invoiceError && invoices && invoices.length > 0) {
          // Atualizar fatura existente
          const newTotal = invoices[0].total_amount + transaction.value
          await supabase
            .from('credit_card_invoices')
            .update({ total_amount: newTotal })
            .eq('id', invoices[0].id)
          console.log('✓ Fatura atualizada com novo total:', newTotal)
        } else {
          // Criar nova fatura
          await supabase
            .from('credit_card_invoices')
            .insert([
              {
                credit_card_id: transaction.credit_card_id,
                month: month,
                year: year,
                total_amount: transaction.value,
                paid: false,
              },
            ])
          console.log('✓ Nova fatura criada')
        }
      }
      
      set((state) => ({
        transactions: [data[0], ...state.transactions],
      }))
      
      // Recarregar transações para garantir sincronização
      console.log('🔄 Recarregando transações...')
      await get().loadTransactions(user.id)
    } catch (err) {
      console.error('💥 Erro ao adicionar transação:', err)
      set({ error: err.message })
      throw err
    }
  },

  // Remover transação
  removeTransaction: async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  // Atualizar transação
  updateTransaction: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error

      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? data[0] : t
        ),
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  // Adicionar categoria
  addCategory: async (category) => {
    let user = get().user
    
    // Se não houver user na store, buscar do Supabase
    if (!user) {
      console.log('📝 User não está na store, buscando do Supabase...')
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    }
    
    if (!user) {
      console.warn('⚠ Sem usuário para adicionar categoria')
      return
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            user_id: user.id,
            name: category.name,
            color: category.color,
            is_fixed: category.isFixed || false,
          },
        ])
        .select()

      if (error) throw error

      set((state) => ({
        categories: [...state.categories, data[0]],
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  // Remover categoria
  removeCategory: async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  // Obter transações por mês
  getTransactionsByMonth: (year, month) => {
    return get().transactions.filter((t) => {
      const date = new Date(t.date)
      return date.getFullYear() === year && date.getMonth() === month
    })
  },

  // Obter total por categoria
  getTotalByCategory: () => {
    const totals = {}
    get().transactions.forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.value
    })
    return totals
  },

  // ====================================
  // FUNÇÕES DE CARTÕES DE CRÉDITO
  // ====================================
  creditCards: [],
  creditCardInvoices: [],

  // Carregar cartões do usuário
  loadCreditCards: async (userId) => {
    if (!userId) return

    set({ isLoading: true, error: null })
    try {
      console.log('📥 Carregando cartões para:', userId)
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log('✓ Cartões carregados:', data)
      set({ creditCards: data, isLoading: false })
    } catch (err) {
      console.error('❌ Erro ao carregar cartões:', err)
      set({ error: err.message, isLoading: false })
    }
  },

  // Adicionar novo cartão
  addCreditCard: async (cardData) => {
    try {
      let userId = get().user?.id
      if (!userId) {
        const { data: authData } = await supabase.auth.getUser()
        userId = authData?.user?.id
      }

      if (!userId) throw new Error('Sem usuário autenticado')

      console.log('💳 Adicionando novo cartão:', cardData.name)
      const { data, error } = await supabase
        .from('credit_cards')
        .insert([{ ...cardData, user_id: userId }])
        .select()

      if (error) throw error

      console.log('✓ Cartão adicionado:', data[0])
      await get().loadCreditCards(userId)
      return data[0]
    } catch (err) {
      console.error('❌ Erro ao adicionar cartão:', err)
      set({ error: err.message })
      throw err
    }
  },

  // Atualizar cartão
  updateCreditCard: async (cardId, updates) => {
    try {
      console.log('✏️ Atualizando cartão:', cardId)
      const { data, error } = await supabase
        .from('credit_cards')
        .update(updates)
        .eq('id', cardId)
        .select()

      if (error) throw error

      console.log('✓ Cartão atualizado:', data[0])
      const userId = get().user?.id
      if (userId) await get().loadCreditCards(userId)
      return data[0]
    } catch (err) {
      console.error('❌ Erro ao atualizar cartão:', err)
      set({ error: err.message })
      throw err
    }
  },

  // Deletar cartão (soft delete - apenas marca como inativo)
  deleteCreditCard: async (cardId) => {
    try {
      console.log('🗑️ Deletando cartão:', cardId)
      await get().updateCreditCard(cardId, { is_active: false })
      console.log('✓ Cartão deletado')
    } catch (err) {
      console.error('❌ Erro ao deletar cartão:', err)
      throw err
    }
  },

  // Carregar faturas de um cartão
  loadInvoices: async (cardId) => {
    try {
      console.log('📄 Carregando faturas para cartão:', cardId)
      const { data, error } = await supabase
        .from('credit_card_invoices')
        .select('*')
        .eq('credit_card_id', cardId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) throw error

      console.log('✓ Faturas carregadas:', data)
      set({ creditCardInvoices: data })
      return data
    } catch (err) {
      console.error('❌ Erro ao carregar faturas:', err)
      set({ error: err.message })
      return []
    }
  },

  // Marcar fatura como paga
  markInvoicePaid: async (invoiceId) => {
    try {
      console.log('💰 Marcando fatura como paga:', invoiceId)
      const { data, error } = await supabase
        .from('credit_card_invoices')
        .update({ paid: true, paid_date: new Date().toISOString() })
        .eq('id', invoiceId)
        .select()

      if (error) throw error

      console.log('✓ Fatura marcada como paga')
      // Recarregar faturas
      const card = get().creditCards[0]
      if (card) await get().loadInvoices(card.id)
      return data[0]
    } catch (err) {
      console.error('❌ Erro ao marcar fatura como paga:', err)
      set({ error: err.message })
      throw err
    }
  },

  // Calcular fatura do mês atual
  getMonthInvoice: (cardId) => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    return get().creditCardInvoices.find(
      (inv) => inv.credit_card_id === cardId && inv.month === month && inv.year === year
    )
  },

  // Limpar dados (logout)
  clearData: () => {
    set({
      transactions: [],
      categories: [],
      creditCards: [],
      creditCardInvoices: [],
      user: null,
      error: null,
    })
  },
}))

export default useStore
