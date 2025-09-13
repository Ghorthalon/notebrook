<template>
  <div class="message-input-container">
    <div class="message-input">
      <BaseTextarea
        v-model="messageText"
        placeholder="Type a message..."
        :rows="1"
        auto-resize
        @keydown="handleInputKeydown"
        @submit="handleSubmit"
        ref="textareaRef"
      />
      
      <InputActions
        :disabled="isDisabled"
        :can-send="canSend"
        @file-upload="$emit('file-upload')"
        @camera="$emit('camera')"
        @voice="$emit('voice')"
        @toggle-check="$emit('toggle-check')"
        @send="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAudio } from '@/composables/useAudio'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import InputActions from './InputActions.vue'

const emit = defineEmits<{
  'send-message': [content: string]
  'file-upload': []
  'camera': []
  'voice': []
  'toggle-check': []
}>()

const appStore = useAppStore()
const { playWater, playSent } = useAudio()

const messageText = ref('')
const textareaRef = ref()

const currentChannelId = computed(() => appStore.currentChannelId)
const isDisabled = computed(() => !currentChannelId.value)
const canSend = computed(() => messageText.value.trim().length > 0 && !!currentChannelId.value)

const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

const handleSubmit = () => {
  if (!canSend.value) return
  
  const content = messageText.value.trim()
  messageText.value = ''
  
  playWater()
  emit('send-message', content)
}

const focus = () => {
  textareaRef.value?.focus()
}

defineExpose({
  focus
})
</script>

<style scoped>
.message-input-container {
  padding: 1rem;
  padding-bottom: calc(1rem + var(--safe-area-inset-bottom));
  background: white;
  border-top: 1px solid #e5e7eb;
}

.message-input {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem; /* Reduced gap to save space */
  max-width: 100%;
}

.message-input :deep(.base-textarea) {
  flex: 1; /* Take all available space */
  min-width: 200px; /* Ensure minimum usable width */
}

.message-input :deep(.input-actions) {
  flex-shrink: 0; /* Don't allow action buttons to shrink */
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .message-input-container {
    padding: 0.75rem; /* Slightly less padding on very small screens */
  }
  
  .message-input :deep(.base-textarea) {
    min-width: 150px; /* Allow smaller minimum width on mobile */
  }
  
  /* Ensure buttons remain accessible on small screens */
  .message-input :deep(.input-actions) {
    gap: 0.125rem; /* Even tighter gap on mobile */
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .message-input-container {
    background: #1f2937;
    border-top-color: #374151;
  }
}
</style>
