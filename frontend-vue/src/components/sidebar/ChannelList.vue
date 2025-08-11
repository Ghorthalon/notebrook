<template>
  <div class="channel-list-container">
    <ul class="channel-list" role="list">
      <ChannelListItem
        v-for="channel in channels"
        :key="channel.id"
        :channel="channel"
        :is-active="channel.id === currentChannelId"
        :unread-count="unreadCounts[channel.id]"
        @select="$emit('select-channel', $event)"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import ChannelListItem from './ChannelListItem.vue'
import type { Channel } from '@/types'

interface Props {
  channels: Channel[]
  currentChannelId: number | null
  unreadCounts: Record<number, number>
}

defineProps<Props>()

defineEmits<{
  'select-channel': [channelId: number]
}>()
</script>

<style scoped>
.channel-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.channel-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Scrollbar styling */
.channel-list-container::-webkit-scrollbar {
  width: 6px;
}

.channel-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.channel-list-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.channel-list-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .channel-list-container::-webkit-scrollbar-thumb {
    background: #4b5563;
  }
  
  .channel-list-container::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
}
</style>