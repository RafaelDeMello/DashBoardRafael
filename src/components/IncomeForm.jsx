import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

export default function IncomeForm({
  categories,
  onAddIncome,
  onAddCategory,
}) {
  // Filtrar apenas categorias de receita
  const incomeCategories = categories.filter((c) => c.type === 'income')

  const [formData, setFormData] = useState({
    category: incomeCategories[0]?.name || '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  // quando as categorias de receita mudam, atualizar categoria padrão caso a atual não exista
  useEffect(() => {
    if (incomeCategories.length > 0) {
      if (!incomeCategories.some((c) => c.name === formData.category)) {
        setFormData((prev) => ({ ...prev, category: incomeCategories[0].name }))
      }
    }
  }, [incomeCategories])

  const [errors, setErrors] = useState({})
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', color: '#10b981' })

  // abre criação de categoria automaticamente se nenhuma existir
  useEffect(() => {
    if (incomeCategories.length === 0) {
      setShowCategoryForm(true)
    }
  }, [incomeCategories])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleNewCatChange = (e) => {
    const { name, value } = e.target
    setNewCategory((prev) => ({ ...prev, [name]: value }))
  }

  const addNewCategory = (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) {
      alert('Nome da categoria é obrigatório')
      return
    }
    if (incomeCategories.some((cat) => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
      alert('Categoria já existe')
      return
    }
    console.log('➕ criando nova categoria de receita localmente:', newCategory)
    onAddCategory({ ...newCategory, type: 'income' })
    setFormData((prev) => ({ ...prev, category: newCategory.name }))
    setNewCategory({ name: '', color: '#10b981' })
    setShowCategoryForm(false)
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
        newErrors.date = 'Não é possível adicionar receitas futuras'
      }
    }

    if (formData.description && formData.description.length > 255) {
      newErrors.description = 'Descrição não pode ter mais de 255 caracteres'
    }

    setErrors(newErrors)
    console.log('🔧 validação - erros:', newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    console.log('📝 Formulário de receita enviado')
    console.log('Dados do formulário:', formData)

    if (!validateForm()) {
      console.log('❌ Validação falhou')
      return
    }

    console.log('✓ Validação passou, chamando onAddIncome')
    onAddIncome({
      ...formData,
      value: parseFloat(formData.value),
      category: formData.category,
    })

    setFormData({
      category: incomeCategories[0]?.name || '',
      value: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    })
  }

  return (
    <div className="space-y-6">
      {/* Income Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-green-600 mb-4">💵 Adicionar Receita</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
              <div className="flex gap-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                >
                  {incomeCategories.length === 0 && <option value="">Sem categorias de receita</option>}
                  {incomeCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(true)}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.value ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
                }`}
              />
              {errors.value && <p className="text-red-600 text-xs mt-1">{errors.value}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (opcional) {formData.description.length}/255</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ex: Salário mensal..."
                maxLength="255"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
                }`}
              />
              {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Adicionar Receita
          </button>
        </form>

        {/* new category form */}
        {showCategoryForm && (
          <form onSubmit={addNewCategory} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={handleNewCatChange}
                  placeholder="Nome da categoria"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <input
                  type="color"
                  name="color"
                  value={newCategory.color}
                  onChange={handleNewCatChange}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Salvar categoria
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
