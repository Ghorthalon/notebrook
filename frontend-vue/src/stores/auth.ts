import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { get, set } from 'idb-keyval'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const serverUrl = ref<string | null>(null)
  const isAuthenticated = ref(false)

  // Get default server URL based on environment
  const getDefaultServerUrl = () => {
    return import.meta.env.DEV ? 'http://localhost:3000' : ''
  }

  const setToken = async (newToken: string, customServerUrl?: string) => {
    token.value = newToken
    isAuthenticated.value = true
    
    // Set server URL or use default
    const urlToUse = customServerUrl || getDefaultServerUrl()
    serverUrl.value = urlToUse
    
    // Save both token and server URL
    await Promise.all([
      set('auth_token', newToken),
      set('server_url', urlToUse)
    ])
  }

  const setServerUrl = async (url: string) => {
    serverUrl.value = url
    await set('server_url', url)
  }

  const clearAuth = async () => {
    token.value = null
    serverUrl.value = null
    isAuthenticated.value = false
    await Promise.all([
      set('auth_token', null),
      set('server_url', null)
    ])
  }

  const checkAuth = async () => {
    try {
      const [storedToken, storedServerUrl] = await Promise.all([
        get('auth_token'),
        get('server_url')
      ])
      
      if (storedToken) {
        // Set server URL or use default
        const urlToUse = storedServerUrl || getDefaultServerUrl()
        serverUrl.value = urlToUse
        
        // Verify token with backend
        const response = await fetch(`${urlToUse}/check-token`, {
          headers: { Authorization: storedToken }
        })
        
        if (response.ok) {
          token.value = storedToken
          isAuthenticated.value = true
        } else {
          console.warn('Stored token is invalid, clearing auth')
          await clearAuth()
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      await clearAuth()
    }
  }

  const authenticate = async (authToken: string, customServerUrl?: string): Promise<boolean> => {
    try {
      const urlToUse = customServerUrl || getDefaultServerUrl()
      const response = await fetch(`${urlToUse}/check-token`, {
        headers: { Authorization: authToken }
      })

      if (response.ok) {
        await setToken(authToken, urlToUse)
        return true
      } else {
        await clearAuth()
        return false
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      await clearAuth()
      return false
    }
  }

  return {
    token,
    serverUrl,
    isAuthenticated,
    setToken,
    setServerUrl,
    clearAuth,
    checkAuth,
    authenticate,
    getDefaultServerUrl
  }
})