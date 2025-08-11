<template>
  <div class="main-view">
    <!-- Sidebar -->
    <Sidebar
      :channels="appStore.channels"
      :current-channel-id="appStore.currentChannelId"
      :unread-counts="unreadCounts"
      @create-channel="showChannelDialog = true"
      @select-channel="selectChannel"
      @settings="showSettings = true"
    />
    
    <!-- Main Content -->
    <main class="main-content">
      <div v-if="appStore.currentChannel" class="chat-container">
        <!-- Chat Header -->
        <ChatHeader
          :channel-name="appStore.currentChannel.name"
          @search="showSearchDialog = true"
        />
        
        <!-- Messages -->
        <MessagesContainer
          :messages="appStore.currentMessages"
          :unsent-messages="appStore.unsentMessagesForChannel"
          ref="messagesContainer"
        />
        
        <!-- Message Input -->
        <MessageInput
          @send-message="handleSendMessage"
          @file-upload="showFileDialog = true"
          @camera="showCameraDialog = true"
          @voice="showVoiceDialog = true"
          ref="messageInput"
        />
      </div>
      
      <div v-else class="no-channel">
        <p>Select a channel to start chatting</p>
      </div>
    </main>
    
    <!-- Dialogs -->
    <BaseDialog v-model:show="showChannelDialog" title="Create Channel">
      <CreateChannelDialog
        @cancel="showChannelDialog = false"
        @created="handleChannelCreated"
      />
    </BaseDialog>
    
    <BaseDialog v-model:show="showSettings" title="Settings">
      <SettingsDialog @close="showSettings = false" />
    </BaseDialog>
    
    <BaseDialog v-model:show="showSearchDialog" title="Search Messages" size="lg">
      <SearchDialog
        @close="showSearchDialog = false"
        @select-message="handleSelectMessage"
      />
    </BaseDialog>
    
    <BaseDialog v-model:show="showFileDialog" title="Upload Files" size="lg">
      <FileUploadDialog
        @cancel="showFileDialog = false"
        @uploaded="showFileDialog = false"
      />
    </BaseDialog>
    
    <BaseDialog v-model:show="showVoiceDialog" title="Record Voice Message">
      <VoiceRecordingDialog 
        @close="showVoiceDialog = false" 
        @sent="handleVoiceSent"
      />
    </BaseDialog>
    
    <BaseDialog v-model:show="showCameraDialog" title="Take Photo">
      <CameraCaptureDialog 
        @close="showCameraDialog = false" 
        @sent="handleCameraSent"
      />
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useOfflineSync } from '@/composables/useOfflineSync'
import { useWebSocket } from '@/composables/useWebSocket'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useAudio } from '@/composables/useAudio'
import { apiService } from '@/services/api'
import { syncService } from '@/services/sync'

// Components
import BaseDialog from '@/components/base/BaseDialog.vue'
import Sidebar from '@/components/sidebar/Sidebar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import MessagesContainer from '@/components/chat/MessagesContainer.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import CreateChannelDialog from '@/components/dialogs/CreateChannelDialog.vue'
import SettingsDialog from '@/components/dialogs/SettingsDialog.vue'
import SearchDialog from '@/components/dialogs/SearchDialog.vue'
import FileUploadDialog from '@/components/dialogs/FileUploadDialog.vue'
import VoiceRecordingDialog from '@/components/dialogs/VoiceRecordingDialog.vue'
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog.vue'

// Types
import type { ExtendedMessage } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { sendMessage: sendMessageOffline } = useOfflineSync()
const { playWater, playSent, playSound, speak, stopSpeaking, isSpeaking } = useAudio()

// Set up services - ensure token is properly set
if (authStore.token) {
  apiService.setToken(authStore.token)
}

// Refs
const messagesContainer = ref()
const messageInput = ref()

// Dialog states
const showChannelDialog = ref(false)
const showSettings = ref(false)
const showSearchDialog = ref(false)
const showFileDialog = ref(false)
const showVoiceDialog = ref(false)
const showCameraDialog = ref(false)

