import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import LoginSupabase from './components/LoginSupabase'
import LoadingSplash from './components/LoadingSplash'
import ErrorBoundary from './components/ErrorBoundary'
import { supabase } from './lib/supabaseClient'
import useStore from './storeSupabase'

function App() {
  const [user, setUser] = useState(null)
  const [gender, setGender] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(false)
  const [splashTimer, setSplashTimer] = useState(null)
  const loadUserProfile = useStore((state) => state.loadUserProfile)

  useEffect(() => {
    let isMounted = true

    const checkUser = async () => {
      try {
        console.log('🔍 Verificando usuário...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Erro ao obter usuário:', error)
          if (isMounted) setIsLoading(false)
          return
        }

        if (isMounted) {
          setUser(user)
          console.log('✓ Usuário:', user?.email || 'Sem login')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Erro na verificação:', err)
        if (isMounted) setIsLoading(false)
      }
    }

    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠ Timeout ao carregar usuário')
        setIsLoading(false)
      }
    }, 5000)

    checkUser()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event)
        if (!isMounted) return

        setUser(session?.user || null)
        if (session?.user?.id) {
          console.log('✓ Usuário autenticado:', session.user.id)
          // Mostrar splash por 2 segundos apenas
          setShowSplash(true)
          
          const timer = setTimeout(() => {
            if (isMounted) {
              console.log('✓ Saindo do splash')
              setShowSplash(false)
            }
          }, 2000)
          setSplashTimer(timer)
        } else {
          setGender(null)
          setAvatarUrl(null)
          setShowSplash(false)
          if (splashTimer) clearTimeout(splashTimer)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [])

  // Carregar perfil quando usuário muda (em background)
  useEffect(() => {
    let isMounted = true

    if (user?.id) {
      console.log('📥 Carregando perfil do usuário...')
      loadUserProfile(user.id).then(() => {
        if (isMounted) {
          const userProfile = useStore.getState().userProfile
          console.log('✓ Perfil carregado no App:', userProfile)
          setGender(userProfile?.gender)
          setAvatarUrl(userProfile?.avatar_url)
        }
      }).catch(err => {
        console.error('Erro ao carregar perfil:', err)
      })
    }

    return () => {
      isMounted = false
    }
  }, [user?.id, loadUserProfile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    useStore.getState().clearData()
    setUser(null)
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

  if (showSplash && user) {
    return <LoadingSplash avatarUrl={avatarUrl} gender={gender} />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {!user ? (
          <LoginSupabase onLogin={setUser} />
        ) : (
          <Dashboard user={user} gender={gender} onLogout={handleLogout} />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App

