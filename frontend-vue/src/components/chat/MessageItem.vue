<template>
  <div
    :class="[
      'message',
      { 'message--unsent': isUnsent }
    ]"
    ref="rootEl"
    :data-message-id="message.id"
    :tabindex="tabindex || -1"
    :aria-label="messageAriaLabel"
    role="option"
    @keydown="handleKeydown"
    @click="handleClick"
  >
    <div class="message__content">
      {{ message.content }}
    </div>
    
    <!-- File Attachment -->
    <div v-if="hasFileAttachment && fileAttachment" class="message__files">
      <FileAttachment :file="fileAttachment" />
    </div>
    
    <div class="message__meta">
      <time 
        v-if="!isUnsent && 'created_at' in message" 
        class="message__time"
        :datetime="message.created_at"
      >
        {{ formatSmartTimestamp(message.created_at) }}
      </time>
      <span v-else class="message__status">Sending...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useToastStore } from '@/stores/toast'
import { useAppStore } from '@/stores/app'
import { apiService } from '@/services/api'
import { syncService } from '@/services/sync'
import { formatSmartTimestamp, formatTimestampForScreenReader } from '@/utils/time'
import FileAttachment from './FileAttachment.vue'
import type { ExtendedMessage, UnsentMessage, FileAttachment as FileAttachmentType } from '@/types'

interface Props {
  message: ExtendedMessage | UnsentMessage
  isUnsent?: boolean
  tabindex?: number
}

const emit = defineEmits<{
  'open-dialog': [message: ExtendedMessage | UnsentMessage]
}>()

const props = withDefaults(defineProps<Props>(), {
  isUnsent: false
})

// Debug message structure (removed for production)

const { speak, playSound } = useAudio()
const toastStore = useToastStore()
const appStore = useAppStore()

// Root element ref for DOM-based focus management
const rootEl = ref<HTMLElement | null>(null)

// Fallback: focus the chat input textarea
const focusFallbackToInput = () => {
  const inputEl = document.querySelector('.message-input .base-textarea__field') as HTMLElement | null
  if (inputEl) {
    inputEl.focus()
  }
}

// Check if message has a file attachment
const hasFileAttachment = computed(() => {
  return 'fileId' in props.message && !!props.message.fileId
})

// Create FileAttachment object from flattened message data
const fileAttachment = computed((): FileAttachmentType | null => {
  if (!hasFileAttachment.value || !('fileId' in props.message)) return null
  
  // Check if we have the minimum required file metadata
  if (!props.message.filePath || !props.message.originalName) {
    console.warn('File attachment missing metadata:', {
      fileId: props.message.fileId,
      filePath: props.message.filePath,
      originalName: props.message.originalName,
      fileType: props.message.fileType
    })
    return null
  }
  
  return {
    id: props.message.fileId!,
    channel_id: props.message.channel_id,
    message_id: props.message.id,
    file_path: props.message.filePath!,
    file_type: props.message.fileType || 'application/octet-stream',
    file_size: props.message.fileSize || 0,
    original_name: props.message.originalName!,
    created_at: props.message.fileCreatedAt || props.message.created_at
  }
})

// formatTime function removed - now using formatSmartTimestamp from utils

// Create comprehensive aria-label for screen readers
const messageAriaLabel = computed(() => {
  let label = ''
  
  // Add message content
  if (props.message.content) {
    label += props.message.content
  }
  
  // Add file attachment info if present
  if (hasFileAttachment.value && fileAttachment.value) {
    const file = fileAttachment.value
    const fileType = getFileType(file.original_name)
    label += `. Has ${fileType} attachment: ${file.original_name}`
  }
  
  // Add timestamp
  if ('created_at' in props.message && props.message.created_at) {
    const time = formatTimestampForScreenReader(props.message.created_at)
    label += `. Sent ${time}`
  }
  
  // Add status for unsent messages
  if (props.isUnsent) {
    label += '. Message is sending'
  }
  
  return label
})

// Helper to determine file type for better description
const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return 'file'
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image'
  } else if (['mp3', 'wav', 'webm', 'ogg', 'aac', 'm4a'].includes(ext)) {
    return 'voice'
  } else if (['pdf'].includes(ext)) {
    return 'PDF document'
  } else if (['doc', 'docx'].includes(ext)) {
    return 'Word document'
  } else if (['txt', 'md'].includes(ext)) {
    return 'text document'
  } else {
    return 'file'
  }
}

