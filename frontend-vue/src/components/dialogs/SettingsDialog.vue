<template>
  <div class="settings-dialog">
    <form @submit.prevent="handleSave" class="settings-form">
      <div class="setting-group">
        <h3>Audio Settings</h3>
        
        <label class="setting-item">
          <input 
            type="checkbox" 
            v-model="localSettings.soundEnabled"
            class="checkbox"
          />
          <span>Enable sound effects</span>
        </label>
        
        <label class="setting-item">
          <input 
            type="checkbox" 
            v-model="localSettings.speechEnabled"
            class="checkbox"
          />
          <span>Enable speech synthesis (deprecated)</span>
        </label>
      </div>
      
      <div class="setting-group">
        <h3>Text-to-Speech</h3>
        
        <label class="setting-item">
          <input 
            type="checkbox" 
            v-model="localSettings.ttsEnabled"
            class="checkbox"
          />
          <span>Enable text-to-speech announcements</span>
        </label>
        
        <div class="setting-item" v-if="localSettings.ttsEnabled">
          <label for="voice-select">Voice</label>
          <select 
            id="voice-select" 
            v-model="selectedVoiceURI"
            class="select"
            @change="handleVoiceChange"
          >
            <option value="" disabled>Select a voice...</option>
            <option 
              v-for="voice in availableVoices" 
              :key="voice.voiceURI"
              :value="voice.voiceURI"
            >
              {{ voice.name }} ({{ voice.lang }})
            </option>
          </select>
        </div>
        
        <div class="setting-item" v-if="localSettings.ttsEnabled">
          <label for="rate-slider">Speech Rate: {{ localSettings.ttsRate.toFixed(1) }}</label>
          <input 
            id="rate-slider"
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1"
            v-model.number="localSettings.ttsRate"
            class="slider"
          />
        </div>
        
        <div class="setting-item" v-if="localSettings.ttsEnabled">
          <label for="pitch-slider">Speech Pitch: {{ localSettings.ttsPitch.toFixed(1) }}</label>
          <input 
            id="pitch-slider"
            type="range" 
            min="0" 
            max="2" 
            step="0.1"
            v-model.number="localSettings.ttsPitch"
            class="slider"
          />
        </div>
        
        <div class="setting-item" v-if="localSettings.ttsEnabled">
          <label for="volume-slider">Speech Volume: {{ localSettings.ttsVolume.toFixed(1) }}</label>
          <input 
            id="volume-slider"
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            v-model.number="localSettings.ttsVolume"
            class="slider"
          />
        </div>
        
        <div class="setting-item" v-if="localSettings.ttsEnabled">
          <BaseButton 
            type="button"
            variant="secondary"
            size="sm"
            @click="testSpeech"
            :disabled="!selectedVoiceURI"
          >
            Test Speech
          </BaseButton>
        </div>
      </div>
      
      <div class="setting-group">
        <h3>Appearance</h3>
        
        <div class="setting-item">
          <label for="theme-select">Theme</label>
          <select 
            id="theme-select" 
            v-model="localSettings.theme"
            class="select"
          >
            <option value="auto">Auto (System)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
      
      <div class="setting-group" v-if="appStore.channels.length > 0">
        <h3>Default Channel</h3>
        
        <div class="setting-item">
          <label for="default-channel-select">Default Channel</label>
          <select 
            id="default-channel-select" 
            v-model="localSettings.defaultChannelId"
            class="select"
          >
            <option :value="null">None</option>
            <option 
              v-for="channel in appStore.channels" 
              :key="channel.id"
              :value="channel.id"
            >
              {{ channel.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="form-actions">
        <BaseButton
          type="button"
          variant="secondary"
          @click="$emit('close')"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="isSaving"
        >
          Save Settings
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { useAudio } from '@/composables/useAudio'
import BaseButton from '@/components/base/BaseButton.vue'
import type { AppSettings } from '@/types'

const emit = defineEmits<{
  close: []
}>()

const appStore = useAppStore()
const toastStore = useToastStore()
const { availableVoices, speak, setVoice } = useAudio()

const isSaving = ref(false)
const selectedVoiceURI = ref('')
const localSettings = reactive<AppSettings>({
  soundEnabled: true,
  speechEnabled: true,
  ttsEnabled: true,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVolume: 1,
  selectedVoiceURI: null,
  defaultChannelId: null,
  theme: 'auto'
})

const handleVoiceChange = () => {
  const voice = availableVoices.value.find(v => v.voiceURI === selectedVoiceURI.value)
  if (voice) {
    setVoice(voice)
    localSettings.selectedVoiceURI = voice.voiceURI
  }
}

const testSpeech = async () => {
  try {
    await speak('This is a test of the text-to-speech system.', {
      rate: localSettings.ttsRate,
      pitch: localSettings.ttsPitch,
      volume: localSettings.ttsVolume
    })
  } catch (error) {
    toastStore.error('Speech test failed')
  }
}

const handleSave = async () => {
  isSaving.value = true
  
  try {
    await appStore.updateSettings(localSettings)
    toastStore.success('Settings saved successfully!')
    emit('close')
  } catch (error) {
    console.error('Failed to save settings:', error)
    toastStore.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  // Copy current settings to local state
  Object.assign(localSettings, appStore.settings)
  
  // Set up voice selection
  selectedVoiceURI.value = appStore.settings.selectedVoiceURI || ''
})
</script>

<style scoped>
.settings-dialog {
  padding: 1rem 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-group h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.setting-item label {
  font-weight: 500;
  color: #374151;
}

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #646cff;
  cursor: pointer;
}

.select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #111827;
  font-size: 0.875rem;
  min-width: 150px;
  cursor: pointer;
}

.select:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.slider {
  width: 100%;
  max-width: 200px;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  outline: none;
  cursor: pointer;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #646cff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #646cff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .setting-group h3 {
    color: rgba(255, 255, 255, 0.87);
    border-bottom-color: #374151;
  }
  
  .setting-item label {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .select {
    background: #374151;
    color: rgba(255, 255, 255, 0.87);
    border-color: #4b5563;
  }
  
  .form-actions {
    border-top-color: #374151;
  }
}
</style>