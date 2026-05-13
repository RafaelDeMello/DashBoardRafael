import { createClient } from '@supabase/supabase-js'

let SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('=== Supabase Config Debug ===')
console.log('VITE_SUPABASE_URL:', SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', SUPABASE_KEY ? SUPABASE_KEY.substring(0, 20) + '...' : 'undefined')

// Corrigir URL se não tiver https://
if (SUPABASE_URL && !SUPABASE_URL.startsWith('http')) {
  SUPABASE_URL = `https://${SUPABASE_URL}`
  console.log('🔧 URL corrigida para:', SUPABASE_URL)
}

let supabase

try {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Credenciais do Supabase não configuradas no .env')
  }
  
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  console.log('✓ Supabase inicializado com sucesso')

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('✓ Token JWT renovado automaticamente')
    }
  })
} catch (error) {
  console.error('✗ Erro ao inicializar Supabase:', error.message)
  // Criar mock para evitar crashes
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signUp: async () => ({ data: null, error: new Error('Supabase não configurado') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase não configurado') }),
      signOut: async () => ({}),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ data: null, error: null }) }),
      update: () => ({ eq: () => ({ select: () => ({ data: null, error: null }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
  }
}

export { supabase }
