import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { apiService } from './services/api'

// Import routes
import { routes } from './router/index'

const app = createApp(App)
const pinia = createPinia()
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Router guard to ensure API service has proper token
router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import('./stores/auth')
  const authStore = useAuthStore()
  
  // Check authentication first
  await authStore.checkAuth()
  
  // Check if going to protected route
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth')
    return
  }
  
  // If authenticated but going to auth page, redirect to main
  if (authStore.isAuthenticated && to.name === 'auth') {
    next('/')
    return
  }
  
  // Set token for API service if authenticated
  if (authStore.isAuthenticated && authStore.token) {
    apiService.setToken(authStore.token)
  }
  
  next()
})

app.use(pinia)
app.use(router)
app.mount('#app')