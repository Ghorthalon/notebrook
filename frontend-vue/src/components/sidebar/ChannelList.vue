<template>
  <div class="channel-list-container" ref="containerRef">
    <ul class="channel-list" role="list" aria-label="Channels">
      <ChannelListItem
        v-for="(channel, index) in channels"
        :key="channel.id"
        :channel="channel"
        :is-active="channel.id === currentChannelId"
        :unread-count="unreadCounts[channel.id]"
        :tabindex="index === focusedChannelIndex ? 0 : -1"
        :channel-index="index"
        :data-channel-index="index"
        @select="handleChannelSelect"
        @info="$emit('channel-info', $event)"
        @keydown="handleChannelKeydown"
        @focus="handleChannelFocus"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import ChannelListItem from './ChannelListItem.vue'
import type { Channel } from '@/types'

interface Props {
  channels: Channel[]
  currentChannelId: number | null
  unreadCounts: Record<number, number>
}

const emit = defineEmits<{
  'select-channel': [channelId: number]
  'channel-info': [channel: Channel]
}>()

const props = defineProps<Props>()

const containerRef = ref<HTMLElement>()
const focusedChannelIndex = ref(0)

// Handle individual channel events
const handleChannelSelect = (channelId: number) => {
  emit('select-channel', channelId)
}

const handleChannelFocus = (index: number) => {
  focusedChannelIndex.value = index
}

const handleChannelKeydown = (event: KeyboardEvent, channelIndex: number) => {
  if (props.channels.length === 0) return
  
  // Don't handle keys with modifiers - let them bubble up for global shortcuts
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return
  }
  
  let newIndex = channelIndex
  
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      newIndex = Math.max(0, channelIndex - 1)
      break
      
    case 'ArrowDown':
      event.preventDefault()
      newIndex = Math.min(props.channels.length - 1, channelIndex + 1)
      break
      
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
      
    case 'End':
      event.preventDefault()
      newIndex = props.channels.length - 1
      break
      
    case 'Enter':
    case ' ':
      event.preventDefault()
      const selectedChannel = props.channels[channelIndex]
      if (selectedChannel) {
        emit('select-channel', selectedChannel.id)
      }
      return
      
    case 'i':
    case 'I':
      // Only handle 'i' without modifiers
      if (!event.shiftKey) {
        event.preventDefault()
        const infoChannel = props.channels[channelIndex]
        if (infoChannel) {
          emit('channel-info', infoChannel)
        }
        return
      }
      break
      
    default:
      return
  }
  
  if (newIndex !== channelIndex) {
    focusChannel(newIndex)
  }
}

const focusChannel = (index: number) => {
  focusedChannelIndex.value = index
  nextTick(() => {
    const buttonElement = containerRef.value?.querySelector(`[data-channel-index="${index}"] .channel-button`) as HTMLElement
    if (buttonElement) {
      buttonElement.focus()
      buttonElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}


// Watch for channels changes and adjust focus
watch(() => props.channels.length, (newLength) => {
  if (focusedChannelIndex.value >= newLength) {
    focusedChannelIndex.value = Math.max(0, newLength - 1)
  }
})

// Set initial focus to current channel or first channel
watch(() => props.currentChannelId, (newChannelId) => {
  if (newChannelId) {
    const index = props.channels.findIndex(channel => channel.id === newChannelId)
    if (index !== -1) {
      focusedChannelIndex.value = index
    }
  }
}, { immediate: true })

onMounted(() => {
  // Focus the current channel if available
  if (props.currentChannelId) {
    const index = props.channels.findIndex(channel => channel.id === props.currentChannelId)
    if (index !== -1) {
      focusedChannelIndex.value = index
    }
  }
})

defineExpose({
  focusChannel
})
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