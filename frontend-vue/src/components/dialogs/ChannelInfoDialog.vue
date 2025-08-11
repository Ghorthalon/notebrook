<template>
  <div class="channel-info-dialog">
    <div class="info-section">
      <BaseInput
        v-model="channelName"
        label="Channel name"
        placeholder="Enter channel name"
        ref="nameInput"
      />
      
      <BaseInput
        v-model="channelIdDisplay"
        label="Channel ID (for API use)"
        readonly
      />
    </div>
    
    <div class="actions-section">
      <div class="action-group">
        <h3>Channel Actions</h3>
        
        <BaseButton
          @click="makeDefault"
          variant="secondary"
          :disabled="isDefault"
        >
          {{ isDefault ? 'Already Default' : 'Make Default Channel' }}
        </BaseButton>
        
        <BaseButton
          @click="showMergeDialog = true"
          variant="secondary"
          :disabled="availableChannels.length === 0"
        >
          Merge Channel
        </BaseButton>
        
        <BaseButton
          @click="showDeleteConfirm = true"
          variant="danger"
        >
          Delete Channel
        </BaseButton>
      </div>
    </div>
    
    <div class="dialog-actions">
      <BaseButton @click="cancel" variant="secondary">
        Cancel
      </BaseButton>
      <BaseButton @click="save" :loading="saving">
        Save Changes
      </BaseButton>
    </div>
    
    <!-- Merge Channel Dialog -->
    <BaseDialog v-model:show="showMergeDialog" title="Merge Channel" size="md">
      <div class="merge-dialog">
        <p class="merge-warning">
          This will move all messages from "{{ channel.name }}" into the selected target channel, 
          then delete this channel. This action cannot be undone.
        </p>
        
        <div class="merge-form">
          <label for="target-channel">Merge into:</label>
          <select 
            id="target-channel" 
            v-model="selectedTargetChannel" 
            class="target-select"
          >
            <option value="">Select target channel...</option>
            <option 
              v-for="ch in availableChannels" 
              :key="ch.id" 
              :value="ch.id"
            >
              {{ ch.name }}
            </option>
          </select>
        </div>
        
        <div class="merge-actions">
          <BaseButton @click="showMergeDialog = false" variant="secondary">
            Cancel
          </BaseButton>
          <BaseButton 
            @click="performMerge" 
            variant="danger"
            :disabled="!selectedTargetChannel"
            :loading="merging"
          >
            Merge Channels
          </BaseButton>
        </div>
      </div>
    </BaseDialog>
    
    <!-- Delete Confirmation Dialog -->
    <BaseDialog v-model:show="showDeleteConfirm" title="Delete Channel" size="md">
      <div class="delete-dialog">
        <p class="delete-warning">
          Are you sure you want to delete "{{ channel.name }}"? 
          This will permanently delete all messages in this channel.
          This action cannot be undone.
        </p>
        
        <div class="delete-actions">
          <BaseButton @click="showDeleteConfirm = false" variant="secondary">
            Cancel
          </BaseButton>
          <BaseButton 
            @click="performDelete" 
            variant="danger"
            :loading="deleting"
          >
            Delete Channel
          </BaseButton>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { apiService } from '@/services/api'
import { syncService } from '@/services/sync'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import type { Channel } from '@/types'

interface Props {
  channel: Channel
}

const emit = defineEmits<{
  close: []
  'channel-updated': [channel: Channel]
  'channel-deleted': [channelId: number]
  'channel-merged': [sourceId: number, targetId: number]
}>()

const props = defineProps<Props>()

const appStore = useAppStore()
const toastStore = useToastStore()

// Form state
const channelName = ref(props.channel.name)
const channelIdDisplay = ref(props.channel.id.toString())
const saving = ref(false)

// Dialog states
const showMergeDialog = ref(false)
const showDeleteConfirm = ref(false)
const selectedTargetChannel = ref<number | null>(null)
const merging = ref(false)
const deleting = ref(false)

// Input ref for focus
const nameInput = ref()

// Computed properties
const isDefault = computed(() => 
  appStore.settings.defaultChannelId === props.channel.id
)

const availableChannels = computed(() => 
  appStore.channels.filter(ch => ch.id !== props.channel.id)
)

// Actions
const makeDefault = async () => {
  try {
    await appStore.updateSettings({ defaultChannelId: props.channel.id })
    toastStore.success(`${props.channel.name} is now the default channel`)
  } catch (error) {
    console.error('Failed to set default channel:', error)
    toastStore.error('Failed to set default channel')
  }
}

