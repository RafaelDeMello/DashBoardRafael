import { Clock, TrendingDown, TrendingUp, CreditCard } from 'lucide-react'

export default function SummaryCards({ transactions, categories, gender, creditCards = [] }) {
  const isFeminino = gender === 'feminino'
  
  // Calcula o total gasto
  const totalSpent = transactions.reduce((sum, t) => sum + t.value, 0)

  // Calcula o total do mês atual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyTransactions = transactions.filter((t) => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + t.value, 0)

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
  const textPrimary = isFeminino ? 'text-pink-700' : 'text-slate-700'
  const textSecondary = isFeminino ? 'text-rose-600' : 'text-slate-600'

  const cards = [
    {
      title: 'Total Gasto',
      value: `R$ ${totalSpent.toFixed(2)}`,
      icon: TrendingDown,
      gradient: primaryColor,
      subtext: `${transactionCount} transações`,
    },
    {
      title: 'Este Mês',
      value: `R$ ${monthlyTotal.toFixed(2)}`,
      icon: Clock,
      gradient: secondaryColor,
      subtext: `${monthlyTransactions.length} despesas`,
    },
    {
      title: 'Cartões de Crédito',
      value: `R$ ${creditCardTotal.toFixed(2)}`,
      icon: CreditCard,
      gradient: tertiaryColor,
      subtext: `${monthlyTransactions.filter((t) => t.credit_card_id).length} em cartão`,
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

