import { Clock, TrendingDown, TrendingUp } from 'lucide-react'

export default function SummaryCards({ transactions, categories }) {
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

  // Número de transações
  const transactionCount = transactions.length

  const cards = [
    {
      title: 'Total Gasto',
      value: `R$ ${totalSpent.toFixed(2)}`,
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200',
    },
    {
      title: 'Este Mês',
      value: `R$ ${monthlyTotal.toFixed(2)}`,
      icon: Clock,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <div
            key={index}
            className={`p-6 rounded-lg border-2 ${card.borderColor} bg-white shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <IconComponent size={24} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

