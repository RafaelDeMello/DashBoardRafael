// Utility para criptografia e descriptografia simples
// Nota: Usando um método simples pois crypto-js pode ter issues com imports
// Para produção, considere usar uma biblioteca mais robusta

const ENCRYPTION_KEY = 'dash-andressa-key' // Chave fixa (melhor usar a senha do usuário)

/**
 * Criptografa um objeto usando XOR (simples, rápido)
 * Não é seguro para dados altamente confidenciais, mas serve para o localStorage
 */
export const encryptData = (data, password) => {
  try {
    const jsonStr = JSON.stringify(data)
    const key = password || ENCRYPTION_KEY
    
    // Converter para bytes e aplicar XOR
    let encrypted = ''
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      encrypted += String.fromCharCode(charCode)
    }
    
    // Codificar em base64 para armazenar
    return btoa(encrypted)
  } catch (error) {
    console.error('Erro ao criptografar:', error)
    return null
  }
}

/**
 * Descriptografa um objeto
 */
export const decryptData = (encryptedStr, password) => {
  try {
    const key = password || ENCRYPTION_KEY
    
    // Decodificar de base64
    const encrypted = atob(encryptedStr)
    
    // Aplicar XOR novamente para descriptografar
    let decrypted = ''
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      decrypted += String.fromCharCode(charCode)
    }
    
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Erro ao descriptografar:', error)
    return null
  }
}

/**
 * Hash simples para verificar senha (não é cryptograficamente seguro)
 */
export const simpleHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString()
}

