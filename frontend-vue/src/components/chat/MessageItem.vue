<template>
  <div
    :class="[
      'message',
      { 'message--unsent': isUnsent }
    ]"
    :data-message-id="message.id"
    :tabindex="tabindex || 0"
    :aria-label="messageAriaLabel"
    role="listitem"
    @keydown="handleKeydown"
  >
    <div class="message__content">
      {{ message.content }}
    </div>
    
    <!-- File Attachment -->
    <div v-if="hasFileAttachment && fileAttachment" class="message__files">
      <FileAttachment :file="fileAttachment" />
    </div>
    
    <div class="message__meta">
      <time v-if="!isUnsent && 'created_at' in message" class="message__time">
        {{ formatTime(message.created_at) }}
      </time>
      <span v-else class="message__status">Sending...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useToastStore } from '@/stores/toast'
import { useAppStore } from '@/stores/app'
import FileAttachment from './FileAttachment.vue'
import type { ExtendedMessage, UnsentMessage, FileAttachment as FileAttachmentType } from '@/types'

interface Props {
  message: ExtendedMessage | UnsentMessage
  isUnsent?: boolean
  tabindex?: number
}

const props = withDefaults(defineProps<Props>(), {
  isUnsent: false
})

// Debug message structure (removed for production)

const { speak, playSound } = useAudio()
const toastStore = useToastStore()
const appStore = useAppStore()

// Check if message has a file attachment
const hasFileAttachment = computed(() => {
  return 'fileId' in props.message && !!props.message.fileId
})

// Create FileAttachment object from flattened message data
const fileAttachment = computed((): FileAttachmentType | null => {
  if (!hasFileAttachment.value || !('fileId' in props.message)) return null
  
  return {
    id: props.message.fileId!,
    channel_id: props.message.channel_id,
    message_id: props.message.id,
    file_path: props.message.filePath!,
    file_type: props.message.fileType!,
    file_size: props.message.fileSize!,
    original_name: props.message.originalName!,
    created_at: props.message.fileCreatedAt || props.message.created_at
  }
})

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString()
}

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
    const time = formatTime(props.message.created_at)
    label += `. Sent at ${time}`
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
  }
}
</script>

<style scoped>
.message {
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.message:hover,
.message:focus {
  background: rgba(0, 0, 0, 0.02);
  border-color: #e5e7eb;
  outline: none;
}

.message:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.message--unsent {
  opacity: 0.7;
  background: #fef3c7;
  border-color: #fbbf24;
}

.message--highlighted {
  background: #dbeafe;
  border-color: #3b82f6;
  animation: highlight-fade 2s ease-out;
}

@keyframes highlight-fade {
  0% {
    background: #bfdbfe;
    border-color: #2563eb;
  }
  100% {
    background: #dbeafe;
    border-color: #3b82f6;
  }
}

.message__content {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #111827;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message__files {
  margin: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.message__time {
  font-size: 0.75rem;
  color: #6b7280;
}

.message__status {
  font-size: 0.75rem;
  color: #f59e0b;
  font-weight: 500;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .message:hover,
  .message:focus {
    background: rgba(255, 255, 255, 0.05);
    border-color: #374151;
  }
  
  .message:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
  }
  
  .message--unsent {
    background: #451a03;
    border-color: #92400e;
  }
  
  .message--highlighted {
    background: #1e3a8a;
    border-color: #60a5fa;
  }
  
  @keyframes highlight-fade {
    0% {
      background: #1e40af;
      border-color: #3b82f6;
    }
    100% {
      background: #1e3a8a;
      border-color: #60a5fa;
    }
  }
  
  .message__content {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .message__time {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .message__status {
    color: #fbbf24;
  }
}
</style>