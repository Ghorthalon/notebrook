<template>
  <button 
    :type="type"
    :disabled="disabled"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--loading': loading }
    ]"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    @click="$emit('click', $event)"
    @keydown="handleKeydown"
  >
    <span v-if="loading" class="base-button__spinner" aria-hidden="true"></span>
    <span :class="{ 'base-button__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
  ariaDescribedby?: string
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const btn = event.currentTarget as HTMLButtonElement | null
    // Trigger native click so type="submit" works and parent @click receives it
    btn?.click()
  }
}
</script>

<style scoped>
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  text-decoration: none;
  /* iOS-specific optimizations */
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.base-button:focus-visible {
  outline: 2px solid #646cff;
  outline-offset: 2px;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Sizes */
.base-button--xs {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  min-height: 2.25rem; /* 36px - smaller but still usable */
  min-width: 2.25rem;
}

.base-button--sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  min-height: 2.75rem; /* 44px minimum for iOS touch targets */
  min-width: 2.75rem;
}

.base-button--md {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  min-height: 2.75rem;
  min-width: 2.75rem;
}

.base-button--lg {
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
  min-height: 3rem;
  min-width: 3rem;
}

/* Variants */
.base-button--primary {
  background-color: #646cff;
  color: white;
}

.base-button--primary:hover:not(:disabled) {
  background-color: #535bf2;
}

.base-button--secondary {
  background-color: #f9f9f9;
  color: #213547;
  border-color: #d1d5db;
}

.base-button--secondary:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.base-button--danger {
  background-color: #ef4444;
  color: white;
}

.base-button--danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.base-button--ghost {
  background-color: transparent;
  color: #646cff;
  /* Ensure ghost buttons always meet minimum touch targets */
  min-height: 2.75rem;
  min-width: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Adjust xs ghost buttons for better emoji display */
.base-button--ghost.base-button--xs {
  min-height: 2.25rem;
  min-width: 2.25rem;
  padding: 0.25rem; /* Tighter padding for emoji buttons */
}

.base-button--ghost:hover:not(:disabled) {
  background-color: rgba(100, 108, 255, 0.1);
}

/* Loading state */
.base-button--loading {
  cursor: wait;
}

.base-button__spinner {
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.base-button__content--hidden {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .base-button--secondary {
    background-color: #374151;
    color: rgba(255, 255, 255, 0.87);
    border-color: #4b5563;
  }
  
  .base-button--secondary:hover:not(:disabled) {
    background-color: #4b5563;
    border-color: #6b7280;
  }
}
</style>