const handleClick = () => {
  // Only open dialog for sent messages (not unsent ones)
  if (!props.isUnsent) {
    emit('open-dialog', props.message)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // Don't interfere with normal keyboard shortcuts (Ctrl+C, Ctrl+V, etc.)
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }
  
  if (event.key === 'c') {
    // Copy message content (only when no modifiers are pressed)
    navigator.clipboard.writeText(props.message.content)
    playSound('copy')
    toastStore.success('Message copied to clipboard')
  } else if (event.key === 'r') {
    // Read message aloud (only when no modifiers are pressed)
    if (appStore.settings.ttsEnabled) {
      speak(props.message.content)
      toastStore.info('Reading message')
    } else {
      toastStore.info('Text-to-speech is disabled')
    }
  } else if (event.key === 'Delete') {
    event.preventDefault()
    handleDelete()
  }
}

// Delete current message (supports sent and unsent)
const handleDelete = async () => {
  try {
    // Capture neighboring elements before removal
    const current = rootEl.value
    const prevEl = (current?.previousElementSibling as HTMLElement | null) || null
    const nextEl = (current?.nextElementSibling as HTMLElement | null) || null
    const isFirst = !prevEl
    const targetToFocus = isFirst ? nextEl : prevEl

    if (props.isUnsent) {
      // Unsent local message
      const unsent = props.message as UnsentMessage
      appStore.removeUnsentMessage(unsent.id)
      toastStore.success('Unsent message removed')
      // focus the closest message
      await nextTick()
      if (targetToFocus && document.contains(targetToFocus)) {
        if (!targetToFocus.hasAttribute('tabindex')) targetToFocus.setAttribute('tabindex', '-1')
        targetToFocus.focus()
      } else {
        focusFallbackToInput()
      }
      return
    }

    // Sent message: optimistic removal, then server delete
    const msg = props.message as ExtendedMessage

    // Capture original position for potential rollback
    const channelMessages = appStore.messages[msg.channel_id] || []
    const originalIndex = channelMessages.findIndex(m => m.id === msg.id)

    // Optimistically remove from local state for snappy UI
    appStore.removeMessage(msg.id)

    // Focus the closest message immediately after local removal
    await nextTick()
    if (targetToFocus && document.contains(targetToFocus)) {
      if (!targetToFocus.hasAttribute('tabindex')) targetToFocus.setAttribute('tabindex', '-1')
      targetToFocus.focus()
    } else {
      focusFallbackToInput()
    }

    try {
      await apiService.deleteMessage(msg.channel_id, msg.id)
      // Attempt to sync the channel to reconcile with server state
      try {
        await syncService.syncChannelMessages(msg.channel_id)
      } catch (syncError) {
        console.warn('Post-delete sync failed; continuing with local state.', syncError)
      }
      toastStore.success('Message deleted')
    } catch (error) {
      // Rollback local removal on failure
      if (originalIndex !== -1) {
        const list = appStore.messages[msg.channel_id] || []
        list.splice(Math.min(originalIndex, list.length), 0, msg)
      }
      await nextTick()
      const restoredEl = document.querySelector(`[data-message-id="${msg.id}"]`) as HTMLElement | null
      if (restoredEl) {
        if (!restoredEl.hasAttribute('tabindex')) restoredEl.setAttribute('tabindex', '-1')
        restoredEl.focus()
      }
      throw error
    }
    // focus the closest message
    await nextTick()
    if (targetToFocus && document.contains(targetToFocus)) {
      if (!targetToFocus.hasAttribute('tabindex')) targetToFocus.setAttribute('tabindex', '-1')
      targetToFocus.focus()
    } else {
      focusFallbackToInput()
    }
    
  } catch (error) {
    console.error('Failed to delete message:', error)
    toastStore.error('Failed to delete message')
  }
}
</script>

<style scoped>
.message {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.message:hover {
  background: #f1f3f4;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.message:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

.message--unsent {
  background: #fff3e0;
  border-color: #ff9800;
}

.message--highlighted {
  background: #e3f2fd;
  border-color: #2196f3;
}

.message__content {
  color: #212529;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.message__files {
  margin: 8px 0;
}

.message__meta {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.message__time {
  color: #6c757d;
  font-size: 12px;
}

.message__status {
  color: #ff9800;
  font-size: 12px;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  .message {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .message:hover {
    background: #374151;
    border-color: #60a5fa;
    box-shadow: 0 2px 4px rgba(96, 165, 250, 0.1);
  }
  
  .message__content {
    color: #e2e8f0;
  }
  
  .message__time {
    color: #a0aec0;
  }
}
</style>
