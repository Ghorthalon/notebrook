import type { Channel, Message, ExtendedMessage, FileAttachment } from '@/types'

class ApiService {
  private baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : ''
  private token = ''

  setToken(token: string) {
    this.token = token
    console.log('API service token set:', token ? `${token.substring(0, 10)}...` : 'null')
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
    console.log('API service base URL set:', url)
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': this.token,
      'Content-Type': 'application/json'
    }
  }

  private getFormHeaders(): HeadersInit {
    return {
      'Authorization': this.token
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      ...this.getHeaders(),
      ...options.headers
    }
    
    console.log('Making API request to:', url, 'with headers:', headers)
    
    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Authentication
  async checkToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/check-token`, {
        headers: { Authorization: this.token }
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Channels
  async getChannels(): Promise<{ channels: Channel[] }> {
    return this.request('/channels')
  }

  async createChannel(name: string): Promise<Channel> {
    return this.request('/channels', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  }

  async updateChannel(channelId: number, name: string): Promise<{ message: string }> {
    return this.request(`/channels/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    })
  }

  async deleteChannel(channelId: number): Promise<{ message: string }> {
    return this.request(`/channels/${channelId}`, {
      method: 'DELETE'
    })
  }

  async mergeChannels(sourceChannelId: number, targetChannelId: number): Promise<{ message: string }> {
    return this.request(`/channels/${sourceChannelId}/merge`, {
      method: 'PUT',
      body: JSON.stringify({ targetChannelId: targetChannelId.toString() })
    })
  }

  // Messages
  async getMessages(channelId: number): Promise<{ messages: ExtendedMessage[] }> {
    return this.request(`/channels/${channelId}/messages`)
  }

  async createMessage(channelId: number, content: string): Promise<Message> {
    return this.request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  }

  async updateMessage(channelId: number, messageId: number, content: string): Promise<{ id: string, content: string }> {
    return this.request(`/channels/${channelId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    })
  }

  async deleteMessage(channelId: number, messageId: number): Promise<{ message: string }> {
    return this.request(`/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE'
    })
  }

  async setMessageChecked(channelId: number, messageId: number, checked: boolean | null): Promise<{ id: number, checked: boolean | null }> {
    return this.request(`/channels/${channelId}/messages/${messageId}/checked`, {
      method: 'PUT',
      body: JSON.stringify({ checked })
    })
  }

  async moveMessage(channelId: number, messageId: number, targetChannelId: number): Promise<{ message: string, messageId: number, targetChannelId: number }> {
    return this.request(`/channels/${channelId}/messages/${messageId}/move`, {
      method: 'PUT',
      body: JSON.stringify({ targetChannelId })
    })
  }

  // Files
  async uploadFile(channelId: number, messageId: number, file: File): Promise<FileAttachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/channels/${channelId}/messages/${messageId}/files`, {
      method: 'POST',
      headers: this.getFormHeaders(),
      body: formData
    })

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getFiles(channelId: number, messageId: number): Promise<{ files: FileAttachment[] }> {
    return this.request(`/channels/${channelId}/messages/${messageId}/files`)
  }

  // Search
  async search(query: string, channelId?: number): Promise<{ results: Message[] }> {
    const params = new URLSearchParams({ query })
    if (channelId) {
      params.append('channelId', channelId.toString())
    }
    return this.request(`/search?${params.toString()}`)
  }

  // File URL helper
  getFileUrl(filePath: string): string {
    return `${this.baseUrl}/uploads/${filePath.replace(/^.*\/uploads\//, '')}`
  }

  // Backup - returns a download URL
  async downloadBackup(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/backup`, {
      headers: { Authorization: this.token }
    })

    if (!response.ok) {
      throw new Error(`Backup failed: ${response.status} ${response.statusText}`)
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = 'notebrook-backup.db'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/)
      if (match && match[1]) filename = match[1]
    }

    // Download the file
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Restore - upload a .db file
  async restoreBackup(file: File): Promise<{ success: boolean; message: string; stats: { channels: number; messages: number; files: number } }> {
    const formData = new FormData()
    formData.append('database', file)

    const response = await fetch(`${this.baseUrl}/backup`, {
      method: 'POST',
      headers: { Authorization: this.token },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Restore failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiService = new ApiService()
