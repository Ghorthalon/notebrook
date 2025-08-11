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
  background: white;
  border-top: 1px solid #e5e7eb;
}

.message-input {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  max-width: 100%;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .message-input-container {
    background: #1f2937;
    border-top-color: #374151;
  }
}
</style>