import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gender, setGender] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState(null)

  // Verificar se usuário já está logado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        onLogin(user)
      }
    }
    checkUser()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          onLogin(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [onLogin])

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError('Email e senha são obrigatórios')
        return
      }

      if (!avatarFile) {
        setError('Foto de perfil é obrigatória')
        return
      }

      if (password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres')
        return
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem')
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Criar perfil do usuário
      if (data.user) {
        // Upload da imagem
        let avatarUrl = null
        if (avatarFile) {
          const fileExt = avatarFile.name.split('.').pop()
          const fileName = `${data.user.id}.${fileExt}`
          
          console.log('📤 Fazendo upload da imagem:', fileName)
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true })
          
          if (uploadError) {
            console.error('Erro ao fazer upload da imagem:', uploadError)
          } else {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName)
            avatarUrl = urlData.publicUrl
            console.log('✓ URL da imagem:', avatarUrl)
          }
        }

        console.log('💾 Salvando perfil com avatar_url:', avatarUrl)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, email, gender, avatar_url: avatarUrl }])

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        } else {
          console.log('✓ Perfil criado com sucesso')
        }

        // Criar categorias padrão
        const defaultCategories = [
          { user_id: data.user.id, name: 'Aluguel', color: '#1e293b', is_fixed: true },
          { user_id: data.user.id, name: 'Alimentação', color: '#334155', is_fixed: false },
          { user_id: data.user.id, name: 'Saúde', color: '#0ea5e9', is_fixed: false },
          { user_id: data.user.id, name: 'Academia', color: '#06b6d4', is_fixed: false },
          { user_id: data.user.id, name: 'Transporte', color: '#f59e0b', is_fixed: false },
          { user_id: data.user.id, name: 'Outros', color: '#8b5cf6', is_fixed: false },
        ]

        const { error: categoriesError } = await supabase
          .from('categories')
          .insert(defaultCategories)

        if (categoriesError) {
          console.error('Erro ao criar categorias:', categoriesError)
        }
      }

      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setGender('')
      setAvatarFile(null)
      setAvatarPreview(null)
      setIsSignUp(false)
      setError('Conta criada! Faça login para continuar.')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError('Email e senha são obrigatórios')
        return
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError(loginError.message)
        return
      }

      if (data.user) {
        setUser(data.user)
        setEmail('')
        setPassword('')
        onLogin(data.user)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DashBoard Financeiro</h1>
          <h2 className="text-1xl font-bold text-gray-700 py-3">Gerenciador de Despesas</h2>
        </div>

        {/* Formulário */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                placeholder="••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirmar Senha (apenas signup) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                placeholder="••••••"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Gênero (apenas signup) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gênero
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                disabled={isLoading}
              >
                <option value="">Selecione...</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>
          )}

          {/* Foto de Perfil (apenas signup) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Perfil *
              </label>
              <div className="flex flex-col items-center gap-3">
                {avatarPreview && (
                  <img 
                    src={avatarPreview} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-300"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                  required
                />
                {avatarFile && (
                  <p className="text-xs text-green-600">✓ Imagem selecionada</p>
                )}
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              error.includes('criada') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        {/* Alternar entre Login e SignUp */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setEmail('')
                setPassword('')
                setConfirmPassword('')
                setGender('')
                setAvatarFile(null)
                setAvatarPreview(null)
              }}
              className="text-slate-700 font-semibold hover:underline"
              disabled={isLoading}
            >
              {isSignUp ? 'Entrar' : 'Criar Conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
