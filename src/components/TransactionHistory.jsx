import { Trash2, Edit2 } from 'lucide-react'

export default function TransactionHistory({
  transactions,
  categories,
  onDelete,
  onEdit,
  gender,
}) {
  const isFeminino = gender === 'feminino'
  const hoverBg = isFeminino ? 'hover:bg-pink-50' : 'hover:bg-slate-50'
  const accentColor = isFeminino ? 'text-pink-600' : 'text-slate-600'
  const headerBg = isFeminino ? 'bg-pink-50 border-pink-200' : 'bg-slate-50 border-slate-200'

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isFeminino ? 'bg-pink-100' : 'bg-slate-100'} mb-4`}>
          <span className="text-3xl">📊</span>
        </div>
        <p className={`text-lg font-semibold ${accentColor} mb-2`}>
          Nenhuma transação registrada
        </p>
        <p className="text-gray-500 text-sm">
          Adicione uma despesa para começar
        </p>
      </div>
    )
  }

  // Ordena por data mais recente
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className={`border-b-2 ${headerBg}`}>
            <th className={`text-left px-6 py-4 font-semibold ${accentColor} text-sm uppercase tracking-wide`}>
              Data
            </th>
            <th className={`text-left px-6 py-4 font-semibold ${accentColor} text-sm uppercase tracking-wide`}>
              Categoria
            </th>
            <th className={`text-left px-6 py-4 font-semibold ${accentColor} text-sm uppercase tracking-wide`}>
              Descrição
            </th>
            <th className={`text-right px-6 py-4 font-semibold ${accentColor} text-sm uppercase tracking-wide`}>
              Valor
            </th>
            <th className={`text-center px-6 py-4 font-semibold ${accentColor} text-sm uppercase tracking-wide`}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((transaction) => {
            const category = categories.find((c) => c.name === transaction.category)
            return (
              <tr
                key={transaction.id}
                className={`border-b ${hoverBg} transition-colors`}
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: category?.color || '#999' }}
                  >
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {transaction.description || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-sm font-bold ${accentColor}`}>
                    -R$ {transaction.value.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(transaction)}
                      className={`p-2 rounded-lg transition-colors ${isFeminino ? 'hover:bg-pink-100' : 'hover:bg-slate-100'}`}
                      title="Editar"
                    >
                      <Edit2 size={18} className={accentColor} />
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                      title="Deletar"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

