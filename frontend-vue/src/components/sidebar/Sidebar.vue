<template>
  <aside class="sidebar">
    <div class="sidebar__header">
      <h1 class="sidebar__title">Notebrook</h1>
      <BaseButton
        variant="ghost"
        size="sm"
        @click="$emit('create-channel')"
        aria-label="Create new channel"
      >
        +
      </BaseButton>
    </div>
    
    <div class="sidebar__content">
      <ChannelList
        :channels="channels"
        :current-channel-id="currentChannelId"
        :unread-counts="unreadCounts"
        @select-channel="$emit('select-channel', $event)"
      />
    </div>
    
    <div class="sidebar__footer">
      <BaseButton
        variant="ghost"
        size="sm"
        @click="$emit('settings')"
        aria-label="Open settings"
      >
        ⚙️
      </BaseButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import ChannelList from './ChannelList.vue'
import type { Channel } from '@/types'

interface Props {
  channels: Channel[]
  currentChannelId: number | null
  unreadCounts: Record<number, number>
}

defineProps<Props>()

defineEmits<{
  'create-channel': []
  'select-channel': [channelId: number]
  'settings': []
}>()
</script>

<style scoped>
.sidebar {
  width: 300px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
}

.sidebar__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.sidebar__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar__footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .sidebar {
    background: #1f2937;
    border-right-color: #374151;
  }
  
  .sidebar__header {
    background: #1f2937;
    border-bottom-color: #374151;
  }
  
  .sidebar__title {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .sidebar__footer {
    background: #1f2937;
    border-top-color: #374151;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    width: 250px;
  }
  
  .sidebar__header {
    padding: 1rem;
  }
  
  .sidebar__title {
    font-size: 1.125rem;
  }
}
</style>