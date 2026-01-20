import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      transactions: [],
      categories: [
        { id: '1', name: 'Aluguel', color: '#1e293b', isFixed: true },
        { id: '2', name: 'Alimentação', color: '#334155', isFixed: false },
        { id: '3', name: 'Saúde/Academia', color: '#475569', isFixed: false },
        { id: '4', name: 'Gasolina', color: '#64748b', isFixed: false },
      ],

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...transaction, id: Date.now().toString(), timestamp: Date.now() },
          ],
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...category, id: Date.now().toString(), isFixed: false },
          ],
        })),

      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      getTransactionsByMonth: (year, month) =>
        set.getState().transactions.filter((t) => {
          const date = new Date(t.date)
          return date.getFullYear() === year && date.getMonth() === month
        }),

      getTotalByCategory: () => {
        const totals = {}
        set.getState().transactions.forEach((t) => {
          totals[t.category] = (totals[t.category] || 0) + t.value
        })
        return totals
      },
    }),
    {
      name: 'dash-store',
    }
  )
)

export default useStore

