import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar se há uma senha salva no primeiro carregamento
    const savedHash = localStorage.getItem('dash-password-hash')
    if (savedHash) {
      // Há uma senha salva, então não está autenticado ainda
      setIsAuthenticated(false)
    } else {
      // Primeira vez, precisa criar senha
      setIsAuthenticated(false)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (pwd) => {
    setPassword(pwd)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setPassword('')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard password={password} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App

