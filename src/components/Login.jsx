import { useState, useEffect } from 'react'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hasPassword, setHasPassword] = useState(null) // null = verificando
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Verificar se há senha salva ao montar o componente
  useEffect(() => {
    const savedHash = localStorage.getItem('dash-password-hash')
    setHasPassword(!!savedHash)
  }, [])

  // Simples hash (não é seguro, mas é melhor que nada para o localStorage)
  const simpleHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString()
  }

  const handleSetPassword = (e) => {
    e.preventDefault()
    setError('')

    if (!password || password.length < 4) {
      setError('Senha deve ter pelo menos 4 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    // Salvar hash da senha
    const hash = simpleHash(password)
    localStorage.setItem('dash-password-hash', hash)
    
    setPassword('')
    setConfirmPassword('')
    setIsCreating(false)
    setHasPassword(true)
    onLogin(password)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Digite a senha')
      return
    }

    const savedHash = localStorage.getItem('dash-password-hash')
    const currentHash = simpleHash(password)

    if (currentHash === savedHash) {
      setPassword('')
      onLogin(password)
    } else {
      setError('Senha incorreta')
      setPassword('')
    }
  }

  // Mostrar loading enquanto verifica se há senha
  if (hasPassword === null) {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* Avatar com Foto */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 shadow-lg overflow-hidden border-4 border-slate-300">
            <img 
              src="/avatar.jpg" 
              alt="Andressa" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Dash Andressa</h1>
          <p className="text-gray-500 text-sm mt-2">Gerenciador de Despesas</p>
        </div>

        {/* Forms */}
        {!hasPassword || isCreating ? (
          // Criar Senha
          <form onSubmit={handleSetPassword} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isCreating ? 'Criar Senha de Acesso' : 'Primeira Vez?'}
            </h2>

            {isCreating && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Criar Senha
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Senha
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="Digite novamente"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-slate-700"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Mostrar senha</span>
                </label>

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Criar Senha
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false)
                    setPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  className="w-full text-gray-600 hover:text-gray-900 font-medium py-2"
                >
                  Voltar
                </button>
              </>
            )}

            {!isCreating && !hasPassword && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Criar Senha Agora
              </button>
            )}
          </form>
        ) : (
          // Login
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bem-vinda, Andressa! 👋
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Digite sua senha"
                autoFocus
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-slate-700"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600">Mostrar senha</span>
            </label>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Entrar
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              ⚠️ Sem servidor de recuperação. Se esquecer a senha, os dados não podem ser recuperados.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

