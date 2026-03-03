import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function TransactionForm({
  categories,
  creditCards = [],
  onAddTransaction,
  onAddCategory,
  onDeleteCategory,
}) {
  const [formData, setFormData] = useState({
    category: categories.filter(c => !c.type || c.type === 'expense')[0]?.name || '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    credit_card_id: null,
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3b82f6',
  })

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [errors, setErrors] = useState({})

  // Filtrar apenas categorias de despesa
  const expenseCategories = categories.filter(c => !c.type || c.type === 'expense')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpar erro ao usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target
    setNewCategory((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.value) {
      newErrors.value = 'Valor é obrigatório'
    } else if (isNaN(parseFloat(formData.value))) {
      newErrors.value = 'Valor deve ser um número válido'
    } else if (parseFloat(formData.value) <= 0) {
      newErrors.value = 'Valor deve ser maior que zero'
    } else if (parseFloat(formData.value) > 999999.99) {
      newErrors.value = 'Valor não pode exceder R$ 999.999,99'
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória'
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate > today) {
        newErrors.date = 'Não é possível adicionar despesas futuras'
      }
    }

    if (formData.description && formData.description.length > 255) {
      newErrors.description = 'Descrição não pode ter mais de 255 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onAddTransaction({
      ...formData,
      value: parseFloat(formData.value),
      type: 'expense',
    })

    setFormData({
      category: expenseCategories[0]?.name || '',
      value: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      credit_card_id: null,
    })
  }

  const handleAddCategory = (e) => {
    e.preventDefault()
    
    // Validações
    if (!newCategory.name.trim()) {
      alert('Por favor, digite um nome para a categoria')
      return
    }

    if (newCategory.name.length > 50) {
      alert('Nome da categoria não pode ter mais de 50 caracteres')
      return
    }

    // Verificar se categoria já existe
    if (categories.some((cat) => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
      alert('Essa categoria já existe')
      return
    }

    onAddCategory({
      ...newCategory,
      type: 'expense',
    })
    setNewCategory({
      name: '',
      color: '#3b82f6',
    })
    setShowCategoryForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Transaction Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Adicionar Despesa
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.value
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-slate-700'
                }`}
              />
              {errors.value && (
                <p className="text-red-600 text-xs mt-1">{errors.value}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional) {formData.description.length}/255
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ex: Supermercado..."
                maxLength="255"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.description
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-slate-700'
                }`}
              />
              {errors.description && (
                <p className="text-red-600 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Credit Card (if available) */}
            {creditCards.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pagar com (opcional)
                </label>
                <select
                  name="credit_card_id"
                  value={formData.credit_card_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_card_id: e.target.value ? e.target.value : null,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">💰 Dinheiro / Débito</option>
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      💳 {card.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Adicionar Despesa
          </button>
        </form>
      </div>
    </div>
  )
}

