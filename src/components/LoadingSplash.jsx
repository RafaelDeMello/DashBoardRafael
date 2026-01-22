export default function LoadingSplash({ avatarUrl, gender }) {
  const isFeminino = gender === 'feminino'
  const bgGradient = isFeminino 
    ? 'from-pink-600 to-pink-800' 
    : 'from-slate-700 to-slate-900'

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} flex flex-col items-center justify-center p-4`}>
      <div className="text-center space-y-8">
        {/* Avatar */}
        <div className="flex justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Perfil"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white">
              <span className="text-white text-4xl">👤</span>
            </div>
          )}
        </div>

        {/* Mensagem */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Carregando Dash
          </h1>
          
          {/* Loading Animation */}
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
