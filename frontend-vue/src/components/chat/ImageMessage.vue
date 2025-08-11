<template>
  <div class="image-message">
    <div 
      class="image-thumbnail"
      @click="showFullSize = true"
      :style="{ cursor: 'pointer' }"
    >
      <img 
        :src="imageUrl" 
        :alt="file.original_name"
        class="thumbnail"
        @error="imageError = true"
      />
      <div class="image-overlay">
        <Icon name="search" size="sm" />
      </div>
    </div>
    
    <div class="image-info">
      <span class="image-name">{{ file.original_name }}</span>
      <span class="image-size">{{ formatFileSize(file.file_size) }}</span>
    </div>
    
    <!-- Full-size image modal -->
    <teleport to="body">
      <div 
        v-if="showFullSize" 
        class="image-modal"
        @click="showFullSize = false"
        @keydown.escape="showFullSize = false"
      >
        <div class="modal-content" @click.stop>
          <img 
            :src="imageUrl" 
            :alt="file.original_name"
            class="full-image"
          />
          <div class="modal-actions">
            <button @click="downloadImage" class="action-button">
              <Icon name="download" size="sm" />
              Download
            </button>
            <button @click="showFullSize = false" class="action-button">
              <Icon name="x" size="sm" />
              Close
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import Icon from '@/components/base/Icon.vue'
import type { FileAttachment } from '@/types'

interface Props {
  file: FileAttachment
}

const props = defineProps<Props>()

const showFullSize = ref(false)
const imageError = ref(false)

const imageUrl = computed(() => apiService.getFileUrl(props.file.file_path))

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const downloadImage = async () => {
  try {
    const response = await fetch(imageUrl.value)
    const blob = await response.blob()
    
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = props.file.original_name
    link.click()
    
    // Clean up the blob URL after download
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  } catch (error) {
    console.error('Failed to download image:', error)
    // Fallback to direct link
    const link = document.createElement('a')
    link.href = imageUrl.value
    link.download = props.file.original_name
    link.target = '_blank'
    link.click()
  }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && showFullSize.value) {
    showFullSize.value = false
  }
})
</script>

<style scoped>
.image-message {
  margin: 0.5rem 0;
  max-width: 300px;
}

.image-thumbnail {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.image-thumbnail:hover {
  border-color: #3b82f6;
  transform: scale(1.02);
}

.image-thumbnail:hover .image-overlay {
  opacity: 1;
}

.thumbnail {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f9fafb;
  font-size: 0.75rem;
}

.image-name {
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.image-size {
  color: #6b7280;
  margin-left: 0.5rem;
}

/* Modal styles */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  cursor: default;
}

.full-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .image-thumbnail {
    border-color: #4b5563;
  }
  
  .image-thumbnail:hover {
    border-color: #60a5fa;
  }
  
  .image-info {
    background: #374151;
  }
  
  .image-name {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .image-size {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>