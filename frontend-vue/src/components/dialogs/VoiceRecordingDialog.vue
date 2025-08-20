<template>
  <div class="voice-recording-dialog">
    <div class="recording-container">
      <!-- Recording Status -->
      <div class="recording-status">
        <div class="status-indicator" :class="{ 'recording': recording.isRecording, 'has-recording': recording.blob }">
          <div class="pulse" v-if="recording.isRecording"></div>
          <Icon name="microphone" />
        </div>
        <div class="status-text">
          <h3 v-if="recording.isRecording">Recording...</h3>
          <h3 v-else-if="recording.blob">Recording Complete</h3>
          <h3 v-else>Ready to Record</h3>
          <p class="duration">{{ recordingDurationFormatted }}</p>
        </div>
      </div>

      <!-- Waveform Visualization (placeholder) -->
      <div class="waveform" v-if="recording.isRecording">
        <div class="wave-bar" v-for="i in 20" :key="i" :style="{ height: getWaveHeight(i) + 'px' }"></div>
      </div>

      <!-- Playback Controls -->
      <div class="playback-controls" v-if="recording.blob">
        <div class="progress-bar">
          <div class="progress" :style="{ width: playbackProgress + '%' }"></div>
        </div>
        <div class="playback-time">
          {{ formatTime(recording.currentTime) }} / {{ formatTime(recording.duration) }}
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="controls">
        <BaseButton
          v-if="!recording.isRecording && !recording.blob"
          @click="startRecording"
          variant="primary"
          size="lg"
          :disabled="!canRecord"
          class="record-btn"
        >
          <Icon name="microphone" />
          Start Recording
        </BaseButton>

        <BaseButton
          v-if="recording.isRecording"
          @click="stopRecording"
          variant="danger"
          size="lg"
          class="stop-btn"
        >
          <Icon name="stop" />
          Stop Recording
        </BaseButton>

        <div class="playback-buttons" v-if="recording.blob && !recording.isRecording">
          <BaseButton
            @click="playRecording"
            variant="secondary"
            :disabled="recording.isPlaying"
          >
            <Icon name="play" />
            Play
          </BaseButton>
          
          <BaseButton
            @click="clearRecording"
            variant="secondary"
          >
            <Icon name="trash" />
            Clear
          </BaseButton>
          
          <BaseButton
            @click="startRecording"
            variant="secondary"
          >
            <Icon name="microphone" />
            Re-record
          </BaseButton>
        </div>
      </div>

      <!-- Error Message -->
      <div class="error-message" v-if="errorMessage">
        <Icon name="warning" />
        {{ errorMessage }}
      </div>

      <!-- Microphone Permission Info -->
      <div class="permission-info" v-if="!canRecord">
        <Icon name="info" />
        <p>Microphone access is required for voice recording. Please grant permission when prompted.</p>
      </div>
    </div>

    <!-- Dialog Actions -->
    <div class="dialog-actions">
      <BaseButton
        @click="$emit('close')"
        variant="secondary"
      >
        Cancel
      </BaseButton>
      
      <BaseButton
        @click="sendVoiceMessage"
        variant="primary"
        :disabled="!recording.blob || isSending"
        :loading="isSending"
      >
        <Icon name="send" />
        Send Voice Message
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { apiService } from '@/services/api'
import BaseButton from '@/components/base/BaseButton.vue'
import Icon from '@/components/base/Icon.vue'

const emit = defineEmits<{
  close: []
  sent: []
}>()

const appStore = useAppStore()
const toastStore = useToastStore()
const { 
  recording, 
  canRecord, 
  recordingDurationFormatted,
  startRecording: startAudioRecording,
  stopRecording: stopAudioRecording,
  playRecording,
  clearRecording
} = useAudio()

const isSending = ref(false)
const errorMessage = ref('')
const waveAnimation = ref<number[]>([])

// Computed
const playbackProgress = computed(() => {
  if (!recording.value.duration) return 0
  return (recording.value.currentTime / recording.value.duration) * 100
})

