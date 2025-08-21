<template>
  <div class="file-attachment">
    <!-- Image files -->
    <ImageMessage 
      v-if="isImageFile" 
      :file="file" 
    />
    
    <!-- Audio/voice files -->
    <VoiceMessage 
      v-else-if="isAudioFile" 
      :file="file" 
    />
    
    <!-- Other files -->
    <FileMessage 
      v-else 
      :file="file" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ImageMessage from './ImageMessage.vue'
import VoiceMessage from './VoiceMessage.vue'
import FileMessage from './FileMessage.vue'
import type { FileAttachment } from '@/types'

interface Props {
  file: FileAttachment
}

const props = defineProps<Props>()

const fileExtension = computed(() => {
  if (!props.file.original_name) return ''
  return props.file.original_name.split('.').pop()?.toLowerCase() || ''
})

const isImageFile = computed(() => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  return imageExtensions.includes(fileExtension.value)
})

const isAudioFile = computed(() => {
  const audioExtensions = ['mp3', 'wav', 'webm', 'ogg', 'aac', 'm4a']
  return audioExtensions.includes(fileExtension.value)
})
</script>

<style scoped>
.file-attachment {
  margin: 0.25rem 0;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-decoration: none;
  color: #374151;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.file-link:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.file-name {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 400;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .file-link {
    background: #374151;
    border-color: #4b5563;
    color: rgba(255, 255, 255, 0.87);
  }
  
  .file-link:hover {
    background: #4b5563;
    border-color: #6b7280;
  }
  
  .file-size {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>