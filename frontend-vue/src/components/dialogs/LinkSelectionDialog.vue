<template>
  <div class="link-selection-dialog">
    <p class="link-selection-dialog__description">
      Select a link to open:
    </p>

    <div class="link-selection-dialog__links">
      <button
        v-for="(link, index) in links"
        :key="index"
        class="link-selection-dialog__link"
        @click="openLink(link)"
        :title="link"
      >
        <span class="link-selection-dialog__link-text">{{ formatLink(link) }}</span>
      </button>
    </div>

    <div class="link-selection-dialog__actions">
      <BaseButton
        variant="ghost"
        @click="$emit('close')"
      >
        Cancel
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  links: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const toastStore = useToastStore()

const formatLink = (url: string): string => {
  try {
    const parsed = new URL(url)
    // Show domain + pathname, truncate if too long
    let display = parsed.hostname + parsed.pathname
    if (display.length > 50) {
      display = display.slice(0, 47) + '...'
    }
    return display
  } catch {
    // If URL parsing fails, truncate the raw URL
    return url.length > 50 ? url.slice(0, 47) + '...' : url
  }
}

const openLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
  toastStore.success('Opening link')
  emit('close')
}
</script>

<style scoped>
.link-selection-dialog {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.link-selection-dialog__description {
  color: #374151;
  margin: 0;
}

.link-selection-dialog__links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.link-selection-dialog__link {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #1d4ed8;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  word-break: break-all;
}

.link-selection-dialog__link:hover,
.link-selection-dialog__link:focus {
  background: #eff6ff;
  border-color: #3b82f6;
  outline: none;
}

.link-selection-dialog__link-text {
  display: block;
}

.link-selection-dialog__actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .link-selection-dialog__description {
    color: rgba(255, 255, 255, 0.87);
  }

  .link-selection-dialog__link {
    background: #374151;
    border-color: #4b5563;
    color: #60a5fa;
  }

  .link-selection-dialog__link:hover,
  .link-selection-dialog__link:focus {
    background: #1e3a5f;
    border-color: #60a5fa;
  }

  .link-selection-dialog__actions {
    border-top-color: #374151;
  }
}
</style>
