import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import SummaryCards from './SummaryCards'
import TransactionForm from './TransactionForm'
import TransactionHistory from './TransactionHistory'
import TabContent from './TabContent'
import ChartsDashboard from './Charts'
import EditTransactionForm from './EditTransactionForm'
import CreditCardsManager from './CreditCardsManager'
import InvoicesPanel from './InvoicesPanel'
import useStore from '../storeSupabase'

export default function Dashboard({ user, gender, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [successMessage, setSuccessMessage] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [localGender, setLocalGender] = useState(gender)
  const [localAvatarUrl, setLocalAvatarUrl] = useState(null)
  
  // Tema baseado no gênero
  const isFeminino = localGender === 'feminino'
  const bgColor = isFeminino ? 'bg-pink-50' : 'bg-slate-50'
  const sidebarBg = isFeminino ? 'bg-gradient-to-b from-pink-700 to-pink-800' : 'bg-gradient-to-b from-slate-800 to-slate-900'
  const accentColor = isFeminino ? 'text-pink-700' : 'text-slate-700'
  const buttonBg = isFeminino ? 'bg-pink-600 hover:bg-pink-700' : 'bg-slate-700 hover:bg-slate-800'
  const cardBg = isFeminino ? 'bg-pink-100' : 'bg-slate-100'
  
  const transactions = useStore((state) => state.transactions)
  const categories = useStore((state) => state.categories)
  const creditCards = useStore((state) => state.creditCards)
  const isLoading = useStore((state) => state.isLoading)
  const addTransaction = useStore((state) => state.addTransaction)
  const removeTransaction = useStore((state) => state.removeTransaction)
  const updateTransaction = useStore((state) => state.updateTransaction)
  const addCategory = useStore((state) => state.addCategory)
  const removeCategory = useStore((state) => state.removeCategory)
  const loadTransactions = useStore((state) => state.loadTransactions)
  const loadCategories = useStore((state) => state.loadCategories)
  const loadCreditCards = useStore((state) => state.loadCreditCards)
  const loadUserProfile = useStore((state) => state.loadUserProfile)

  // Carregar dados e perfil quando usuário muda
  useEffect(() => {
    if (user?.id) {
      // Carregar categorias e transações
      loadCategories(user.id)
      loadTransactions(user.id)
      loadCreditCards(user.id)
      
      // Carregar perfil em background (sem bloquear a UI)
      loadUserProfile(user.id).then(() => {
        const userProfile = useStore.getState().userProfile
        if (userProfile) {
          setLocalGender(userProfile.gender)
          setLocalAvatarUrl(userProfile.avatar_url)
          console.log('✓ Perfil carregado no Dashboard:', userProfile)
        }
      }).catch(err => {
        console.error('Erro ao carregar perfil:', err)
      })
    }
  }, [user?.id])

  const handleAddTransaction = async (transaction) => {
    try {
      await addTransaction(transaction)
      setSuccessMessage(transaction)
    } catch (error) {
      console.error('Erro ao adicionar transação:', error)
    }
  }

  const handleCloseSuccessModal = () => {
    setSuccessMessage(null)
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
  }

  const handleSaveEditTransaction = async (updatedTransaction) => {
    try {
      await updateTransaction(updatedTransaction.id, {
        date: updatedTransaction.date,
        category: updatedTransaction.category,
        value: updatedTransaction.value,
        description: updatedTransaction.description,
      })
      setEditingTransaction(null)
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
  }

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta transação?')) {
      try {
        await removeTransaction(id)
      } catch (error) {
        console.error('Erro ao deletar transação:', error)
      }
    }
  }

  const handleAddCategory = async (category) => {
    try {
      await addCategory(category)
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (
      window.confirm(
        'Tem certeza que deseja deletar esta categoria? As transações não serão deletadas.'
      )
    ) {
      try {
        await removeCategory(id)
      } catch (error) {
        console.error('Erro ao deletar categoria:', error)
      }
    }
  }

  return (
    <div className={`flex h-screen overflow-hidden ${bgColor}`}>
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
                className={`w-full text-white font-semibold py-2 rounded-lg transition-colors ${buttonBg}`}
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
        onLogout={onLogout}
        sidebarBg={sidebarBg}
        avatarUrl={localAvatarUrl}
        gender={localGender}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
              <SummaryCards transactions={transactions} categories={categories} gender={localGender} creditCards={creditCards} />

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
                gender={localGender}
              />
            </TabContent>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <TabContent title="Adicionar Despesa">
                <TransactionForm
                  categories={categories}
                  creditCards={creditCards}
                  onAddTransaction={handleAddTransaction}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              </TabContent>
            </div>
          )}

          {/* Credit Cards Tab */}
          {activeTab === 'credit_cards' && (
            <TabContent title="Gerenciar Cartões de Crédito">
              <CreditCardsManager gender={localGender} />
            </TabContent>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <TabContent title="Faturas">
              <InvoicesPanel gender={localGender} />
            </TabContent>
          )}
        </div>
      </main>
    </div>
  )
}

