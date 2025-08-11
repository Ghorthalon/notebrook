<template>
  <div class="create-channel-dialog">
    <form @submit.prevent="handleSubmit" class="channel-form">
      <BaseInput
        v-model="channelName"
        label="Channel Name"
        placeholder="Enter channel name"
        required
        :error="error"
        :disabled="isLoading"
        ref="nameInput"
      />
      
      <div class="form-actions">
        <BaseButton
          type="button"
          variant="secondary"
          @click="$emit('cancel')"
          :disabled="isLoading"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="isLoading"
          :disabled="!channelName.trim()"
        >
          Create Channel
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { apiService } from '@/services/api'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const emit = defineEmits<{
  cancel: []
  created: [channelId: number]
}>()

const appStore = useAppStore()
const toastStore = useToastStore()

const channelName = ref('')
const error = ref('')
const isLoading = ref(false)
const nameInput = ref()

const handleSubmit = async () => {
  if (!channelName.value.trim()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const newChannel = await apiService.createChannel(channelName.value.trim())
    appStore.addChannel(newChannel)
    toastStore.success(`Channel "${newChannel.name}" created successfully!`)
    emit('created', newChannel.id)
  } catch (err) {
    console.error('Failed to create channel:', err)
    error.value = 'Failed to create channel. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  nameInput.value?.focus()
})
</script>

<style scoped>
.create-channel-dialog {
  padding: 1rem 0;
}

.channel-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>