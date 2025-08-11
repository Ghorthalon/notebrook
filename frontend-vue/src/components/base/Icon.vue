<template>
  <span class="icon" :class="[`icon-${name}`, sizeClass]">
    <!-- Microphone -->
    <svg v-if="name === 'microphone'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4V10C14 11.1 13.1 12 12 12S10 11.1 10 10V4C10 2.9 10.9 2 12 2M19 10V12C19 15.3 16.3 18 13 18V22H11V18C7.7 18 5 15.3 5 12V10H7V12C7 14.2 8.8 16 11 16H13C15.2 16 17 14.2 17 12V10H19Z"/>
    </svg>

    <!-- Stop -->
    <svg v-else-if="name === 'stop'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18,18H6V6H18V18Z"/>
    </svg>

    <!-- Play -->
    <svg v-else-if="name === 'play'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
    </svg>

    <!-- Send -->
    <svg v-else-if="name === 'send'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
    </svg>

    <!-- Trash -->
    <svg v-else-if="name === 'trash'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
    </svg>

    <!-- Warning -->
    <svg v-else-if="name === 'warning'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>

    <!-- Info -->
    <svg v-else-if="name === 'info'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>

    <!-- Camera -->
    <svg v-else-if="name === 'camera'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"/>
    </svg>

    <!-- Upload -->
    <svg v-else-if="name === 'upload'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
    </svg>

    <!-- Close -->
    <svg v-else-if="name === 'close'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
    </svg>

    <!-- Search -->
    <svg v-else-if="name === 'search'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
    </svg>

    <!-- Plus -->
    <svg v-else-if="name === 'plus'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
    </svg>

    <!-- Settings -->
    <svg v-else-if="name === 'settings'" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
    </svg>

    <!-- Default fallback -->
    <svg v-else viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClass = computed(() => `icon-${props.size}`)
</script>

<style scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon svg {
  width: 100%;
  height: 100%;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-lg {
  width: 1.5rem;
  height: 1.5rem;
}

.icon-xl {
  width: 2rem;
  height: 2rem;
}
</style>