const save = async () => {
  if (!channelName.value.trim()) {
    toastStore.error('Channel name is required')
    return
  }
  
  try {
    saving.value = true
    
    // Try online update first
    try {
      await apiService.updateChannel(props.channel.id, channelName.value.trim())
      // Update local store
      const updatedChannel = { ...props.channel, name: channelName.value.trim() }
      const channelIndex = appStore.channels.findIndex(ch => ch.id === props.channel.id)
      if (channelIndex !== -1) {
        appStore.channels[channelIndex] = updatedChannel
        await appStore.saveState()
      }
      emit('channel-updated', updatedChannel)
      toastStore.success('Channel updated successfully')
    } catch (error) {
      // Offline fallback - update locally only
      console.log('Offline mode: updating channel locally')
      const updatedChannel = { ...props.channel, name: channelName.value.trim() }
      const channelIndex = appStore.channels.findIndex(ch => ch.id === props.channel.id)
      if (channelIndex !== -1) {
        appStore.channels[channelIndex] = updatedChannel
        await appStore.saveState()
      }
      emit('channel-updated', updatedChannel)
      toastStore.success('Channel updated locally (will sync when online)')
    }
    
    emit('close')
  } catch (error) {
    console.error('Failed to update channel:', error)
    toastStore.error('Failed to update channel')
  } finally {
    saving.value = false
  }
}

const performMerge = async () => {
  if (!selectedTargetChannel.value) return
  
  try {
    merging.value = true
    
    // Try online merge first
    try {
      await apiService.mergeChannels(props.channel.id, selectedTargetChannel.value)
      // Remove source channel from local store
      appStore.channels = appStore.channels.filter(ch => ch.id !== props.channel.id)
      // Clear messages for the merged channel
      delete appStore.messages[props.channel.id]
      await appStore.saveState()
      
      emit('channel-merged', props.channel.id, selectedTargetChannel.value)
      toastStore.success('Channels merged successfully')
      
      // Switch to target channel if we were on the source channel
      if (appStore.currentChannelId === props.channel.id) {
        await appStore.setCurrentChannel(selectedTargetChannel.value)
      }
    } catch (error) {
      // For merge, we can't do offline fallback easily since it affects multiple channels
      console.error('Failed to merge channels:', error)
      toastStore.error('Failed to merge channels - this requires an internet connection')
    }
    
    showMergeDialog.value = false
    emit('close')
  } catch (error) {
    console.error('Failed to merge channels:', error)
    toastStore.error('Failed to merge channels')
  } finally {
    merging.value = false
  }
}

const performDelete = async () => {
  try {
    deleting.value = true
    
    // Try online delete first
    try {
      await apiService.deleteChannel(props.channel.id)
      // Remove from local store
      appStore.channels = appStore.channels.filter(ch => ch.id !== props.channel.id)
      delete appStore.messages[props.channel.id]
      await appStore.saveState()
      
      emit('channel-deleted', props.channel.id)
      toastStore.success('Channel deleted successfully')
      
      // Switch to first available channel if we were on the deleted channel
      if (appStore.currentChannelId === props.channel.id && appStore.channels.length > 0) {
        await appStore.setCurrentChannel(appStore.channels[0].id)
      }
    } catch (error) {
      // For delete, we can't do offline fallback easily since it affects server state
      console.error('Failed to delete channel:', error)
      toastStore.error('Failed to delete channel - this requires an internet connection')
    }
    
    showDeleteConfirm.value = false
    emit('close')
  } catch (error) {
    console.error('Failed to delete channel:', error)
    toastStore.error('Failed to delete channel')
  } finally {
    deleting.value = false
  }
}

const cancel = () => {
  emit('close')
}

onMounted(() => {
  nameInput.value?.focus()
})
</script>

<style scoped>
.channel-info-dialog {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 400px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actions-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.action-group h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

/* Merge Dialog Styles */
.merge-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.merge-warning {
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  color: #92400e;
  margin: 0;
  line-height: 1.5;
}

.merge-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.merge-form label {
  font-weight: 500;
  color: #374151;
}

.target-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #111827;
  font-size: 0.875rem;
}

.target-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.merge-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Delete Dialog Styles */
.delete-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.delete-warning {
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  color: #dc2626;
  margin: 0;
  line-height: 1.5;
}

.delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .actions-section {
    border-top-color: #374151;
  }
  
  .action-group h3 {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .dialog-actions {
    border-top-color: #374151;
  }
  
  .merge-warning {
    background: #451a03;
    border-color: #92400e;
    color: #fbbf24;
  }
  
  .delete-warning {
    background: #450a0a;
    border-color: #dc2626;
    color: #fca5a5;
  }
  
  .merge-form label {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .target-select {
    background: #374151;
    color: rgba(255, 255, 255, 0.87);
    border-color: #4b5563;
  }
  
  .target-select:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
}
</style>