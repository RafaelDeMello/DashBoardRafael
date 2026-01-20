import { Trash2, Edit2 } from 'lucide-react'

export default function TransactionHistory({
  transactions,
  categories,
  onDelete,
  onEdit,
}) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhuma transação registrada</p>
        <p className="text-gray-400 text-sm mt-2">
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              Data
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              Categoria
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              Descrição
            </th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">
              Valor
            </th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">
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
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-700">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: category?.color || '#808080' }}
                  >
                    {transaction.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {transaction.description || '-'}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">
                  -R$ {transaction.value.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors mr-2"
                  >
                    <Edit2 size={16} />
                    <span className="text-sm">Editar</span>
                  </button>
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">Deletar</span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

