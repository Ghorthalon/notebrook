<template>
  <div class="search-dialog">
    <div class="search-form">
      <BaseInput
        v-model="searchQuery"
        placeholder="Search messages..."
        @keydown.enter="performSearch"
        ref="searchInput"
      />
      
      <div class="search-filters">
        <select 
          v-model="selectedChannelId" 
          class="channel-filter"
        >
          <option :value="null">All channels</option>
          <option 
            v-for="channel in appStore.channels" 
            :key="channel.id"
            :value="channel.id"
          >
            {{ channel.name }}
          </option>
        </select>
        
        <BaseButton
          @click="performSearch"
          :loading="isSearching"
          :disabled="!searchQuery.trim()"
        >
          Search
        </BaseButton>
      </div>
    </div>
    
    <div v-if="isSearching" class="search-loading">
      Searching...
    </div>
    
    <div v-else-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        Found {{ searchResults.length }} result{{ searchResults.length === 1 ? '' : 's' }}
      </div>
      
      <div class="results-list">
        <div
          v-for="result in searchResults"
          :key="`${result.channel_id}-${result.id}`"
          class="result-item"
          @click="goToMessage(result)"
          tabindex="0"
          @keydown.enter="goToMessage(result)"
        >
          <div class="result-channel">
            {{ getChannelName(result.channel_id) }}
          </div>
          <div class="result-content">
            {{ result.content }}
          </div>
          <div class="result-time">
            {{ formatTime(result.created_at) }}
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="hasSearched && searchResults.length === 0" class="no-results">
      No messages found for "{{ searchQuery }}"
    </div>
    
    <div v-if="error" class="search-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { apiService } from '@/services/api'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { Message, ExtendedMessage } from '@/types'

const emit = defineEmits<{
  close: []
  'select-message': [message: ExtendedMessage]
}>()

const appStore = useAppStore()
const toastStore = useToastStore()

const searchQuery = ref('')
const selectedChannelId = ref<number | null>(null)
const searchResults = ref<ExtendedMessage[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)
const error = ref('')
const searchInput = ref()

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isSearching.value = true
  error.value = ''
  
  try {
    const response = await apiService.search(
      searchQuery.value.trim(),
      selectedChannelId.value || undefined
    )
    
    // Transform search results to match expected format
    searchResults.value = response.results.map((result: any) => ({
      ...result,
      channel_id: result.channelId || result.channel_id,
      created_at: result.createdAt || result.created_at
    })) as ExtendedMessage[]
    
    console.log('Search results transformed:', searchResults.value)
    hasSearched.value = true
  } catch (err) {
    console.error('Search failed:', err)
    error.value = 'Search failed. Please try again.'
    toastStore.error('Search failed')
  } finally {
    isSearching.value = false
  }
}

const goToMessage = (message: ExtendedMessage) => {
  emit('select-message', message)
  emit('close')
}

const getChannelName = (channelId: number): string => {
  if (!channelId) return 'Unknown Channel'
  const channel = appStore.channels.find(c => c.id === channelId)
  return channel?.name || `Channel ${channelId}`
}

const formatTime = (timestamp: string): string => {
  if (!timestamp) return 'Unknown time'
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  return date.toLocaleString()
}

onMounted(() => {
  searchInput.value?.focus()
})
</script>

<style scoped>
.search-dialog {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 400px;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-filters {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.channel-filter {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #111827;
  font-size: 0.875rem;
  min-width: 150px;
}

.channel-filter:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.search-loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

.search-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.results-header {
  font-weight: 600;
  color: #374151;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover,
.result-item:focus {
  background: #f9fafb;
  border-color: #646cff;
  outline: none;
}

.result-channel {
  font-size: 0.75rem;
  font-weight: 600;
  color: #646cff;
  margin-bottom: 0.25rem;
}

.result-content {
  color: #111827;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.result-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  color: #6b7280;
  font-style: italic;
}

.search-error {
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .channel-filter {
    background: #374151;
    color: rgba(255, 255, 255, 0.87);
    border-color: #4b5563;
  }
  
  .results-header {
    color: rgba(255, 255, 255, 0.87);
    border-bottom-color: #374151;
  }
  
  .result-item {
    border-color: #374151;
  }
  
  .result-item:hover,
  .result-item:focus {
    background: #374151;
  }
  
  .result-content {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .search-error {
    background: #422006;
    border-color: #92400e;
    color: #fbbf24;
  }
}
</style>