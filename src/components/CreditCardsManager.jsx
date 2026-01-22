import { useState, useEffect } from 'react'
import useStore from '../storeSupabase'

export default function CreditCardsManager({ gender = 'masculino' }) {
  const { creditCards, loadCreditCards, addCreditCard, deleteCreditCard, user } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    limit_amount: '',
    closing_day: '20',
    due_day: '27',
    color: '#475569',
  })
  const [loading, setLoading] = useState(false)

  const isFeminino = gender?.toLowerCase().includes('fem')

  // Cores predefinidas
  const colorOptions = [
    { value: '#475569', label: 'Cinza', hex: '#475569' },
    { value: '#ec4899', label: 'Rosa', hex: '#ec4899' },
    { value: '#0ea5e9', label: 'Azul', hex: '#0ea5e9' },
    { value: '#06b6d4', label: 'Ciano', hex: '#06b6d4' },
    { value: '#10b981', label: 'Verde', hex: '#10b981' },
    { value: '#f59e0b', label: 'Âmbar', hex: '#f59e0b' },
  ]

  useEffect(() => {
    if (user?.id) {
      loadCreditCards(user.id)
    }
  }, [user?.id, loadCreditCards])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar campos
    if (!formData.name.trim()) {
      alert('Nome do cartão é obrigatório')
      return
    }
    
    if (formData.name.length > 50) {
      alert('Nome do cartão não pode ter mais de 50 caracteres')
      return
    }
    
    if (!formData.limit_amount) {
      alert('Limite do cartão é obrigatório')
      return
    }
    
    const limitValue = parseFloat(formData.limit_amount)
    if (isNaN(limitValue) || limitValue <= 0) {
      alert('Limite deve ser um valor maior que zero')
      return
    }
    
    if (limitValue > 999999.99) {
      alert('Limite não pode exceder R$ 999.999,99')
      return
    }
    
    const closingDay = parseInt(formData.closing_day)
    const dueDay = parseInt(formData.due_day)
    
    if (closingDay < 1 || closingDay > 28) {
      alert('Dia do fechamento deve estar entre 1 e 28')
      return
    }
    
    if (dueDay < 1 || dueDay > 28) {
      alert('Dia do vencimento deve estar entre 1 e 28')
      return
    }
    
    setLoading(true)
    try {
      await addCreditCard({
        name: formData.name.trim(),
        limit_amount: limitValue,
        closing_day: closingDay,
        due_day: dueDay,
        color: formData.color,
      })
      setFormData({
        name: '',
        limit_amount: '',
        closing_day: '20',
        due_day: '27',
        color: '#475569',
      })
      setShowForm(false)
      alert('Cartão adicionado com sucesso!')
    } catch (err) {
      console.error('Erro ao adicionar cartão:', err)
      alert('Erro ao adicionar cartão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (cardId) => {
    if (confirm('Tem certeza que deseja deletar este cartão? Esta ação não pode ser desfeita.')) {
      try {
        await deleteCreditCard(cardId)
        alert('Cartão deletado com sucesso!')
      } catch (err) {
        console.error('Erro ao deletar cartão:', err)
        alert('Erro ao deletar cartão. Tente novamente.')
      }
    }
  }

  const primaryGradient = isFeminino
    ? 'from-pink-400 to-rose-500'
    : 'from-slate-400 to-slate-600'
  const borderColor = isFeminino ? 'border-pink-300' : 'border-slate-300'
  const bgHover = isFeminino ? 'hover:bg-pink-50' : 'hover:bg-slate-50'
  const textPrimary = isFeminino ? 'text-pink-600' : 'text-slate-600'
  const buttonBg = isFeminino ? 'bg-pink-500 hover:bg-pink-600' : 'bg-slate-600 hover:bg-slate-700'

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>💳 Cartões de Crédito</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus cartões e visualize as faturas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`${buttonBg} text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105`}
        >
          {showForm ? '✕ Cancelar' : '+ Adicionar Cartão'}
        </button>
      </div>

      {/* Formulário de Adição */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`bg-gradient-to-br ${primaryGradient} p-6 rounded-lg shadow-lg border-2 ${borderColor} space-y-4`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Cartão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Cartão</label>
              <input
                type="text"
                placeholder="ex: Itaú Visa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            {/* Limite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Limite (R$)</label>
              <input
                type="number"
                placeholder="5000"
                value={formData.limit_amount}
                onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                step="0.01"
                required
              />
            </div>

            {/* Dia Fechamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dia do Fechamento</label>
              <input
                type="number"
                min="1"
                max="28"
                value={formData.closing_day}
                onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Dia Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="28"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Cor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Cartão</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-12 h-12 rounded-lg border-4 transition-all ${
                      formData.color === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 font-bold py-2 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {loading ? 'Adicionando...' : 'Adicionar Cartão'}
          </button>
        </form>
      )}

      {/* Lista de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {creditCards.length === 0 ? (
          <div className={`col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed ${borderColor}`}>
            <p className={`${textPrimary} font-medium`}>Nenhum cartão adicionado ainda</p>
            <p className="text-gray-500 text-sm">Clique em "Adicionar Cartão" para começar</p>
          </div>
        ) : (
          creditCards.map((card) => (
            <div
              key={card.id}
              className={`rounded-lg p-6 text-white shadow-lg transform transition-all hover:scale-105 border-2`}
              style={{
                backgroundColor: card.color,
                borderColor: card.color,
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{card.name}</h3>
                  <p className="text-sm opacity-90">💳 Cartão de Crédito</p>
                </div>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm font-medium transition-all"
                >
                  🗑️ Deletar
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="opacity-90">Limite:</span>
                  <span className="font-bold">R$ {parseFloat(card.limit_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Fechamento:</span>
                  <span className="font-bold">Dia {card.closing_day}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Vencimento:</span>
                  <span className="font-bold">Dia {card.due_day}</span>
                </div>
                <div className="pt-2 border-t border-white border-opacity-30">
                  <p className="text-xs opacity-75">
                    Criado em {new Date(card.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
