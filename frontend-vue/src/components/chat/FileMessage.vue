<template>
  <div class="file-message">
    <div 
      class="file-container"
      @click="handleFileClick"
      :class="{ 'clickable': isPreviewable }"
    >
      <div class="file-icon">
        <Icon :name="fileIcon" size="md" />
      </div>
      
      <div class="file-info">
        <div class="file-name">{{ file.original_name }}</div>
        <div class="file-meta">
          <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
          <span class="file-type">{{ file.file_type }}</span>
        </div>
        <div v-if="isPreviewable" class="preview-hint">
          Click to preview
        </div>
      </div>
      
      <button 
        @click.stop="downloadFile"
        class="download-button"
        title="Download"
      >
        <Icon name="download" size="sm" />
      </button>
    </div>
    
    <!-- File preview modal -->
    <teleport to="body">
      <div 
        v-if="showPreview" 
        class="file-modal"
        @click="showPreview = false"
        @keydown.escape="showPreview = false"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ file.original_name }}</h3>
            <button @click="showPreview = false" class="close-button">
              <Icon name="x" size="sm" />
            </button>
          </div>
          
          <div class="preview-container">
            <!-- Text preview -->
            <div v-if="isTextFile && previewContent" class="text-preview">
              <pre>{{ previewContent }}</pre>
            </div>
            
            <!-- PDF preview -->
            <iframe 
              v-else-if="isPdfFile" 
              :src="fileUrl"
              class="pdf-preview"
            ></iframe>
            
            <!-- Generic file info -->
            <div v-else class="file-details">
              <Icon :name="fileIcon" size="xl" />
              <p>Cannot preview this file type</p>
              <button @click="downloadFile" class="download-file-button">
                <Icon name="download" size="sm" />
                Download File
              </button>
            </div>
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

const showPreview = ref(false)
const previewContent = ref<string>('')
const loading = ref(false)

const fileUrl = computed(() => apiService.getFileUrl(props.file.file_path))

const fileExtension = computed(() => {
  return props.file.original_name.split('.').pop()?.toLowerCase() || ''
})

const fileIcon = computed(() => {
  const ext = fileExtension.value
  
  if (['pdf'].includes(ext)) {
    return 'file-text'
  } else if (['doc', 'docx'].includes(ext)) {
    return 'file-text'
  } else if (['xls', 'xlsx'].includes(ext)) {
    return 'table'
  } else if (['zip', 'rar', '7z'].includes(ext)) {
    return 'archive'
  } else if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext)) {
    return 'file-text'
  } else {
    return 'file'
  }
})

const isTextFile = computed(() => {
  const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'js', 'ts', 'css', 'html']
  return textExtensions.includes(fileExtension.value)
})

const isPdfFile = computed(() => {
  return fileExtension.value === 'pdf'
})

const isPreviewable = computed(() => {
  return isTextFile.value || isPdfFile.value
})

const handleFileClick = async () => {
  if (!isPreviewable.value) {
    downloadFile()
    return
  }
  
  if (isTextFile.value && !previewContent.value) {
    await loadTextPreview()
  }
  
  showPreview.value = true
}

const loadTextPreview = async () => {
  try {
    loading.value = true
    const response = await fetch(fileUrl.value)
    const text = await response.text()
    
    // Limit preview size to prevent UI issues
    if (text.length > 50000) {
      previewContent.value = text.slice(0, 50000) + '\n\n... (file truncated for preview)'
    } else {
      previewContent.value = text
    }
  } catch (error) {
    console.error('Failed to load file preview:', error)
    previewContent.value = 'Error loading file preview'
  } finally {
    loading.value = false
  }
}

const downloadFile = async () => {
  try {
    const response = await fetch(fileUrl.value)
    const blob = await response.blob()
    
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = props.file.original_name
    link.click()
    
    // Clean up the blob URL after download
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  } catch (error) {
    console.error('Failed to download file:', error)
    // Fallback to direct link
    const link = document.createElement('a')
    link.href = fileUrl.value
    link.download = props.file.original_name
    link.target = '_blank'
    link.click()
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.file-message {
  margin: 0.5rem 0;
  max-width: 400px;
}

.file-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.file-container.clickable {
  cursor: pointer;
}

.file-container.clickable:hover {
  background: #e5e7eb;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.25rem;
}

.file-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.preview-hint {
  font-size: 0.75rem;
  color: #3b82f6;
  margin-top: 0.25rem;
}

.download-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
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

/* Modal styles */
.file-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  cursor: default;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #6b7280;
}

.close-button:hover {
  color: #374151;
}

.preview-container {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.text-preview {
  max-height: 70vh;
  overflow: auto;
}

.text-preview pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #374151;
  margin: 0;
}

.pdf-preview {
  width: 100%;
  height: 70vh;
  border: none;
}

.file-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.download-file-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s ease;
}

.download-file-button:hover {
  background: #2563eb;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .file-container {
    background: #374151;
    border-color: #4b5563;
  }
  
  .file-container.clickable:hover {
    background: #4b5563;
    border-color: #60a5fa;
  }
  
  .file-name {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .file-meta {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .preview-hint {
    color: #60a5fa;
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
  
  .modal-content {
    background: #1f2937;
  }
  
  .modal-header {
    border-bottom-color: #374151;
  }
  
  .modal-header h3 {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .close-button {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .close-button:hover {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .text-preview pre {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .file-details {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>