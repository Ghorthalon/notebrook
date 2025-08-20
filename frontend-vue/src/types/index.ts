// API Types matching backend schema
export interface Channel {
  id: number
  name: string
  created_at: string
}

export interface Message {
  id: number
  channel_id: number
  content: string
  created_at: string
  file_id?: number
}

export interface MessageWithFile extends Message {
  fileId?: number
  filePath?: string
  fileType?: string
  fileSize?: number
  originalName?: string
  fileCreatedAt?: string
}

export interface FileAttachment {
  id: number
  channel_id: number
  message_id: number
  file_path: string
  file_type: string
  file_size: number
  original_name: string
  created_at: string
}

// For compatibility, ExtendedMessage now represents the flattened structure from backend
export interface ExtendedMessage extends MessageWithFile {
  files?: FileAttachment[] // Keep for backward compatibility but won't be used
}

// Mutable versions for store operations
export interface MutableMessage {
  id: number
  channel_id: number
  content: string
  created_at: string
  file_id?: number
  files?: FileAttachment[]
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: 'message-created' | 'message-updated' | 'message-deleted' | 
        'file-uploaded' | 'channel-created' | 'channel-deleted' | 
        'channel-merged' | 'channel-updated'
  data: any
}

// Frontend State Types
export interface AppState {
  isAuthenticated: boolean
  currentChannelId: number | null
  channels: Channel[]
  messages: Record<number, ExtendedMessage[]>
  unsentMessages: UnsentMessage[]
  settings: AppSettings
}

export interface UnsentMessage {
  id: string
  channelId: number
  content: string
  timestamp: number
  retries: number
  // File message support (for future offline retry capability)
  messageType?: 'text' | 'voice' | 'image'
  fileData?: {
    blob: Blob
    fileName: string
    fileType: string
    fileSize: number
  }
}

export interface AppSettings {
  soundEnabled: boolean
  speechEnabled: boolean
  ttsEnabled: boolean
  ttsRate: number
  ttsPitch: number
  ttsVolume: number
  selectedVoiceURI: string | null
  defaultChannelId: number | null
  theme: 'light' | 'dark' | 'auto'
  serverUrl?: string | null
}

// Audio Types
export interface AudioState {
  isRecording: boolean
  recordingTime: number
  audioBlob: Blob | null
  isPlaying: boolean
  playbackTime: number
  duration: number
}

// UI State Types
export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export interface DialogState {
  isOpen: boolean
  component: string | null
  props: Record<string, any>
}

// Search Types
export interface SearchResult {
  message: ExtendedMessage
  channel: Channel
}

// File Upload Types
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}