import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { ToastMessage } from '@/types'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([])

  const addToast = (message: string, type: ToastMessage['type'] = 'info', duration = 3000) => {
    const id = Date.now().toString()
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearToasts = () => {
    toasts.value = []
  }

  const success = (message: string, duration?: number) => addToast(message, 'success', duration)
  const error = (message: string, duration?: number) => addToast(message, 'error', duration)
  const info = (message: string, duration?: number) => addToast(message, 'info', duration)

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    info
  }
})