// Mock unread counts (implement real logic later)
const unreadCounts = ref<Record<number, number>>({})

// Set up keyboard shortcuts
const { addShortcut } = useKeyboardShortcuts()

const setupKeyboardShortcuts = () => {
  // Ctrl+Shift+S - Settings
  addShortcut({
    key: 's',
    ctrlKey: true,
    shiftKey: true,
    handler: () => { showSettings.value = true }
  })
  
  // Ctrl+Shift+F - Search
  addShortcut({
    key: 'f',
    ctrlKey: true,
    shiftKey: true,
    handler: () => { showSearchDialog.value = true }
  })
  
  // Ctrl+Shift+C - Channel selector focus
  addShortcut({
    key: 'c',
    ctrlKey: true,
    shiftKey: true,
    handler: () => {
      // Focus the first channel in the list
      const firstChannelButton = document.querySelector('.channel-item button') as HTMLElement
      if (firstChannelButton) {
        firstChannelButton.focus()
        toastStore.info('Channel selector focused')
      }
    }
  })
  
  // Ctrl+Shift+X - Channel info
  addShortcut({
    key: 'x',
    ctrlKey: true,
    shiftKey: true,
    handler: () => {
      if (appStore.currentChannel) {
        toastStore.info(`Channel: ${appStore.currentChannel.name} (${appStore.currentMessages.length} messages)`)
      } else {
        toastStore.info('No channel selected')
      }
    }
  })
  
  // Ctrl+Shift+V - Voice message
  addShortcut({
    key: 'v',
    ctrlKey: true,
    shiftKey: true,
    handler: () => { 
      if (appStore.currentChannelId) {
        showVoiceDialog.value = true 
      } else {
        toastStore.info('Select a channel first')
      }
    }
  })
  
  // Space - Focus message input
  addShortcut({
    key: ' ',
    handler: () => { messageInput.value?.focus() }
  })
  
  // Ctrl+Shift+T - Toggle TTS
  addShortcut({
    key: 't',
    ctrlKey: true,
    shiftKey: true,
    handler: () => {
      appStore.updateSettings({ ttsEnabled: !appStore.settings.ttsEnabled })
      toastStore.info(`TTS ${appStore.settings.ttsEnabled ? 'enabled' : 'disabled'}`)
    }
  })
  
  // Escape - Stop speaking
  addShortcut({
    key: 'escape',
    handler: () => {
      if (isSpeaking.value) {
        stopSpeaking()
        toastStore.info('Speech stopped')
      }
    }
  })
  
  // Alt+Numbers - Announce last N messages
  for (let i = 1; i <= 9; i++) {
    addShortcut({
      key: i.toString(),
      altKey: true,
      handler: () => announceLastMessage(i)
    })
  }
  
  // Alt+0 - Announce last 10 messages
  addShortcut({
    key: '0',
    altKey: true,
    handler: () => announceLastMessage(10)
  })
}

const selectChannel = async (channelId: number) => {
  console.log('Selecting channel:', channelId)
  await appStore.setCurrentChannel(channelId)
  
  // Try to sync messages for this channel
  try {
    await syncService.syncChannelMessages(channelId)
    console.log('Channel messages synced')
  } catch (error) {
    console.log('Failed to sync channel messages, using local cache')
  }
  
  scrollToBottom()
}

const handleSendMessage = async (content: string) => {
  if (!appStore.currentChannelId) return
  
  console.log('Sending message:', content, 'to channel:', appStore.currentChannelId)
  
  try {
    await syncService.sendMessage(appStore.currentChannelId, content)
    playSent()
    scrollToBottom()
    toastStore.success('Message sent')
  } catch (error) {
    console.error('Failed to send message:', error)
    playWater() // Still play sound for queued message
    scrollToBottom()
    toastStore.error('Message queued for sending when online')
  }
}

