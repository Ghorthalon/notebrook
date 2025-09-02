<template>
  <div class="auth-view">
    <div class="auth-card">
      <div class="auth-card__header">
        <h1 class="auth-card__title">Welcome to Notebrook</h1>
        <p class="auth-card__subtitle">Enter your authentication token to continue</p>
      </div>
      
      <form @submit.prevent="handleAuth" class="auth-form">
        <BaseInput
          v-model="serverUrl"
          ref="serverInput"
          type="url"
          label="Server URL (optional)"
          :placeholder="defaultServerUrl"
          :disabled="isLoading"
        />
        
        <BaseInput
          v-model="token"
          type="password"
          label="Authentication Token"
          placeholder="Enter your token"
          required
          :error="error"
          :disabled="isLoading"
          @keydown.enter="handleAuth"
          ref="tokenInput"
        />
        
        <BaseButton
          type="submit"
          :loading="isLoading"
          :disabled="!token.trim()"
          class="auth-form__submit"
        >
          {{ isLoading ? 'Authenticating...' : 'Sign In' }}
        </BaseButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useAudio } from '@/composables/useAudio'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { playSound } = useAudio()

const token = ref('')
const serverUrl = ref('')
const error = ref('')
const isLoading = ref(false)
const tokenInput = ref()
const serverInput = ref()
// Get default server URL for placeholder
const defaultServerUrl = authStore.getDefaultServerUrl()

const handleAuth = async () => {
  if (!token.value.trim()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    // Use custom server URL if provided, otherwise use default
    const customUrl = serverUrl.value.trim() || undefined
    const success = await authStore.authenticate(token.value.trim(), customUrl)
    
    if (success) {
      await playSound('login')
      toastStore.success('Authentication successful!')
      router.push('/')
    } else {
      error.value = 'Invalid authentication token or server URL'
      serverInput.value?.focus()
    }
  } catch (err) {
    error.value = 'Authentication failed. Please check your token and server URL.'
    console.error('Auth error:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  serverInput.value?.focus()
  playSound('intro')
})
</script>

<style scoped>
.auth-view {
  height: var(--vh-dynamic, 100vh);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.auth-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.auth-card__header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-card__title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.auth-card__subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-form__submit {
  width: 100%;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .auth-card {
    background: #1f2937;
  }
  
  .auth-card__title {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .auth-card__subtitle {
    color: #9ca3af;
  }
}
</style>