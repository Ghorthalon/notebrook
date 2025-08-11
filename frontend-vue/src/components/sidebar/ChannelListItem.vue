<template>
  <li
    :class="[
      'channel-item',
      { 'channel-item--active': isActive }
    ]"
  >
    <div class="channel-wrapper">
      <button
        class="channel-button"
        @click="$emit('select', channel.id)"
        :aria-pressed="isActive"
        :aria-label="`Select channel ${channel.name}`"
      >
        <span class="channel-name">{{ channel.name }}</span>
        <span v-if="unreadCount" class="channel-unread">
          {{ unreadCount }}
        </span>
      </button>
      
      <button
        class="channel-info-button"
        @click.stop="$emit('info', channel)"
        :aria-label="`Channel info for ${channel.name}`"
        title="Channel info"
      >
        ⚙️
      </button>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { Channel } from '@/types'

interface Props {
  channel: Channel
  isActive: boolean
  unreadCount?: number
}

defineProps<Props>()

defineEmits<{
  select: [channelId: number]
}>()
</script>

<style scoped>
.channel-item {
  list-style: none;
  margin: 0;
}

.channel-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 0 0.5rem 0.25rem 0.5rem;
}

.channel-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.channel-button:focus {
  outline: none;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.channel-item--active .channel-button {
  background: #3b82f6;
  color: white;
}

.channel-item--active .channel-button:hover {
  background: #2563eb;
}

.channel-name {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-unread {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.channel-item--active .channel-unread {
  background: rgba(255, 255, 255, 0.9);
  color: #3b82f6;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .channel-button {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .channel-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.87);
  }
  
  .channel-button:focus {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
  }
  
  .channel-item--active .channel-button {
    background: #3b82f6;
    color: white;
  }
  
  .channel-item--active .channel-button:hover {
    background: #2563eb;
  }
}
</style>