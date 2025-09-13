<template>
  <div class="input-actions">
    <BaseButton
      variant="ghost"
      size="xs"
      @click="$emit('file-upload')"
      aria-label="Upload file"
      :disabled="disabled"
    >
      📎
    </BaseButton>
    
    <BaseButton
      variant="ghost"
      size="xs"
      @click="$emit('camera')"
      aria-label="Take photo"
      :disabled="disabled"
    >
      📷
    </BaseButton>
    
    <BaseButton
      variant="ghost"
      size="xs"
      @click="$emit('voice')"
      aria-label="Record voice message"
      :disabled="disabled"
    >
      🎤
    </BaseButton>
    
    <BaseButton
      variant="ghost"
      size="xs"
      @click="$emit('toggle-check')"
      aria-label="Toggle check on focused message"
      :disabled="disabled"
    >
      ✓
    </BaseButton>
    
    <BaseButton
      variant="primary"
      size="sm"
      @click="$emit('send')"
      :disabled="!canSend || disabled"
      aria-label="Send message"
    >
      Send
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  disabled?: boolean
  canSend?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  canSend: false
})

defineEmits<{
  'file-upload': []
  'camera': []
  'voice': []
  'toggle-check': []
  'send': []
}>()
</script>

<style scoped>
.input-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem; /* Reduced gap to save space */
  flex-shrink: 0;
}

/* Mobile-only for the checked toggle button */
.input-actions [aria-label="Toggle check on focused message"] { display: none; }
@media (max-width: 480px) {
  .input-actions [aria-label="Toggle check on focused message"] { display: inline-flex; }
}
</style>
