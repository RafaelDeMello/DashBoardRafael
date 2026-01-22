import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erro capturado por ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h2>
              <p className="text-gray-600 mb-6">
                Desculpe! Ocorreu um erro inesperado. Tente recarregar a página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                🔄 Recarregar Página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
