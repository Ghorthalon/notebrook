<template>
  <div class="message-dialog">
    <div class="dialog-header">
      <h2>Message Details</h2>
      <button class="close-button" @click="$emit('close')" aria-label="Close dialog">
        ✕
      </button>
    </div>
    
    <div class="dialog-content">
      <!-- Message Info Section -->
      <div class="info-section">
        <div class="info-item">
          <label>Message ID</label>
          <span>#{{ message.id }}</span>
        </div>
        
        <div class="info-item">
          <label>Sent</label>
          <time :datetime="message.created_at">
            {{ formatTimestampForScreenReader(message.created_at) }}
          </time>
        </div>
        
        <div class="info-item">
          <label>Channel</label>
          <span>{{ channelName }}</span>
        </div>
        
        <div v-if="hasFileAttachment" class="info-item">
          <label>Attachment</label>
          <div class="file-info">
            <span class="file-name">{{ message.originalName }}</span>
            <span class="file-size">({{ formatFileSize(message.fileSize || 0) }})</span>
          </div>
        </div>
      </div>
      
      <!-- Content Section -->
      <div class="content-section">
        <label for="message-content">Message Content</label>
        <div v-if="!isEditing" class="content-display">
          <p>{{ message.content }}</p>
          <BaseButton 
            @click="startEditing" 
            variant="secondary" 
            size="sm"
            class="edit-button"
          >
            Edit
          </BaseButton>
        </div>
        
        <div v-else class="content-edit">
          <BaseTextarea
            id="message-content"
            v-model="editedContent"
            placeholder="Message content..."
            :rows="4"
            auto-resize
            ref="contentTextarea"
          />
          <div class="edit-actions">
            <BaseButton @click="saveEdit" :disabled="!canSave" :loading="isSaving">
              Save
            </BaseButton>
            <BaseButton @click="cancelEdit" variant="secondary">
              Cancel
            </BaseButton>
          </div>
        </div>
      </div>
      
      <!-- File Actions Section (if file attachment exists) -->
      <div v-if="hasFileAttachment" class="file-actions-section">
        <h3>File Actions</h3>
        <div class="action-buttons">
          <BaseButton @click="downloadFile" variant="secondary">
            Download {{ message.originalName }}
          </BaseButton>
          
          <BaseButton 
            v-if="isImageFile" 
            @click="viewImage" 
            variant="secondary"
          >
            View Image
          </BaseButton>
          
          <BaseButton 
            v-if="isAudioFile" 
            @click="playAudio" 
            variant="secondary"
          >
            {{ isPlaying ? 'Stop' : 'Play' }} Audio
          </BaseButton>
        </div>
      </div>
      
      <!-- Message Actions Section -->
      <div class="actions-section">
        <h3>Message Actions</h3>
        <div class="action-buttons">
          <BaseButton @click="copyMessage" variant="secondary">
            Copy Content
          </BaseButton>
          
          <BaseButton 
            @click="readAloud" 
            variant="secondary"
            :disabled="!ttsEnabled"
          >
            Read Aloud
          </BaseButton>
          
          <BaseButton 
            @click="showDeleteConfirm = true" 
            variant="danger"
          >
            Delete Message
          </BaseButton>
          
          <BaseButton 
            @click="showMoveDialog = true" 
            variant="secondary"
          >
            Move Message
          </BaseButton>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="confirm-overlay">
      <div class="confirm-dialog">
        <h3>Delete Message</h3>
        <p>Are you sure you want to delete this message? This cannot be undone.</p>
        <div class="confirm-actions">
          <BaseButton
            @click="showDeleteConfirm = false"
            variant="secondary"
          >
            Cancel
          </BaseButton>
          <BaseButton
            @click="deleteMessage"
            variant="danger"
            :loading="isDeleting"
          >
            Delete
          </BaseButton>
        </div>
      </div>
    </div>
    
    <!-- Move Message Dialog -->
    <div v-if="showMoveDialog" class="confirm-overlay">
      <div class="confirm-dialog">
        <h3>Move Message</h3>
        <p>Select the channel to move this message to:</p>
        <select v-model="selectedTargetChannelId" class="channel-select">
          <option value="">Select a channel...</option>
          <option 
            v-for="channel in availableChannels" 
            :key="channel.id" 
            :value="channel.id"
          >
            {{ channel.name }}
          </option>
        </select>
        <div class="confirm-actions">
          <BaseButton
            @click="showMoveDialog = false"
            variant="secondary"
          >
            Cancel
          </BaseButton>
          <BaseButton
            @click="moveMessage"
            variant="primary"
            :loading="isMoving"
            :disabled="!selectedTargetChannelId || selectedTargetChannelId === message.channel_id"
          >
            Move
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { useAudio } from '@/composables/useAudio'
import { formatTimestampForScreenReader } from '@/utils/time'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import type { ExtendedMessage } from '@/types'