// Methods
const startRecording = async () => {
  errorMessage.value = ''
  const success = await startAudioRecording()
  if (!success) {
    errorMessage.value = 'Failed to start recording. Please check microphone permissions.'
  } else {
    startWaveAnimation()
  }
}

const stopRecording = () => {
  stopAudioRecording()
  stopWaveAnimation()
}

const sendVoiceMessage = async () => {
  if (!recording.value.blob) return

  isSending.value = true
  errorMessage.value = ''

  try {
    // Create a message first to attach the voice file to
    const message = await apiService.createMessage(appStore.currentChannelId!, 'Voice message')
    
    // Create file from blob
    const file = new File([recording.value.blob!], `voice-${Date.now()}.webm`, {
      type: 'audio/webm;codecs=opus'
    })

    // Upload voice file
    const uploadedFile = await apiService.uploadFile(appStore.currentChannelId!, message.id, file)
    
    // Create complete message with file metadata
    const completeMessage = {
      id: message.id,
      channel_id: appStore.currentChannelId!,
      content: message.content,
      created_at: message.created_at,
      file_id: uploadedFile.id,
      fileId: uploadedFile.id,
      filePath: uploadedFile.file_path,
      fileType: uploadedFile.file_type,
      fileSize: uploadedFile.file_size,
      originalName: uploadedFile.original_name,
      fileCreatedAt: uploadedFile.created_at
    }
    
    // Add the complete message to the store (this will trigger immediate UI update)
    appStore.addMessage(completeMessage)
    
    toastStore.success('Voice message sent!')
    clearRecording()
    emit('sent')
    emit('close')
  } catch (error) {
    console.error('Failed to send voice message:', error)
    errorMessage.value = 'Failed to send voice message. Please try again.'
    toastStore.error('Failed to send voice message')
  } finally {
    isSending.value = false
  }
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Waveform animation
let animationInterval: number | null = null

const startWaveAnimation = () => {
  waveAnimation.value = Array.from({ length: 20 }, () => Math.random() * 40 + 10)
  animationInterval = setInterval(() => {
    waveAnimation.value = waveAnimation.value.map(() => Math.random() * 40 + 10)
  }, 150)
}

const stopWaveAnimation = () => {
  if (animationInterval) {
    clearInterval(animationInterval)
    animationInterval = null
  }
}

const getWaveHeight = (index: number): number => {
  return waveAnimation.value[index] || 20
}

// Cleanup
onUnmounted(() => {
  stopWaveAnimation()
})

// Initialize
onMounted(() => {
  // Clear any existing recording when dialog opens
  if (recording.value.blob) {
    clearRecording()
  }
})
</script>

<style scoped>
.voice-recording-dialog {
  padding: 1rem 0;
  min-width: 400px;
}

.recording-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.recording-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #6b7280;
  transition: all 0.3s ease;
}

.status-indicator.recording {
  background: #dc2626;
  color: white;
}

.status-indicator.has-recording {
  background: #059669;
  color: white;
}

.pulse {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid #dc2626;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

.status-text {
  text-align: center;
}

.status-text h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.duration {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #4b5563;
}

.waveform {
  display: flex;
  align-items: end;
  gap: 3px;
  height: 60px;
  padding: 0 1rem;
}

.wave-bar {
  width: 4px;
  background: linear-gradient(to top, #dc2626, #f87171);
  border-radius: 2px;
  transition: height 0.1s ease;
  min-height: 4px;
}

.playback-controls {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #059669;
  transition: width 0.1s ease;
}

.playback-time {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.record-btn {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.stop-btn {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.playback-buttons {
  display: flex;
  gap: 0.75rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-weight: 500;
}

.permission-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
}

.permission-info p {
  margin: 0;
  font-size: 0.875rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .status-text h3 {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .duration {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .playback-time {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .progress-bar {
    background: #374151;
  }
  
  .error-message {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fca5a5;
  }
  
  .permission-info {
    background: #1e3a8a;
    border-color: #3b82f6;
    color: #93c5fd;
  }
  
  .dialog-actions {
    border-top-color: #374151;
  }
}
</style>