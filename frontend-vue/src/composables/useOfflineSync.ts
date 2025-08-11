import { ref, onMounted, onUnmounted, readonly } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { apiService } from '@/services/api'
import type { UnsentMessage } from '@/types'

export function useOfflineSync() {
  const appStore = useAppStore()
  const toastStore = useToastStore()
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  let syncInterval: number | null = null

  // Monitor online status
  const updateOnlineStatus = () => {
    const wasOnline = isOnline.value
    isOnline.value = navigator.onLine
    
    if (!wasOnline && isOnline.value) {
      toastStore.success('Back online - syncing data...')
      syncUnsentMessages()
    } else if (wasOnline && !isOnline.value) {
      toastStore.info('You are offline - messages will be queued')
    }
  }

  // Sync unsent messages when online
  const syncUnsentMessages = async () => {
    if (!isOnline.value || isSyncing.value || appStore.unsentMessages.length === 0) {
      return
    }

    isSyncing.value = true
    const failedMessages: UnsentMessage[] = []

    for (const unsentMessage of appStore.unsentMessages) {
      try {
        const response = await apiService.createMessage(
          unsentMessage.channelId, 
          unsentMessage.content
        )
        
        // Message sent successfully - remove from unsent queue
        appStore.removeUnsentMessage(unsentMessage.id)
        
        // Add to messages (will be handled by WebSocket event too)
        appStore.addMessage(response)

      } catch (error) {
        console.error('Failed to sync message:', error)
        
        // Increment retry count (create mutable copy)
        const mutableMessage = { ...unsentMessage, retries: unsentMessage.retries + 1 }
        
        // If too many retries, give up
        if (mutableMessage.retries >= 3) {
          toastStore.error(`Failed to send message after 3 attempts: "${unsentMessage.content.substring(0, 50)}..."`)
          appStore.removeUnsentMessage(unsentMessage.id)
        } else {
          failedMessages.push(mutableMessage)
        }
      }
    }

    // Update unsent messages with failed ones
    if (failedMessages.length > 0) {
      toastStore.error(`${failedMessages.length} messages failed to sync. Will retry...`)
    } else if (appStore.unsentMessages.length > 0) {
      toastStore.success('All offline messages synced!')
    }

    isSyncing.value = false
    await appStore.saveState()
  }

  // Queue message for sending when offline
  const queueMessage = async (channelId: number, content: string): Promise<string> => {
    const unsentMessage: UnsentMessage = {
      id: `unsent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId,
      content,
      timestamp: Date.now(),
      retries: 0
    }

    appStore.addUnsentMessage(unsentMessage)
    await appStore.saveState()
    
    // Try to send immediately if online
    if (isOnline.value) {
      syncUnsentMessages()
    }

    return unsentMessage.id
  }

  // Send message (online or queue for offline)
  const sendMessage = async (channelId: number, content: string): Promise<boolean> => {
    if (isOnline.value) {
      try {
        const response = await apiService.createMessage(channelId, content)
        appStore.addMessage(response)
        return true
      } catch (error) {
        console.error('Failed to send message online:', error)
        // Fall back to queuing
        await queueMessage(channelId, content)
        toastStore.error('Failed to send message - queued for later')
        return false
      }
    } else {
      await queueMessage(channelId, content)
      toastStore.info('Message queued for sending when online')
      return false
    }
  }

  // Auto-save state periodically
  const startAutoSave = () => {
    if (syncInterval) clearInterval(syncInterval)
    
    syncInterval = setInterval(async () => {
      try {
        await appStore.saveState()
        
        // Try to sync unsent messages if online
        if (isOnline.value && appStore.unsentMessages.length > 0) {
          syncUnsentMessages()
        }
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 10000) // Save every 10 seconds
  }

  const stopAutoSave = () => {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }

  // Handle beforeunload to save state
  const handleBeforeUnload = () => {
    appStore.saveState()
  }

  onMounted(() => {
    // Add event listeners
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Start auto-save
    startAutoSave()
    
    // Initial sync if online and has unsent messages
    if (isOnline.value && appStore.unsentMessages.length > 0) {
      syncUnsentMessages()
    }
  })

  onUnmounted(() => {
    // Clean up
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus) 
    window.removeEventListener('beforeunload', handleBeforeUnload)
    stopAutoSave()
  })

  return {
    isOnline,
    isSyncing,
    sendMessage,
    syncUnsentMessages,
    queueMessage
  }
}