interface Props {
  message: ExtendedMessage
  open: boolean
}

const emit = defineEmits<{
  close: []
  edit: [messageId: number, content: string]
  delete: [messageId: number]
  move: [messageId: number, targetChannelId: number]
}>()

const props = defineProps<Props>()

const appStore = useAppStore()
const toastStore = useToastStore()
const { speak, playSound } = useAudio()

// Component state
const isEditing = ref(false)
const editedContent = ref('')
const showDeleteConfirm = ref(false)
const showMoveDialog = ref(false)
const selectedTargetChannelId = ref<number | ''>('')
const isSaving = ref(false)
const isDeleting = ref(false)
const isMoving = ref(false)
const isPlaying = ref(false)
const contentTextarea = ref()

// Computed properties
const channelName = computed(() => {
  const channel = appStore.channels.find(c => c.id === props.message.channel_id)
  return channel?.name || `Channel ${props.message.channel_id}`
})

const hasFileAttachment = computed(() => {
  return !!(props.message.fileId && props.message.originalName)
})

const isImageFile = computed(() => {
  if (!props.message.originalName) return false
  const ext = props.message.originalName.split('.').pop()?.toLowerCase()
  return ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
})

const isAudioFile = computed(() => {
  if (!props.message.originalName) return false
  const ext = props.message.originalName.split('.').pop()?.toLowerCase()
  return ext && ['mp3', 'wav', 'webm', 'ogg', 'aac', 'm4a'].includes(ext)
})

const canSave = computed(() => {
  return editedContent.value.trim().length > 0 && 
         editedContent.value.trim() !== props.message.content
})

const ttsEnabled = computed(() => appStore.settings.ttsEnabled)

const availableChannels = computed(() => 
  appStore.channels.filter(channel => channel.id !== props.message.channel_id)
)

// Methods
const startEditing = async () => {
  isEditing.value = true
  editedContent.value = props.message.content
  await nextTick()
  contentTextarea.value?.focus()
}

const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = ''
}

const saveEdit = async () => {
  if (!canSave.value) return
  
  isSaving.value = true
  try {
    emit('edit', props.message.id, editedContent.value.trim())
    isEditing.value = false
    toastStore.success('Message updated successfully')
  } catch (error) {
    toastStore.error('Failed to update message')
  } finally {
    isSaving.value = false
  }
}

const deleteMessage = async () => {
  isDeleting.value = true
  try {
    emit('delete', props.message.id)
    showDeleteConfirm.value = false
    toastStore.success('Message deleted successfully')
  } catch (error) {
    toastStore.error('Failed to delete message')
  } finally {
    isDeleting.value = false
  }
}

