import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import SummaryCards from './SummaryCards'
import TabContent from './TabContent'
import ChartsDashboard from './Charts'
import CreditCardsManager from './CreditCardsManager'
import InvoicesPanel from './InvoicesPanel'
import useStore from '../storeSupabase'

export default function Dashboard({ user, gender, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [localGender, setLocalGender] = useState(gender)
  const [localAvatarUrl, setLocalAvatarUrl] = useState(null)
  
  // Tema baseado no gênero
  const isFeminino = localGender === 'feminino'
  const bgColor = isFeminino ? 'bg-pink-50' : 'bg-slate-50'
  const sidebarBg = isFeminino ? 'bg-gradient-to-b from-pink-700 to-pink-800' : 'bg-gradient-to-b from-slate-800 to-slate-900'
  
  const transactions = useStore((state) => state.transactions)
  const categories = useStore((state) => state.categories)
  const creditCards = useStore((state) => state.creditCards)
  const loadTransactions = useStore((state) => state.loadTransactions)
  const loadCategories = useStore((state) => state.loadCategories)
  const loadCreditCards = useStore((state) => state.loadCreditCards)
  const loadUserProfile = useStore((state) => state.loadUserProfile)

  // Carregar dados e perfil quando usuário muda
  useEffect(() => {
    if (user?.id) {
      loadCategories(user.id)
      loadTransactions(user.id)
      loadCreditCards(user.id)
      
      loadUserProfile(user.id).then(() => {
        const userProfile = useStore.getState().userProfile
        if (userProfile) {
          setLocalGender(userProfile.gender)
          setLocalAvatarUrl(userProfile.avatar_url)
        }
      }).catch(err => {
        console.error('Erro ao carregar perfil:', err)
      })
    }
  }, [user?.id])

  return (
    <div className={`flex h-screen overflow-hidden ${bgColor}`}>
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