const handleSelectMessage = async (message: ExtendedMessage) => {
  showSearchDialog.value = false
  
  // Switch to the correct channel if needed
  if (message.channel_id !== appStore.currentChannelId) {
    await selectChannel(message.channel_id)
  }
  
  // Wait for the DOM to update, then focus the specific message
  await nextTick()
  
  // Use the MessagesContainer's focusMessageById method for proper roving tabindex
  if (messagesContainer.value?.focusMessageById) {
    messagesContainer.value.focusMessageById(message.id)
    
    // Add visual highlight
    await nextTick()
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`)
    if (messageElement) {
      messageElement.classList.add('message--highlighted')
      setTimeout(() => {
        messageElement.classList.remove('message--highlighted')
      }, 2000)
    }
  } else {
    // Fallback to scrolling to bottom if method not available
    scrollToBottom()
  }
}

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const handleVoiceSent = () => {
  // Voice message was sent successfully
  showVoiceDialog.value = false
  scrollToBottom()
  playSent()
}

const handleCameraSent = () => {
  // Photo was sent successfully
  showCameraDialog.value = false
  scrollToBottom()
  playSent()
}

const announceLastMessage = (position: number) => {
  const messages = appStore.currentMessages
  if (!messages || messages.length === 0) {
    toastStore.info('There are no messages in this channel right now')
    return
  }
  
  const messageIndex = messages.length - position
  if (messageIndex < 0) {
    toastStore.info('No message is available in this position')
    return
  }
  
  const message = messages[messageIndex]
  const timeStr = formatTime(message.created_at)
  const announcement = `${message.content}; ${timeStr}`
  
  toastStore.info(announcement)
  
  // Also speak if TTS is enabled
  if (appStore.settings.ttsEnabled) {
    speak(announcement)
  }
}

const scrollToBottom = () => {
  messagesContainer.value?.scrollToBottom()
}

const handleChannelCreated = async (channelId: number) => {
  showChannelDialog.value = false
  await selectChannel(channelId)
}

const isUnsentMessage = (messageId: string | number): boolean => {
  return typeof messageId === 'string' && messageId.startsWith('unsent_')
}

// Initialize
onMounted(async () => {
  // 1. Load saved state first (offline-first)
  console.log('Loading local state...')
  await appStore.loadState()
  console.log('Local state loaded. Channels:', appStore.channels.length, 'Current channel:', appStore.currentChannelId, 'Unsent messages:', appStore.unsentMessages.length)
  
  // 2. Try to sync with server (when online)
  try {
    console.log('Syncing with server...')
    await syncService.fullSync()
    toastStore.success('Synced with server')
  } catch (error) {
    console.log('Failed to sync with server, working offline with cached data')
    if (appStore.channels.length === 0) {
      toastStore.error('No internet connection and no cached data available')
    } else {
      toastStore.info('Working offline with cached data')
    }
  }
  
  // 3. WebSocket connection (will gracefully fail if offline)
  useWebSocket()
  
  // 4. Set up keyboard shortcuts
  setupKeyboardShortcuts()
  
  // 5. Auto-select first channel if none selected and we have channels
  if (!appStore.currentChannelId && appStore.channels.length > 0) {
    await selectChannel(appStore.channels[0].id)
  }
  
  // 6. Set up periodic sync for unsent messages
  const syncInterval = setInterval(async () => {
    if (appStore.unsentMessages.length > 0) {
      try {
        console.log(`Attempting to sync ${appStore.unsentMessages.length} unsent messages`)
        await syncService.retryUnsentMessages()
      } catch (error) {
        console.log('Background sync failed, will try again later')
      }
    }
  }, 30000) // Every 30 seconds
  
  // Cleanup interval on unmount
  const cleanup = () => clearInterval(syncInterval)
  window.addEventListener('beforeunload', cleanup)
})
</script>

<style scoped>
.main-view {
  display: flex;
  height: 100vh;
  background: #ffffff;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.no-channel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  font-size: 1.125rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .main-view {
    background: #111827;
  }
  
  .no-channel {
    color: rgba(255, 255, 255, 0.6);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .main-view {
    flex-direction: column;
  }
}
</style>