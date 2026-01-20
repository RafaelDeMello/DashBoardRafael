import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { encryptData, decryptData } from '../utils/encryption'

export default function BackupManager({ transactions, categories, onImport, password }) {
  const fileInputRef = useRef(null)

  const handleExport = () => {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      encrypted: true,
      transactions,
      categories,
    }

    // Criptografar o backup
    const encrypted = encryptData(backup, password)
    
    if (!encrypted) {
      alert('Erro ao criptografar o backup')
      return
    }

    const dataBlob = new Blob([encrypted], { type: 'text/plain' })
    const url = URL.createObjectURL(dataBlob)
    
    // Gera nome do arquivo com data/hora
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const filename = `backup-rafael-${dateStr}-${timeStr}.enc`
    
    // Cria link temporário e faz download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result
        
        // Tentar descriptografar
        let backup = null
        try {
          backup = decryptData(content, password)
        } catch (decryptError) {
          // Tentar como JSON simples (compatibilidade com versão antiga)
          try {
            backup = JSON.parse(content)
          } catch (jsonError) {
            alert('Arquivo de backup inválido ou corrompido')
            return
          }
        }

        // Validar estrutura do backup
        if (!backup.transactions || !backup.categories) {
          alert('Arquivo de backup inválido')
          return
        }

        // Confirmar antes de importar
        if (
          window.confirm(
            `Deseja importar ${backup.transactions.length} transações e ${backup.categories.length} categorias? Os dados atuais serão substituídos.`
          )
        ) {
          onImport({
            transactions: backup.transactions,
            categories: backup.categories,
          })
          alert('Dados importados com sucesso!')
        }
      } catch (error) {
        console.error('Erro ao importar:', error)
        alert('Erro ao ler o arquivo de backup')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {/* Export Button */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 text-white border-2 border-transparent hover:bg-blue-500 hover:border-blue-500 rounded-lg transition-colors text-sm font-medium active:bg-blue-600 active:border-blue-600"
        title="Fazer download de backup dos dados"
      >
        <Download size={18} />
        <span className="hidden sm:inline">Exportar</span>
      </button>

      {/* Import Button */}
      <button
        onClick={handleImportClick}
        className="flex items-center gap-2 px-3 py-2 text-white border-2 border-transparent hover:bg-green-500 hover:border-green-500 rounded-lg transition-colors text-sm font-medium active:bg-green-600 active:border-green-600"
        title="Restaurar dados de um backup"
      >
        <Upload size={18} />
        <span className="hidden sm:inline">Importar</span>
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Selecionar arquivo de backup"
      />
    </div>
  )
}

