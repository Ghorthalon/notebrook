import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { get, set } from 'idb-keyval'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)

  const setToken = async (newToken: string) => {
    token.value = newToken
    isAuthenticated.value = true
    await set('auth_token', newToken)
  }

  const clearAuth = async () => {
    token.value = null
    isAuthenticated.value = false
    await set('auth_token', null)
  }

  const checkAuth = async () => {
    try {
      const storedToken = await get('auth_token')
      if (storedToken) {
        // Verify token with backend
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : ''
        const response = await fetch(`${baseUrl}/check-token`, {
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

  const authenticate = async (authToken: string): Promise<boolean> => {
    try {
      const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : ''
      const response = await fetch(`${baseUrl}/check-token`, {
        headers: { Authorization: authToken }
      })

      if (response.ok) {
        await setToken(authToken)
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
    isAuthenticated,
    setToken,
    clearAuth,
    checkAuth,
    authenticate
  }
})