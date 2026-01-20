import { useState } from 'react'
import { Menu, X, BarChart3, Settings, Home, LogOut } from 'lucide-react'
import BackupManager from './BackupManager'

export default function Sidebar({ activeTab, setActiveTab, transactions, categories, onImport, onLogout }) {
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'transactions', label: 'Despesas', icon: BarChart3 },
    { id: 'categories', label: 'Add Despesas', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-lg transition-transform duration-300 z-40 overflow-y-auto pt-20 md:pt-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-pink-400">
          <h1 className="text-2xl font-bold">Dash Da Andressa Maravilhosa</h1>
          <p className="text-blue-200 text-sm mt-1">Ainda nao sei</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsOpen(false) // Close on mobile
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === item.id
                    ? 'bg-pink-400 text-white'
                    : 'text-pink-100 hover:bg-slate-600'
                }`}
              >
                <IconComponent size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Backup Section */}
        <div className="p-4 border-t border-pink-400 mt-4">
          <p className="text-pink-100 text-xs font-semibold uppercase mb-3 text-center">
            Backup
          </p>
          <BackupManager
            transactions={transactions}
            categories={categories}
            onImport={onImport}
            password={localStorage.getItem('dash-password-hash')}
          />
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-pink-400">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

