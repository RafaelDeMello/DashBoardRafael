import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import SummaryCards from './SummaryCards'
import TransactionForm from './TransactionForm'
import TransactionHistory from './TransactionHistory'
import TabContent from './TabContent'
import ChartsDashboard from './Charts'
import EditTransactionForm from './EditTransactionForm'
import { encryptData, decryptData } from '../utils/encryption'

export default function Dashboard({ password, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [successMessage, setSuccessMessage] = useState(null)
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [categories, setCategories] = useState([
    { id: '1', name: 'Aluguel', color: '#475569', isFixed: true },
    { id: '2', name: 'Alimentação', color: '#1e293b', isFixed: false },
    { id: '3', name: 'Saúde/Academia', color: '#0f172a', isFixed: false },
    { id: '4', name: 'Gasolina', color: '#334155', isFixed: false },
    { id: '5', name: 'Outros', color: '#64748b', isFixed: false },
  ])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem('dash-transactions')
      const savedCategories = localStorage.getItem('dash-categories')

      if (savedTransactions) {
        try {
          const decrypted = decryptData(savedTransactions, password)
          if (decrypted) {
            setTransactions(decrypted)
          } else {
            setTransactions([])
          }
        } catch (e) {
          // Se não conseguir descriptografar, trata como JSON simples (compatibilidade com versão antiga)
          setTransactions(JSON.parse(savedTransactions))
        }
      }
      if (savedCategories) {
        try {
          const decrypted = decryptData(savedCategories, password)
          if (decrypted) {
            setCategories(decrypted)
          }
        } catch (e) {
          // Se não conseguir descriptografar, trata como JSON simples
          setCategories(JSON.parse(savedCategories))
        }
      }
      setIsLoaded(true)
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error)
      setIsLoaded(true)
    }
  }, [password])

  // Save transactions to localStorage (criptografado)
  useEffect(() => {
    if (isLoaded) {
      const encrypted = encryptData(transactions, password)
      if (encrypted) {
        localStorage.setItem('dash-transactions', encrypted)
      }
    }
  }, [transactions, isLoaded, password])

  // Save categories to localStorage (criptografado)
  useEffect(() => {
    if (isLoaded) {
      const encrypted = encryptData(categories, password)
      if (encrypted) {
        localStorage.setItem('dash-categories', encrypted)
      }
    }
  }, [categories, isLoaded, password])

  const handleAddTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }
    setTransactions((prev) => [...prev, newTransaction])
    
    // Mostrar modal de sucesso
    setSuccessMessage(newTransaction)
  }

  const handleCloseSuccessModal = () => {
    if (successMessage) {
      setRecentlyAdded((prev) => [successMessage, ...prev])
    }
    setSuccessMessage(null)
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
  }

  const handleSaveEditTransaction = (updatedTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    )
    // Atualizar também na lista de recentes se estiver lá
    setRecentlyAdded((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    )
    setEditingTransaction(null)
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
  }

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta transação?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      // Remove também da lista de recentemente adicionadas
      setRecentlyAdded((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const handleAddCategory = (category) => {
    setCategories((prev) => [
      ...prev,
      {
        ...category,
        id: Date.now().toString(),
        isFixed: false,
      },
    ])
  }

  const handleDeleteCategory = (id) => {
    if (
      window.confirm(
        'Tem certeza que deseja deletar esta categoria? As transações não serão deletadas.'
      )
    ) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const handleImportData = (data) => {
    // Adicionar IDs aos transactions e categories se não tiverem
    const importedTransactions = data.transactions.map((t) => ({
      ...t,
      id: t.id || Date.now().toString(),
    }))

    const importedCategories = data.categories.map((c) => ({
      ...c,
      id: c.id || Date.now().toString(),
    }))

    setTransactions(importedTransactions)
    setCategories(importedCategories)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-600 mb-6">Despesa adicionada com sucesso!</h2>
              
              <div className="bg-slate-50 p-4 rounded-lg mb-6 text-left space-y-3">
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Categoria:</span>
                  <span className="ml-2 text-gray-900">{successMessage.category}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Valor:</span>
                  <span className="ml-2 text-gray-900 font-bold text-lg">R$ {successMessage.value.toFixed(2)}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Data:</span>
                  <span className="ml-2 text-gray-900">{new Date(successMessage.date).toLocaleDateString('pt-BR')}</span>
                </p>
                {successMessage.description && (
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Descrição:</span>
                    <span className="ml-2 text-gray-900">{successMessage.description}</span>
                  </p>
                )}
              </div>

              <button
                onClick={handleCloseSuccessModal}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Despesa</h2>
            <EditTransactionForm
              transaction={editingTransaction}
              categories={categories}
              onSave={handleSaveEditTransaction}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        transactions={transactions}
        categories={categories}
        onImport={handleImportData}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
              <SummaryCards transactions={transactions} categories={categories} />

              {/* Charts Section */}
              <ChartsDashboard transactions={transactions} categories={categories} />
            </>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <TabContent title="Histórico de Despesas">
              <TransactionHistory
                transactions={transactions}
                categories={categories}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
              />
            </TabContent>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <TabContent title="Adicionar Despesa">
                <TransactionForm
                  categories={categories}
                  onAddTransaction={handleAddTransaction}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              </TabContent>

              {/* Recently Added */}
              {recentlyAdded.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Despesas Adicionadas Recentemente</h3>
                  <div className="space-y-3">
                    {recentlyAdded.map((item) => {
                      const cat = categories.find((c) => c.name === item.category)
                      return (
                        <div key={item.id} className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: cat?.color }}
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{item.category}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(item.date).toLocaleDateString('pt-BR')} 
                                {item.description ? ` • ${item.description}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-slate-300">R$ {item.value.toFixed(2)}</p>
                            <button
                              onClick={() => setActiveTab('transactions')}
                              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                              Ver Despesas →
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

