import { useState } from 'react'
import { Menu, X, BarChart3, Settings, Home, LogOut, CreditCard, FileText } from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab, onLogout, sidebarBg = 'bg-gradient-to-b from-slate-800 to-slate-900', avatarUrl = null, gender = null }) {
  const [isOpen, setIsOpen] = useState(true)
  const isFeminino = gender === 'feminino'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'transactions', label: 'Despesas', icon: BarChart3 },
    { id: 'categories', label: 'Add Despesas', icon: Settings },
    { id: 'credit_cards', label: 'Cartões', icon: CreditCard },
    { id: 'invoices', label: 'Faturas', icon: FileText },
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
        } md:translate-x-0 fixed md:static left-0 top-0 h-screen w-64 ${sidebarBg} text-white shadow-lg transition-transform duration-300 z-40 overflow-y-auto pt-20 md:pt-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-900">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Perfil"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className={`w-20 h-20 rounded-full ${isFeminino ? 'bg-pink-400' : 'bg-slate-600'} flex items-center justify-center border-4 border-white shadow-lg`}>
                <span className="text-white text-2xl">👤</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-center">DashBoard</h1>
          <p className="text-blue-200 text-sm mt-1 text-center"></p>
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
                    ? 'bg-blue-900 text-white'
                    : 'text-blue-100 hover:bg-slate-600'
                }`}
              >
                <IconComponent size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-900 mt-auto">
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

