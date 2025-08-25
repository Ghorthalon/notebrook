import { onMounted, onUnmounted } from 'vue'
import { websocketService } from '@/services/websocket'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useAudio } from '@/composables/useAudio'
import type { Channel, ExtendedMessage, FileAttachment } from '@/types'

export function useWebSocket() {
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const toastStore = useToastStore()
  const { announceMessage } = useAudio()

  const handleMessageCreated = (data: any) => {
    console.log('WebSocket: Message created event received:', data)
    console.log('Original content:', JSON.stringify(data.content))
    // Transform the data to match our expected format
    const message: ExtendedMessage = {
      id: data.id,
      channel_id: parseInt(data.channelId), // Convert channelId string to channel_id number
      content: data.content,
      created_at: data.createdAt || new Date().toISOString(),
      file_id: data.fileId,
      // Handle flattened file fields
      fileId: data.fileId,
      filePath: data.filePath,
      fileType: data.fileType,
      fileSize: data.fileSize,
      originalName: data.originalName,
      fileCreatedAt: data.fileCreatedAt
    }
    console.log('WebSocket: Transformed message:', message)
    console.log('Transformed content:', JSON.stringify(message.content))
    appStore.addMessage(message)
    
    // Announce new message for accessibility
    const channel = appStore.channels.find(c => c.id === message.channel_id)
    if (channel && appStore.settings.ttsEnabled) {
      announceMessage(message.content, channel.name)
    }
  }

  const handleMessageUpdated = (data: any) => {
    // Handle full message updates including file metadata
    const messageUpdate: Partial<ExtendedMessage> = {
      content: data.content
    }
    
    // Handle flattened file fields from server
    if (data.fileId) {
      messageUpdate.fileId = data.fileId
      messageUpdate.filePath = data.filePath
      messageUpdate.fileType = data.fileType
      messageUpdate.fileSize = data.fileSize
      messageUpdate.originalName = data.originalName
      messageUpdate.fileCreatedAt = data.fileCreatedAt
    }
    
    appStore.updateMessage(parseInt(data.id), messageUpdate)
  }

  const handleMessageDeleted = (data: { id: string }) => {
    appStore.removeMessage(parseInt(data.id))
  }

  const handleMessageMoved = (data: { messageId: string, sourceChannelId: string, targetChannelId: string }) => {
    console.log('WebSocket: Message moved event received:', data)
    const messageId = parseInt(data.messageId)
    const sourceChannelId = parseInt(data.sourceChannelId) 
    const targetChannelId = parseInt(data.targetChannelId)
    
    appStore.moveMessage(messageId, sourceChannelId, targetChannelId)
    
    // Show toast notification if the move affects the current view
    if (appStore.currentChannelId === sourceChannelId || appStore.currentChannelId === targetChannelId) {
      const sourceChannel = appStore.channels.find(c => c.id === sourceChannelId)
      const targetChannel = appStore.channels.find(c => c.id === targetChannelId)
      if (sourceChannel && targetChannel) {
        toastStore.info(`Message moved from "${sourceChannel.name}" to "${targetChannel.name}"`)
      }
    }
  }

  const handleFileUploaded = (data: any) => {
    // Handle file upload events with flattened format
    const messageUpdate: Partial<ExtendedMessage> = {
      fileId: data.fileId,
      filePath: data.filePath, 
      fileType: data.fileType,
      fileSize: data.fileSize,
      originalName: data.originalName,
      fileCreatedAt: data.fileCreatedAt
    }
    
    appStore.updateMessage(data.message_id, messageUpdate)
  }

  const handleChannelCreated = (data: { channel: Channel }) => {
    appStore.addChannel(data.channel)
    toastStore.success(`Channel "${data.channel.name}" created`)
  }

  const handleChannelDeleted = (data: { id: string }) => {
    const channelId = parseInt(data.id)
    const channel = appStore.channels.find(c => c.id === channelId)
    appStore.removeChannel(channelId)
    if (channel) {
      toastStore.info(`Channel "${channel.name}" was deleted`)
    }
  }

  const handleChannelMerged = (data: { channelId: string, targetChannelId: string }) => {
    const sourceChannelId = parseInt(data.channelId)
    const targetChannelId = parseInt(data.targetChannelId)
    
    const sourceChannel = appStore.channels.find(c => c.id === sourceChannelId)
    const targetChannel = appStore.channels.find(c => c.id === targetChannelId)
    
    if (sourceChannel && targetChannel) {
      // Merge messages from source to target  
      const sourceMessages = [...(appStore.messages[sourceChannelId] || [])]
      const targetMessages = [...(appStore.messages[targetChannelId] || [])]
      appStore.setMessages(targetChannelId, [...targetMessages, ...sourceMessages])
      
      // Remove source channel
      appStore.removeChannel(sourceChannelId)
      
      toastStore.success(`Channel "${sourceChannel.name}" merged into "${targetChannel.name}"`)
    }
  }

  const handleChannelUpdated = (data: { id: string, name: string }) => {
    // Update channel in store (if we implement channel renaming)
    const channelId = parseInt(data.id)
    const channels = [...appStore.channels]
    const channelIndex = channels.findIndex(c => c.id === channelId)
    if (channelIndex !== -1) {
      channels[channelIndex] = { ...channels[channelIndex], name: data.name }
      appStore.setChannels(channels)
    }
  }

  const setupEventHandlers = () => {
    websocketService.on('message-created', handleMessageCreated)
    websocketService.on('message-updated', handleMessageUpdated)
    websocketService.on('message-deleted', handleMessageDeleted)
    websocketService.on('message-moved', handleMessageMoved)
    websocketService.on('file-uploaded', handleFileUploaded)
    websocketService.on('channel-created', handleChannelCreated)
    websocketService.on('channel-deleted', handleChannelDeleted)
    websocketService.on('channel-merged', handleChannelMerged)
    websocketService.on('channel-updated', handleChannelUpdated)

    websocketService.on('connected', () => {
      console.log('WebSocket connected successfully')
      toastStore.success('Connected to server')
    })

    websocketService.on('disconnected', () => {
      toastStore.error('Disconnected from server')
    })

    websocketService.on('error', () => {
      toastStore.error('WebSocket connection error')
    })
  }

  const removeEventHandlers = () => {
    websocketService.off('message-created', handleMessageCreated)
    websocketService.off('message-updated', handleMessageUpdated)
    websocketService.off('message-deleted', handleMessageDeleted)
    websocketService.off('message-moved', handleMessageMoved)
    websocketService.off('file-uploaded', handleFileUploaded)
    websocketService.off('channel-created', handleChannelCreated)
    websocketService.off('channel-deleted', handleChannelDeleted)
    websocketService.off('channel-merged', handleChannelMerged)
    websocketService.off('channel-updated', handleChannelUpdated)
  }

  onMounted(() => {
    // Set custom server URL if available
    if (authStore.serverUrl) {
      websocketService.setServerUrl(authStore.serverUrl)
    }
    
    setupEventHandlers()
    websocketService.connect()
  })

  onUnmounted(() => {
    removeEventHandlers()
    websocketService.disconnect()
  })

  return {
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
    isConnected: () => websocketService.isConnected
  }
}