import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { get, set } from 'idb-keyval'
import type { Channel, ExtendedMessage, UnsentMessage, AppSettings } from '@/types'

export const useAppStore = defineStore('app', () => {
  // State
  const channels = ref<Channel[]>([])
  const currentChannelId = ref<number | null>(null)
  const messages = ref<Record<number, ExtendedMessage[]>>({})
  const unsentMessages = ref<UnsentMessage[]>([])
  const settings = ref<AppSettings>({
    soundEnabled: true,
    speechEnabled: true,
    ttsEnabled: true,
    ttsRate: 1,
    ttsPitch: 1,
    ttsVolume: 1,
    selectedVoiceURI: null,
    defaultChannelId: null,
    theme: 'auto'
  })

  // Computed
  const currentChannel = computed(() => 
    channels.value.find(c => c.id === currentChannelId.value) || null
  )

  const currentMessages = computed(() => {
    const channelId = currentChannelId.value
    const channelMessages = channelId ? messages.value[channelId] || [] : []
    return channelMessages
  })

  const unsentMessagesForChannel = computed(() => 
    currentChannelId.value 
      ? unsentMessages.value.filter(msg => msg.channelId === currentChannelId.value)
      : []
  )

  // Actions
  const setChannels = (newChannels: Channel[]) => {
    channels.value = newChannels
  }

  const addChannel = (channel: Channel) => {
    channels.value.push(channel)
    messages.value[channel.id] = []
  }

  const removeChannel = (channelId: number) => {
    channels.value = channels.value.filter(c => c.id !== channelId)
    delete messages.value[channelId]
    if (currentChannelId.value === channelId) {
      currentChannelId.value = channels.value[0]?.id || null
    }
  }

  const setCurrentChannel = async (channelId: number | null) => {
    currentChannelId.value = channelId
    await set('current_channel_id', channelId)
  }

  const setMessages = (channelId: number, channelMessages: ExtendedMessage[]) => {
    console.log('Store: Setting messages for channel', channelId, ':', channelMessages.length, 'messages')
    messages.value[channelId] = channelMessages
  }

  const addMessage = (message: ExtendedMessage) => {
    console.log('Store: Adding message to channel', message.channel_id, ':', message)
    if (!messages.value[message.channel_id]) {
      messages.value[message.channel_id] = []
    }

    const channelMessages = messages.value[message.channel_id]
    if (!channelMessages) return

    const existingIndex = channelMessages.findIndex(m => m.id === message.id)

    if (existingIndex !== -1) {
      // Upsert: update existing to avoid duplicates from WebSocket vs sync
      const existingMessage = channelMessages[existingIndex]
      if (existingMessage) {
        channelMessages[existingIndex] = { ...existingMessage, ...message }
      }
    } else {
      channelMessages.push(message)
    }

    // Keep chronological order by created_at
    channelMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    console.log('Store: Messages for channel', message.channel_id, 'now has', channelMessages.length, 'messages')

    // Note: Auto-save is now handled by the sync service to avoid excessive I/O
  }

  const updateMessage = (messageId: number, updates: Partial<ExtendedMessage>) => {
    for (const channelId in messages.value) {
      const channelMessages = messages.value[parseInt(channelId)]
      if (!channelMessages) continue

      const messageIndex = channelMessages.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        const existingMessage = channelMessages[messageIndex]
        if (existingMessage) {
          channelMessages[messageIndex] = { ...existingMessage, ...updates }
        }
        break
      }
    }
  }

  const setMessageChecked = (messageId: number, checked: boolean | null) => {
    updateMessage(messageId, { checked })
  }

  const removeMessage = (messageId: number) => {
    for (const channelId in messages.value) {
      const channelMessages = messages.value[parseInt(channelId)]
      if (!channelMessages) continue

      const messageIndex = channelMessages.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        channelMessages.splice(messageIndex, 1)
        break
      }
    }
  }

  const moveMessage = (messageId: number, sourceChannelId: number, targetChannelId: number) => {
    // Find and remove message from source channel
    const sourceMessages = messages.value[sourceChannelId] || []
    const messageIndex = sourceMessages.findIndex(m => m.id === messageId)
    
    if (messageIndex === -1) {
      console.warn(`Message ${messageId} not found in source channel ${sourceChannelId}`)
      return
    }
    
    const message = sourceMessages[messageIndex]
    if (!message) {
      console.warn(`Message ${messageId} not found at index ${messageIndex}`)
      return
    }

    sourceMessages.splice(messageIndex, 1)

    // Update message's channel_id and add to target channel
    const updatedMessage = { ...message, channel_id: targetChannelId }

    if (!messages.value[targetChannelId]) {
      messages.value[targetChannelId] = []
    }

    const targetMessages = messages.value[targetChannelId]
    if (!targetMessages) return

    targetMessages.push(updatedMessage)
    
    // Keep chronological order in target channel
    targetMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    console.log(`Message ${messageId} moved from channel ${sourceChannelId} to ${targetChannelId}`)
  }

  const addUnsentMessage = (message: UnsentMessage) => {
    unsentMessages.value.push(message)
  }

  const removeUnsentMessage = (messageId: string) => {
    const index = unsentMessages.value.findIndex(m => m.id === messageId)
    if (index !== -1) {
      unsentMessages.value.splice(index, 1)
    }
  }

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    await set('app_settings', JSON.parse(JSON.stringify(settings.value)))
  }

  const loadState = async () => {
    try {
      const [storedChannelId, storedMessages, storedUnsentMessages, storedSettings] = await Promise.all([
        get('current_channel_id'),
        get('messages'),
        get('unsent_messages'),
        get('app_settings')
      ])

      if (storedChannelId) currentChannelId.value = storedChannelId
      if (storedMessages) messages.value = storedMessages
      if (storedUnsentMessages) unsentMessages.value = storedUnsentMessages
      if (storedSettings) settings.value = { ...settings.value, ...storedSettings }
    } catch (error) {
      console.error('Failed to load state from storage:', error)
    }
  }

  const saveState = async () => {
    try {
      // Convert reactive objects to plain objects for IndexedDB
      await Promise.all([
        set('current_channel_id', currentChannelId.value),
        set('messages', JSON.parse(JSON.stringify(messages.value))),
        set('unsent_messages', JSON.parse(JSON.stringify(unsentMessages.value))),
        set('app_settings', JSON.parse(JSON.stringify(settings.value)))
      ])
    } catch (error) {
      console.error('Failed to save state to storage:', error)
    }
  }

  return {
    // State
    channels,
    currentChannelId,
    messages,
    unsentMessages,
    settings,

    // Computed
    currentChannel,
    currentMessages,
    unsentMessagesForChannel,

    // Actions
    setChannels,
    addChannel,
    removeChannel,
    setCurrentChannel,
    setMessages,
    addMessage,
    updateMessage,
    setMessageChecked,
    removeMessage,
    moveMessage,
    addUnsentMessage,
    removeUnsentMessage,
    updateSettings,
    loadState,
    saveState
  }
})
