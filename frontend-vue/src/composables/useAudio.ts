import { ref, computed, readonly } from 'vue'
import { useAppStore } from '@/stores/app'

interface AudioRecording {
  blob: Blob | null
  duration: number
  isRecording: boolean
  isPlaying: boolean
  currentTime: number
}

// Global audio state to ensure singleton behavior
let audioSystemInitialized = false
let soundsLoaded = false
let globalAudioContext: AudioContext | null = null
let globalSoundBuffers = new Map<string, AudioBuffer>()
let globalWaterSounds: AudioBuffer[] = []
let globalSentSounds: AudioBuffer[] = []

export function useAudio() {
  const appStore = useAppStore()
  
  // Audio Context (use global instance)
  const audioContext = ref<AudioContext | null>(globalAudioContext)
  
  // Sound buffers (use global arrays)
  const soundBuffers = ref<Map<string, AudioBuffer>>(globalSoundBuffers)
  const waterSounds = ref<AudioBuffer[]>(globalWaterSounds)
  const sentSounds = ref<AudioBuffer[]>(globalSentSounds)
  
  // Recording state
  const recording = ref<AudioRecording>({
    blob: null,
    duration: 0,
    isRecording: false,
    isPlaying: false,
    currentTime: 0
  })
  
  // Media recorder
  let mediaRecorder: MediaRecorder | null = null
  let recordingChunks: Blob[] = []
  let recordingStartTime: number = 0
  let recordingInterval: number | null = null

  // Text-to-speech state
  const isSpeaking = ref(false)
  const availableVoices = ref<SpeechSynthesisVoice[]>([])
  const selectedVoice = ref<SpeechSynthesisVoice | null>(null)

  // Initialize audio context
  const initAudioContext = async () => {
    if (!globalAudioContext) {
      globalAudioContext = new AudioContext()
      audioContext.value = globalAudioContext
    }
    
    if (globalAudioContext.state === 'suspended') {
      try {
        await globalAudioContext.resume()
      } catch (error) {
        console.warn('AudioContext resume failed, user interaction required:', error)
      }
    }
  }

  // Load a single sound file
  const loadSound = async (url: string): Promise<AudioBuffer | null> => {
    try {
      if (!audioContext.value) {
        await initAudioContext()
      }
      
      if (!audioContext.value) {
        // AudioContext creation failed (probably no user interaction yet)
        return null
      }
      
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      return await audioContext.value.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.warn(`Failed to load sound ${url}:`, error)
      return null
    }
  }

  // Load all sound files
  const loadAllSounds = async () => {
    if (soundsLoaded) {
      console.log('Sounds already loaded, skipping...')
      return
    }
    
    try {
      console.log('Starting to load all sounds...')
      soundsLoaded = true
      
      // Load basic sounds
      const basicSounds = {
        intro: '/sounds/intro.wav',
        login: '/sounds/login.wav', 
        copy: '/sounds/copy.wav',
        uploadFailed: '/sounds/uploadfail.wav'
      }

      for (const [name, url] of Object.entries(basicSounds)) {
        const buffer = await loadSound(url)
        if (buffer) {
          globalSoundBuffers.set(name, buffer)
          soundBuffers.value.set(name, buffer)
        }
      }

      // Load water sounds (1-10)
      console.log('Loading water sounds...')
      for (let i = 1; i <= 10; i++) {
        const buffer = await loadSound(`/sounds/water${i}.wav`)
        if (buffer) {
          globalWaterSounds.push(buffer)
          waterSounds.value.push(buffer)
          console.log(`Loaded water sound ${i}`)
        } else {
          console.warn(`Failed to load water sound ${i}`)
        }
      }
      console.log(`Water sounds loaded: ${globalWaterSounds.length}/10, reactive: ${waterSounds.value.length}/10`)

      // Load sent sounds (1-6)  
      for (let i = 1; i <= 6; i++) {
        const buffer = await loadSound(`/sounds/sent${i}.wav`)
        if (buffer) {
          globalSentSounds.push(buffer)
          sentSounds.value.push(buffer)
        }
      }

      console.log('All sounds loaded and ready to play')
    } catch (error) {
      console.error('Error loading sounds:', error)
    }
  }

  // Play a sound buffer
  const playSoundBuffer = async (buffer: AudioBuffer) => {
    if (!appStore.settings.soundEnabled) return
    
    try {
      await initAudioContext()
      if (!globalAudioContext) {
        console.error('AudioContext not initialized')
        return
      }
      const source = globalAudioContext.createBufferSource()
      source.buffer = buffer
      source.connect(globalAudioContext.destination)
      source.start(0)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  // Play specific sounds
  const playSound = async (name: string) => {
    const buffer = globalSoundBuffers.get(name)
    if (buffer) {
      await playSoundBuffer(buffer)
    } else {
      console.warn(`Sound ${name} not loaded`)
    }
  }

  const playWater = async () => {
    console.log(`playWater called - global: ${globalWaterSounds.length}, reactive: ${waterSounds.value.length} water sounds available`)
    if (globalWaterSounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * globalWaterSounds.length)
      await playSoundBuffer(globalWaterSounds[randomIndex])
    } else {
      console.warn('Water sounds not loaded - trying to load them now')
      if (globalAudioContext) {
        await loadAllSounds()
        if (globalWaterSounds.length > 0) {
          const randomIndex = Math.floor(Math.random() * globalWaterSounds.length)
          await playSoundBuffer(globalWaterSounds[randomIndex])
        }
      }
    }
  }

  const playSent = async () => {
    if (globalSentSounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * globalSentSounds.length)
      await playSoundBuffer(globalSentSounds[randomIndex])
    } else {
      console.warn('Sent sounds not loaded')
    }
  }

  // Voice recording
  const startRecording = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        }
      })

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      recordingChunks = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunks, { type: 'audio/webm;codecs=opus' })
        recording.value.blob = blob
        recording.value.isRecording = false
        
        if (recordingInterval) {
          clearInterval(recordingInterval)
          recordingInterval = null
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      recording.value.isRecording = true
      recording.value.duration = 0
      recordingStartTime = Date.now()

      // Update duration every 100ms
      recordingInterval = setInterval(() => {
        recording.value.duration = (Date.now() - recordingStartTime) / 1000
      }, 100)

      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      recording.value.isRecording = false
      return false
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && recording.value.isRecording) {
      mediaRecorder.stop()
    }
  }

  const playRecording = async () => {
    if (!recording.value.blob) return false

    try {
      const audio = new Audio(URL.createObjectURL(recording.value.blob))
      
      recording.value.isPlaying = true
      recording.value.currentTime = 0
      
      audio.ontimeupdate = () => {
        recording.value.currentTime = audio.currentTime
      }
      
      audio.onended = () => {
        recording.value.isPlaying = false
        recording.value.currentTime = 0
        URL.revokeObjectURL(audio.src)
      }
      
      await audio.play()
      return true
    } catch (error) {
      console.error('Failed to play recording:', error)
      recording.value.isPlaying = false
      return false
    }
  }

  const clearRecording = () => {
    if (recording.value.blob) {
      URL.revokeObjectURL(URL.createObjectURL(recording.value.blob))
    }
    recording.value.blob = null
    recording.value.duration = 0
    recording.value.isPlaying = false
    recording.value.currentTime = 0
  }

  // Text-to-speech functions
  const loadVoices = () => {
    const voices = speechSynthesis.getVoices()
    availableVoices.value = voices
    
    // Select default voice (prefer English voices)
    if (!selectedVoice.value && voices.length > 0) {
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'))
      selectedVoice.value = englishVoice || voices[0]
    }
  }

  const speak = (text: string, options: { rate?: number, pitch?: number, volume?: number } = {}) => {
    if (!appStore.settings.ttsEnabled) return Promise.resolve()
    
    return new Promise<void>((resolve, reject) => {
      if ('speechSynthesis' in window) {
        // Stop any current speech
        speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance(text)
        
        // Set voice if available
        if (selectedVoice.value) {
          utterance.voice = selectedVoice.value
        }
        
        // Apply options
        utterance.rate = options.rate || appStore.settings.ttsRate || 1
        utterance.pitch = options.pitch || appStore.settings.ttsPitch || 1
        utterance.volume = options.volume || appStore.settings.ttsVolume || 1
        
        utterance.onstart = () => {
          isSpeaking.value = true
        }
        
        utterance.onend = () => {
          isSpeaking.value = false
          resolve()
        }
        
        utterance.onerror = (event) => {
          isSpeaking.value = false
          console.error('Speech synthesis error:', event.error)
          reject(new Error(`Speech synthesis failed: ${event.error}`))
        }
        
        speechSynthesis.speak(utterance)
      } else {
        reject(new Error('Speech synthesis not supported'))
      }
    })
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      isSpeaking.value = false
    }
  }

  const setVoice = (voice: SpeechSynthesisVoice) => {
    selectedVoice.value = voice
    appStore.updateSettings({ selectedVoiceURI: voice.voiceURI })
  }

  // Announce message for accessibility
  const announceMessage = async (content: string, channel?: string) => {
    if (!appStore.settings.ttsEnabled) return
    
    let textToSpeak = content
    if (channel) {
      textToSpeak = `New message in ${channel}: ${content}`
    }
    
    try {
      await speak(textToSpeak)
    } catch (error) {
      console.error('Failed to announce message:', error)
    }
  }

  // Computed
  const canRecord = computed(() => {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  })

  const recordingDurationFormatted = computed(() => {
    const duration = recording.value.duration
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })

  // Initialize audio on first user interaction
  const initAudioOnUserGesture = async () => {
    if (!audioContext.value || audioContext.value.state === 'suspended') {
      await initAudioContext()
    }
  }

  // Initialize audio system (only once)
  const initializeAudioSystem = () => {
    if (!audioSystemInitialized) {
      audioSystemInitialized = true
      
      // Set up user gesture listeners to initialize audio and load sounds
      const initializeAudio = async () => {
        console.log('User interaction detected, initializing audio system...')
        await initAudioOnUserGesture()
        await loadAllSounds() // Load sounds after user interaction
        console.log('Audio system initialized')
        document.removeEventListener('click', initializeAudio)
        document.removeEventListener('keydown', initializeAudio)
      }
      
      document.addEventListener('click', initializeAudio, { once: true })
      document.addEventListener('keydown', initializeAudio, { once: true })
      
      // Initialize voices for speech synthesis
      if ('speechSynthesis' in window) {
        loadVoices()
        // Voices may not be immediately available
        speechSynthesis.addEventListener('voiceschanged', loadVoices)
        
        // Restore selected voice from settings
        if (appStore.settings.selectedVoiceURI) {
          const voices = speechSynthesis.getVoices()
          const savedVoice = voices.find(v => v.voiceURI === appStore.settings.selectedVoiceURI)
          if (savedVoice) {
            selectedVoice.value = savedVoice
          }
        }
      }
    }
  }
  
  // Initialize audio system when composable is first used
  initializeAudioSystem()

  return {
    // State
    recording,
    canRecord,
    recordingDurationFormatted,
    isSpeaking: readonly(isSpeaking),
    availableVoices: readonly(availableVoices),
    selectedVoice: readonly(selectedVoice),
    
    // Audio playback
    playSound,
    playWater,
    playSent,
    
    // Voice recording
    startRecording,
    stopRecording,
    playRecording,
    clearRecording,
    
    // Text-to-speech
    speak,
    stopSpeaking,
    setVoice,
    announceMessage,
    
    // Audio context
    initAudioContext
  }
}