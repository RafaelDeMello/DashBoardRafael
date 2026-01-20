import { useState } from 'react'
import { X } from 'lucide-react'

export default function EditTransactionForm({
  transaction,
  categories,
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    category: transaction.category,
    value: transaction.value,
    date: transaction.date,
    description: transaction.description || '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || '' : value,
    }))
    // Limpar erro
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.value || formData.value === '') {
      newErrors.value = 'Valor é obrigatório'
    } else if (parseFloat(formData.value) <= 0) {
      newErrors.value = 'Valor deve ser maior que zero'
    } else if (parseFloat(formData.value) > 999999.99) {
      newErrors.value = 'Valor muito alto'
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória'
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória'
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

    onSave({
      ...transaction,
      ...formData,
      value: parseFloat(formData.value),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-slate-700 transition-colors"
        >
          {categories.map((cat) => (
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
          onChange={handleChange}
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
          onChange={handleChange}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-slate-700 transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição (opcional)
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Ex: Supermercado..."
          maxLength="255"
          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
            errors.description
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-300 focus:border-slate-700'
          }`}
        />
        <div className="flex justify-between items-start mt-1">
          {errors.description && (
            <p className="text-red-600 text-xs">{errors.description}</p>
          )}
          <p className="text-gray-500 text-xs ml-auto">
            {formData.description.length}/255
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          Salvar Alterações
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

