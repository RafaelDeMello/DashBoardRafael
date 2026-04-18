import { useState, useEffect } from 'react'
import useStore from '../storeSupabase'

const defaultTheme = { primary: '#475569', secondary: '#1e293b', accent: 'slate', button: 'bg-slate-600 hover:bg-slate-700', border: 'border-slate-300', text: 'text-slate-600', hover: 'hover:bg-slate-50' }

export default function InvoicesPanel({ theme = defaultTheme }) {
  const { creditCards, creditCardInvoices, loadInvoices, markInvoicePaid, transactions, user } = useStore()
  const [selectedCard, setSelectedCard] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)

  const textPrimary = `text-${theme.accent}-600`
  const buttonBg = theme.button
  const borderColor = `border-${theme.accent}-300`

  // Selecionar primeiro cartão por padrão
  useEffect(() => {
    if (creditCards.length > 0 && !selectedCard) {
      setSelectedCard(creditCards[0].id)
    }
  }, [creditCards, selectedCard])

  // Carregar faturas quando mudar o cartão
  useEffect(() => {
    if (selectedCard) {
      loadInvoices(selectedCard).then((data) => {
        setInvoices(data || [])
      })
    }
  }, [selectedCard, loadInvoices])

  // Calcular total de transações para um cartão em um mês/ano
  const getMonthTotal = (cardId, month, year) => {
    return transactions
      .filter((t) => {
        if (t.credit_card_id !== cardId) return false
        const date = new Date(t.date)
        return date.getMonth() + 1 === month && date.getFullYear() === year
      })
      .reduce((sum, t) => sum + t.value, 0)
  }

  if (creditCards.length === 0) {
    return (
      <div className={`text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed ${borderColor}`}>
        <p className={`${textPrimary} font-medium`}>Nenhum cartão adicionado</p>
        <p className="text-gray-500 text-sm">Adicione um cartão para visualizar as faturas</p>
      </div>
    )
  }

  const selectedCardData = creditCards.find((c) => c.id === selectedCard)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentMonthTotal = getMonthTotal(selectedCard, currentMonth, currentYear)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className={`text-2xl font-bold ${textPrimary}`}>📄 Faturas</h2>
        <p className="text-sm text-gray-500 mt-1">Visualize e gerencie as faturas dos seus cartões</p>
      </div>

      {/* Seleção de Cartão */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Selecione um Cartão:</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {creditCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCard(card.id)}
              className={`p-4 rounded-lg text-white font-medium transition-all transform ${
                selectedCard === card.id ? 'ring-4 ring-offset-2 scale-105' : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: card.color,
              }}
            >
              {card.name}
              <div className="text-xs opacity-75 mt-1">Limite: R$ {parseFloat(card.limit_amount).toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Informações do Cartão Selecionado */}
      {selectedCardData && (
        <div className={`bg-gradient-to-r p-6 rounded-lg border-2 ${borderColor}`} style={{
          backgroundImage: `linear-gradient(135deg, ${selectedCardData.color}20, ${selectedCardData.color}10)`,
        }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Limite do Cartão</p>
              <p className="text-2xl font-bold" style={{ color: selectedCardData.color }}>
                R$ {parseFloat(selectedCardData.limit_amount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Fechamento</p>
              <p className="text-2xl font-bold" style={{ color: selectedCardData.color }}>
                Dia {selectedCardData.closing_day}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Vencimento</p>
              <p className="text-2xl font-bold" style={{ color: selectedCardData.color }}>
                Dia {selectedCardData.due_day}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fatura do Mês Atual */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className={`text-lg font-bold ${textPrimary} mb-4`}>
          Fatura de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        {selectedCard && (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <span className="text-gray-600 font-medium">Total em Despesas:</span>
              <span className="text-3xl font-bold text-green-600">
                R$ {currentMonthTotal.toFixed(2)}
              </span>
            </div>
            
            {currentMonthTotal === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma despesa neste mês</p>
            ) : (
              <div className="text-sm text-gray-600 space-y-2">
                <p>✓ Transações registradas: {transactions.filter(t => 
                  t.credit_card_id === selectedCard && 
                  new Date(t.date).getMonth() + 1 === currentMonth && 
                  new Date(t.date).getFullYear() === currentYear
                ).length}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nota Informativa */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Nota:</strong> As despesas aparecem aqui automaticamente quando você adiciona uma transação e seleciona este cartão. O total é calculado em tempo real!
        </p>
      </div>
    </div>
  )
}
