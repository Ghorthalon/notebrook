<template>
  <header class="chat-header">
    <h2 class="chat-title">{{ channelName }}</h2>
    <div class="chat-actions">
      <BaseButton
        variant="ghost"
        size="sm"
        @click="$emit('search')"
        aria-label="Search messages"
      >
        🔍
      </BaseButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  channelName: string
}

defineProps<Props>()

defineEmits<{
  search: []
}>()
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  min-height: 64px;
}

.chat-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .chat-header {
    background: #1f2937;
    border-bottom-color: #374151;
  }
  
  .chat-title {
    color: rgba(255, 255, 255, 0.87);
  }
}
</style>