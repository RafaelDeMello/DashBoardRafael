import { Clock, TrendingDown, TrendingUp, CreditCard, DollarSign } from 'lucide-react'

export default function SummaryCards({ transactions, categories, gender, creditCards = [] }) {
  const isFeminino = gender === 'feminino'
  
  // Calcula total de despesas
  const totalExpenses = transactions
    .filter(t => !t.type || t.type === 'expense')
    .reduce((sum, t) => sum + t.value, 0)

  // Calcula total de receitas
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.value, 0)

  // Calcula saldo
  const balance = totalIncome - totalExpenses

  // Calcula o total do mês atual (despesas)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyTransactions = transactions.filter((t) => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const monthlyExpenses = monthlyTransactions
    .filter(t => !t.type || t.type === 'expense')
    .reduce((sum, t) => sum + t.value, 0)

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.value, 0)

  // Calcula total em cartões de crédito (mês atual)
  const creditCardTotal = monthlyTransactions
    .filter((t) => t.credit_card_id)
    .reduce((sum, t) => sum + t.value, 0)

  // Número de transações
  const transactionCount = transactions.length

  // Cores baseadas no gênero
  const primaryColor = isFeminino ? 'from-pink-500 to-pink-600' : 'from-slate-600 to-slate-700'
  const secondaryColor = isFeminino ? 'from-rose-400 to-rose-500' : 'from-slate-500 to-slate-600'
  const tertiaryColor = isFeminino ? 'from-purple-400 to-purple-500' : 'from-slate-700 to-slate-800'
  const successColor = 'from-green-500 to-green-600'
  const textPrimary = isFeminino ? 'text-pink-700' : 'text-slate-700'
  const textSecondary = isFeminino ? 'text-rose-600' : 'text-slate-600'

  const cards = [
    {
      title: 'Saldo Total',
      value: `R$ ${balance.toFixed(2)}`,
      icon: DollarSign,
      gradient: balance >= 0 ? successColor : primaryColor,
      subtext: `Receitas: R$ ${totalIncome.toFixed(2)}`,
    },
    {
      title: 'Este Mês',
      value: `R$ ${(monthlyIncome - monthlyExpenses).toFixed(2)}`,
      icon: Clock,
      gradient: secondaryColor,
      subtext: `Receita: R$ ${monthlyIncome.toFixed(2)} | Despesa: R$ ${monthlyExpenses.toFixed(2)}`,
    },
    {
      title: 'Total Gasto',
      value: `R$ ${totalExpenses.toFixed(2)}`,
      icon: TrendingDown,
      gradient: tertiaryColor,
      subtext: `${transactionCount} transações`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium uppercase tracking-wide mb-2">
                  {card.title}
                </p>
                <p className="text-4xl font-bold mb-3">
                  {card.value}
                </p>
                <p className="text-white/70 text-xs">
                  {card.subtext}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-full p-4">
                <IconComponent size={28} className="text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