const moveMessage = async () => {
  if (!selectedTargetChannelId.value || selectedTargetChannelId.value === props.message.channel_id) {
    return
  }
  
  isMoving.value = true
  try {
    emit('move', props.message.id, selectedTargetChannelId.value as number)
    showMoveDialog.value = false
    selectedTargetChannelId.value = ''
    toastStore.success('Message moved successfully')
  } catch (error) {
    toastStore.error('Failed to move message')
  } finally {
    isMoving.value = false
  }
}

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    playSound('copy')
    toastStore.success('Message copied to clipboard')
  } catch (error) {
    toastStore.error('Failed to copy message')
  }
}

const readAloud = async () => {
  if (appStore.settings.ttsEnabled) {
    try {
      await speak(props.message.content)
      toastStore.info('Reading message aloud')
    } catch (error) {
      toastStore.error('Failed to read message aloud')
    }
  } else {
    toastStore.info('Text-to-speech is disabled')
  }
}

const downloadFile = () => {
  if (props.message.filePath) {
    const link = document.createElement('a')
    link.href = `/api/files/${props.message.filePath}`
    link.download = props.message.originalName || 'download'
    link.click()
    toastStore.success('Download started')
  }
}

const viewImage = () => {
  if (props.message.filePath) {
    window.open(`/api/files/${props.message.filePath}`, '_blank')
  }
}

const playAudio = () => {
  if (props.message.filePath) {
    if (isPlaying.value) {
      // Stop audio (would need audio instance management)
      isPlaying.value = false
    } else {
      const audio = new Audio(`/api/files/${props.message.filePath}`)
      audio.onended = () => { isPlaying.value = false }
      audio.onerror = () => { 
        isPlaying.value = false
        toastStore.error('Failed to play audio file')
      }
      audio.play()
      isPlaying.value = true
    }
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Handle escape key to close dialog
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (isEditing.value) {
      cancelEdit()
    } else if (showDeleteConfirm.value) {
      showDeleteConfirm.value = false
    } else if (showMoveDialog.value) {
      showMoveDialog.value = false
      selectedTargetChannelId.value = ''
    } else {
      emit('close')
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// Cleanup on unmount
const cleanup = () => {
  document.removeEventListener('keydown', handleKeydown)
}

defineExpose({ cleanup })
</script>

<style scoped>
.message-dialog {
  background: white;
  border-radius: 12px;
  width: 90vw;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.dialog-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-item span,
.info-item time {
  font-size: 0.875rem;
  color: #374151;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 0.75rem !important;
  color: #6b7280 !important;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.content-section > label {
  font-weight: 600;
  color: #374151;
}

.content-display {
  position: relative;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.content-display p {
  margin: 0;
  line-height: 1.5;
  color: #374151;
  white-space: pre-wrap;
}

.edit-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.content-edit {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.file-actions-section,
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-actions-section h3,
.actions-section h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  margin: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.confirm-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #dc2626;
}

.confirm-dialog p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.channel-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.channel-select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .message-dialog {
    background: #1f2937;
  }
  
  .dialog-header {
    border-bottom-color: #374151;
  }
  
  .dialog-header h2 {
    color: #f9fafb;
  }
  
  .close-button {
    color: #9ca3af;
  }
  
  .close-button:hover {
    background: #374151;
    color: #f3f4f6;
  }
  
  .info-section {
    background: #374151;
  }
  
  .info-item label {
    color: #9ca3af;
  }
  
  .info-item span,
  .info-item time {
    color: #f3f4f6;
  }
  
  .content-section > label,
  .file-actions-section h3,
  .actions-section h3 {
    color: #f3f4f6;
  }
  
  .content-display {
    background: #374151;
    border-color: #4b5563;
  }
  
  .content-display p {
    color: #f3f4f6;
  }
  
  .confirm-dialog {
    background: #1f2937;
  }
  
  .confirm-dialog p {
    color: #9ca3af;
  }
  
  .channel-select {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }
  
  .channel-select:focus {
    outline-color: #60a5fa;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .message-dialog {
    width: 95vw;
    margin: 1rem;
  }
  
  .info-section {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .edit-actions {
    flex-direction: column-reverse;
  }
}
</style>