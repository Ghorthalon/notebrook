<template>
  <div class="camera-capture-dialog">
    <div class="camera-container">
      <!-- Camera Feed -->
      <div class="camera-feed" v-if="!capturedImage">
        <video
          ref="videoElement"
          autoplay
          playsinline
          muted
          :class="{ 'mirrored': isFrontCamera }"
        ></video>
        
        <!-- Camera Controls Overlay -->
        <div class="camera-overlay">
          <div class="camera-info">
            <div class="camera-status" :class="{ 'active': isStreaming }">
              <Icon name="camera" />
              <span v-if="isStreaming">Camera Active</span>
              <span v-else>Camera Inactive</span>
            </div>
          </div>
          
          <!-- Switch Camera Button -->
          <BaseButton
            v-if="availableCameras.length > 1"
            @click="switchCamera"
            variant="secondary"
            size="sm"
            class="switch-camera-btn"
            :disabled="!isStreaming"
          >
            <Icon name="camera" />
            Switch
          </BaseButton>
        </div>
      </div>
      
      <!-- Captured Image Preview -->
      <div class="image-preview" v-if="capturedImage">
        <img 
          :src="capturedImage" 
          alt="Captured photo"
          class="captured-photo"
        />
      </div>
      
      <!-- Error Message -->
      <div class="error-message" v-if="errorMessage">
        <Icon name="warning" />
        {{ errorMessage }}
      </div>
      
      <!-- Camera Permission Info -->
      <div class="permission-info" v-if="!hasPermission && !errorMessage">
        <Icon name="info" />
        <p>Camera access is required to take photos. Please grant permission when prompted.</p>
      </div>
    </div>
    
    <!-- Capture Controls -->
    <div class="capture-controls">
      <div class="capture-buttons" v-if="!capturedImage">
        <BaseButton
          @click="capturePhoto"
          variant="primary"
          size="lg"
          :disabled="!isStreaming"
          class="capture-btn"
        >
          <Icon name="camera" />
          Take Photo
        </BaseButton>
      </div>
      
      <div class="review-buttons" v-if="capturedImage">
        <BaseButton
          @click="retakePhoto"
          variant="secondary"
        >
          <Icon name="camera" />
          Retake
        </BaseButton>
        
        <BaseButton
          @click="sendPhoto"
          variant="primary"
          :disabled="isSending"
          :loading="isSending"
        >
          <Icon name="send" />
          Send Photo
        </BaseButton>
      </div>
    </div>
    
    <!-- Dialog Actions -->
    <div class="dialog-actions">
      <BaseButton
        @click="closeDialog"
        variant="secondary"
      >
        Cancel
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

// Refs
const videoElement = ref<HTMLVideoElement>()
const capturedImage = ref<string>()
const isStreaming = ref(false)
const hasPermission = ref(false)
const isSending = ref(false)
const errorMessage = ref('')
const availableCameras = ref<MediaDeviceInfo[]>([])
const currentCameraIndex = ref(0)
const isFrontCamera = ref(true)

// Stream management
let currentStream: MediaStream | null = null

// Methods
const initializeCamera = async () => {
  try {
    errorMessage.value = ''
    
    // Get available cameras
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras.value = devices.filter(device => device.kind === 'videoinput')
    
    if (availableCameras.value.length === 0) {
      throw new Error('No cameras found')
    }
    
    // Start with front camera if available
    const frontCamera = availableCameras.value.find(camera => 
      camera.label.toLowerCase().includes('front') ||
      camera.label.toLowerCase().includes('user')
    )
    
    if (frontCamera) {
      currentCameraIndex.value = availableCameras.value.indexOf(frontCamera)
      isFrontCamera.value = true
    } else {
      currentCameraIndex.value = 0
      isFrontCamera.value = false
    }
    
    await startCamera()
    hasPermission.value = true
  } catch (error) {
    console.error('Failed to initialize camera:', error)
    errorMessage.value = 'Failed to access camera. Please check permissions and try again.'
    hasPermission.value = false
  }
}

