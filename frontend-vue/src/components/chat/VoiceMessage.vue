<template>
  <div class="voice-message">
    <div class="voice-player">
      <button 
        @click="togglePlayback"
        class="play-button"
        :disabled="loading"
      >
        <Icon :name="isPlaying ? 'pause' : 'play'" size="sm" />
      </button>
      
      <div class="voice-info">
        <div class="voice-waveform">
          <div class="progress-bar">
            <div 
              class="progress" 
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
        
        <div class="voice-meta" aria-live="off">
          <span class="duration">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
        </div>
      </div>
      
      <button 
        @click="downloadVoice"
        class="download-button"
        title="Download"
      >
        <Icon name="download" size="sm" />
      </button>
    </div>
    
    <div class="voice-filename">
      {{ file.original_name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { apiService } from '@/services/api'
import Icon from '@/components/base/Icon.vue'
import type { FileAttachment } from '@/types'

interface Props {
  file: FileAttachment
}

const props = defineProps<Props>()

const isPlaying = ref(false)
const loading = ref(false)
const currentTime = ref(0)
const duration = ref(0)
let audio: HTMLAudioElement | null = null

const audioUrl = computed(() => apiService.getFileUrl(props.file.file_path))

const progress = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

const togglePlayback = async () => {
  if (!audio) {
    await initAudio()
  }
  
  if (!audio) return
  
  if (isPlaying.value) {
    audio.pause()
  } else {
    await audio.play()
  }
}

const initAudio = async () => {
  try {
    loading.value = true
    audio = new Audio(audioUrl.value)
    
    audio.addEventListener('loadedmetadata', () => {
      const audioDuration = audio!.duration
      duration.value = isFinite(audioDuration) && !isNaN(audioDuration) ? audioDuration : 0
    })
    
    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio!.currentTime
    })
    
    audio.addEventListener('play', () => {
      isPlaying.value = true
    })
    
    audio.addEventListener('pause', () => {
      isPlaying.value = false
    })
    
    audio.addEventListener('ended', () => {
      isPlaying.value = false
      currentTime.value = 0
    })
    
    await audio.load()
    
  } catch (error) {
    console.error('Failed to load audio:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) {
    return '0:00'
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const downloadVoice = async () => {
  try {
    const response = await fetch(audioUrl.value)
    const blob = await response.blob()
    
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = props.file.original_name
    link.click()
    
    // Clean up the blob URL after download
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  } catch (error) {
    console.error('Failed to download voice message:', error)
    // Fallback to direct link
    const link = document.createElement('a')
    link.href = audioUrl.value
    link.download = props.file.original_name
    link.target = '_blank'
    link.click()
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
})
</script>

<style scoped>
.voice-message {
  margin: 0.5rem 0;
  max-width: 350px;
}

.voice-player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.play-button:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.05);
}

.play-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.voice-info {
  flex: 1;
  min-width: 0;
}

.voice-waveform {
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #3b82f6;
  transition: width 0.1s ease;
}

.voice-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.duration {
  color: #374151;
  font-weight: 500;
}

.file-size {
  color: #6b7280;
}

.download-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.download-button:hover {
  background: #f9fafb;
  color: #374151;
  border-color: #9ca3af;
}

.voice-filename {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .voice-player {
    background: #374151;
    border-color: #4b5563;
  }
  
  .progress-bar {
    background: #4b5563;
  }
  
  .progress {
    background: #60a5fa;
  }
  
  .duration {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .file-size {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .download-button {
    color: rgba(255, 255, 255, 0.6);
    border-color: #4b5563;
  }
  
  .download-button:hover {
    background: #4b5563;
    color: rgba(255, 255, 255, 0.87);
    border-color: #6b7280;
  }
  
  .voice-filename {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>