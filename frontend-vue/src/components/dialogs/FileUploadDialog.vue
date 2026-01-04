<template>
  <div class="file-upload-dialog">
    <div class="upload-area" 
         :class="{ 'upload-area--dragging': isDragging }"
         @dragover.prevent="handleDragOver"
         @dragleave.prevent="handleDragLeave"
         @drop.prevent="handleDrop">
      
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleFileSelect"
        class="file-input"
        :disabled="isUploading"
        multiple
      />
      
      <div v-if="!selectedFiles.length" class="upload-prompt">
        <div class="upload-icon">📎</div>
        <p>Click to select files or drag and drop</p>
        <p class="upload-hint">All file types supported</p>
      </div>
      
      <div v-else class="selected-files">
        <h4>Selected Files:</h4>
        <div class="file-list">
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <button 
              @click="removeFile(index)"
              class="remove-file"
              :disabled="isUploading"
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="uploadProgress.length > 0" class="upload-progress">
      <div v-for="(progress, index) in uploadProgress" :key="index" class="progress-item">
        <div class="progress-label">{{ selectedFiles[index]?.name }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>
    
    <div class="dialog-actions">
      <BaseButton
        variant="secondary"
        @click="$emit('cancel')"
        :disabled="isUploading"
      >
        Cancel
      </BaseButton>
      <BaseButton
        @click="uploadFiles"
        :loading="isUploading"
        :disabled="selectedFiles.length === 0"
      >
        Upload {{ selectedFiles.length }} file{{ selectedFiles.length === 1 ? '' : 's' }}
      </BaseButton>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { apiService } from '@/services/api'
import BaseButton from '@/components/base/BaseButton.vue'

const emit = defineEmits<{
  cancel: []
  uploaded: []
}>()

const appStore = useAppStore()
const toastStore = useToastStore()

const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const uploadProgress = ref<number[]>([])
const isDragging = ref(false)
const isUploading = ref(false)
const error = ref('')

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  addFiles(files)
}

const handleFileSelect = (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  addFiles(files)
}

const addFiles = (files: File[]) => {
  selectedFiles.value.push(...files)
  uploadProgress.value = new Array(selectedFiles.value.length).fill(0)
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
  uploadProgress.value.splice(index, 1)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const uploadFiles = async () => {
  if (!appStore.currentChannelId || selectedFiles.value.length === 0) return
  
  isUploading.value = true
  error.value = ''
  
  try {
    // For single file, use the filename as message content
    // For multiple files, show count
    const messageContent = selectedFiles.value.length === 1
      ? selectedFiles.value[0]?.name || 'Uploaded file'
      : `Uploaded ${selectedFiles.value.length} files`

    // Create a message first to attach files to
    const message = await apiService.createMessage(appStore.currentChannelId, messageContent)

    // Upload the first file (backend uses single file per message)
    const file = selectedFiles.value[0]

    if (!file) {
      throw new Error('No file selected')
    }

    try {
      const uploadedFile = await apiService.uploadFile(appStore.currentChannelId, message.id, file)
      uploadProgress.value[0] = 100

      // Immediately update the local message with file metadata
      const updatedMessage = {
        ...message,
        fileId: uploadedFile.id,
        filePath: uploadedFile.file_path,
        fileType: uploadedFile.file_type,
        fileSize: uploadedFile.file_size,
        originalName: uploadedFile.original_name,
        fileCreatedAt: uploadedFile.created_at
      }

      // Update the message in the store
      appStore.updateMessage(message.id, updatedMessage)

      toastStore.success('File uploaded successfully!')

    } catch (fileError) {
      console.error(`Failed to upload ${file.name}:`, fileError)
      toastStore.error(`Failed to upload ${file.name}`)
      uploadProgress.value[0] = 0
    }
    
    emit('uploaded')
    
  } catch (err) {
    console.error('Upload failed:', err)
    error.value = 'Upload failed. Please try again.'
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.file-upload-dialog {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.upload-area:hover,
.upload-area--dragging {
  border-color: #646cff;
  background: #f8faff;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-prompt {
  pointer-events: none;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.selected-files h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
}

.file-name {
  flex: 1;
  font-weight: 500;
  word-break: break-all;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.remove-file {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.remove-file:hover:not(:disabled) {
  background: #dc2626;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-bar {
  flex: 2;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #646cff;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
  min-width: 3rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .upload-area {
    border-color: #4b5563;
  }
  
  .upload-area:hover,
  .upload-area--dragging {
    border-color: #646cff;
    background: #1e293b;
  }
  
  .file-item {
    background: #374151;
  }
  
  .progress-bar {
    background: #4b5563;
  }
  
  .error-message {
    background: #422006;
    border-color: #92400e;
    color: #fbbf24;
  }
}
</style>