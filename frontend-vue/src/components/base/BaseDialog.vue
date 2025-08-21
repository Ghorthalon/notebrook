<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div 
        v-if="show"
        class="dialog-overlay"
        @click="handleOverlayClick"
        @keydown.esc="handleClose"
        role="dialog"
        :aria-labelledby="titleId"
        aria-modal="true"
      >
        <div
          ref="dialogRef"
          :class="[
            'dialog',
            `dialog--${size}`
          ]"
          @click.stop
        >
          <div class="dialog__header" v-if="$slots.header || title">
            <h2 :id="titleId" class="dialog__title">
              <slot name="header">{{ title }}</slot>
            </h2>
            <button
              v-if="closable"
              class="dialog__close"
              @click="handleClose"
              aria-label="Close dialog"
              type="button"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          
          <div :id="contentId" class="dialog__content">
            <slot />
          </div>
          
          <div v-if="$slots.footer" class="dialog__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

interface Props {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true
})

const emit = defineEmits<{
  close: []
  'update:show': [value: boolean]
}>()

const dialogRef = ref<HTMLDivElement>()
const titleId = computed(() => `dialog-title-${Math.random().toString(36).substr(2, 9)}`)
const contentId = computed(() => `dialog-content-${Math.random().toString(36).substr(2, 9)}`)

const handleClose = () => {
  emit('close')
  emit('update:show', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

// Focus management
let lastFocusedElement: HTMLElement | null = null

const trapFocus = (event: KeyboardEvent) => {
  if (event.key !== 'Tab') return
  
  const focusableElements = dialogRef.value?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  if (!focusableElements || focusableElements.length === 0) return
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

watch(() => props.show, async (isVisible) => {
  if (isVisible) {
    lastFocusedElement = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', trapFocus)
    
    await nextTick()
    
    // Focus first focusable element or the dialog itself
    const firstFocusable = dialogRef.value?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      dialogRef.value?.focus()
    }
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', trapFocus)
    
    // Restore focus to the element that was focused before the dialog opened
    if (lastFocusedElement) {
      lastFocusedElement.focus()
      lastFocusedElement = null
    }
  }
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.dialog {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  outline: none;
}

.dialog--sm {
  width: 100%;
  max-width: 24rem;
}

.dialog--md {
  width: 100%;
  max-width: 32rem;
}

.dialog--lg {
  width: 100%;
  max-width: 48rem;
}

.dialog--xl {
  width: 100%;
  max-width: 64rem;
}

.dialog__header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.dialog__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s ease;
}

.dialog__close:hover {
  color: #374151;
}

.dialog__close:focus-visible {
  outline: 2px solid #646cff;
  outline-offset: 2px;
  border-radius: 4px;
}

.dialog__content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.dialog__footer {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active .dialog,
.dialog-leave-active .dialog {
  transition: transform 0.3s ease;
}

.dialog-enter-from .dialog,
.dialog-leave-to .dialog {
  transform: scale(0.9);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .dialog {
    background: #1f2937;
  }
  
  .dialog__title {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .dialog__close {
    color: #9ca3af;
  }
  
  .dialog__close:hover {
    color: rgba(255, 255, 255, 0.87);
  }
}
</style>