const startCamera = async () => {
  try {
    // Stop current stream if exists
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
    }
    
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: availableCameras.value[currentCameraIndex.value]?.deviceId,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: isFrontCamera.value ? 'user' : 'environment'
      }
    }
    
    currentStream = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoElement.value) {
      videoElement.value.srcObject = currentStream
      isStreaming.value = true
    }
  } catch (error) {
    console.error('Failed to start camera:', error)
    throw error
  }
}

const switchCamera = async () => {
  if (availableCameras.value.length <= 1) return
  
  currentCameraIndex.value = (currentCameraIndex.value + 1) % availableCameras.value.length
  
  // Determine if this is likely a front camera
  const currentCamera = availableCameras.value[currentCameraIndex.value]
  isFrontCamera.value = currentCamera?.label.toLowerCase().includes('front') ||
                       currentCamera?.label.toLowerCase().includes('user') || false
  
  try {
    await startCamera()
  } catch (error) {
    console.error('Failed to switch camera:', error)
    toastStore.error('Failed to switch camera')
  }
}

const capturePhoto = () => {
  if (!videoElement.value || !isStreaming.value) return
  
  try {
    // Create canvas to capture frame
    const canvas = document.createElement('canvas')
    const video = videoElement.value
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')
    
    // Flip horizontally for front camera
    if (isFrontCamera.value) {
      ctx.scale(-1, 1)
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }
    
    // Convert to data URL
    capturedImage.value = canvas.toDataURL('image/jpeg', 0.8)
    
    // Stop camera stream
    stopCamera()
    
    toastStore.success('Photo captured!')
  } catch (error) {
    console.error('Failed to capture photo:', error)
    toastStore.error('Failed to capture photo')
  }
}

const retakePhoto = () => {
  capturedImage.value = undefined
  initializeCamera()
}

const sendPhoto = async () => {
  if (!capturedImage.value) return
  
  isSending.value = true
  errorMessage.value = ''
  
  try {
    // Create a message first to attach the photo to
    const message = await apiService.createMessage(appStore.currentChannelId!, 'Photo')
    
    // Convert data URL to blob
    const response = await fetch(capturedImage.value)
    const blob = await response.blob()
    
    // Create file from blob
    const file = new File([blob], `photo-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    })
    
    // Upload photo
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
    
    toastStore.success('Photo sent!')
    emit('sent')
    emit('close')
  } catch (error) {
    console.error('Failed to send photo:', error)
    errorMessage.value = 'Failed to send photo. Please try again.'
    toastStore.error('Failed to send photo')
  } finally {
    isSending.value = false
  }
}

const stopCamera = () => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
    currentStream = null
  }
  isStreaming.value = false
}

const closeDialog = () => {
  stopCamera()
  emit('close')
}

// Lifecycle
onMounted(() => {
  initializeCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.camera-capture-dialog {
  padding: 1rem 0;
  min-width: 500px;
  max-width: 600px;
}

.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.camera-feed {
  position: relative;
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  aspect-ratio: 16/9;
}

.camera-feed video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.camera-feed video.mirrored {
  transform: scaleX(-1);
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent);
}

.camera-info {
  flex: 1;
}

.camera-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  backdrop-filter: blur(8px);
}

.camera-status.active {
  color: #10b981;
}

.switch-camera-btn {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.image-preview {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16/9;
}

.captured-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  max-width: 500px;
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
  max-width: 500px;
}

.permission-info p {
  margin: 0;
  font-size: 0.875rem;
}

.capture-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.capture-buttons, .review-buttons {
  display: flex;
  gap: 1rem;
}

.capture-btn {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 50px;
  min-width: 160px;
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

/* Mobile responsiveness */
@media (max-width: 640px) {
  .camera-capture-dialog {
    min-width: unset;
    max-width: unset;
    width: 100%;
  }
  
  .camera-feed, .image-preview {
    max-width: 100%;
  }
  
  .camera-overlay {
    padding: 0.75rem;
  }
  
  .capture-btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    min-width: 140px;
  }
  
  .capture-buttons, .review-buttons {
    flex-direction: column;
    width: 100%;
  }
}
</style>