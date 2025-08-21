import { onMounted, onUnmounted, ref, readonly } from 'vue'

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
  preventDefault?: boolean
}

export function useKeyboardShortcuts() {
  const shortcuts = ref<Map<string, ShortcutConfig>>(new Map())
  const isListening = ref(false)

  const getShortcutKey = (config: ShortcutConfig): string => {
    const parts = []
    if (config.ctrlKey) parts.push('ctrl')
    if (config.shiftKey) parts.push('shift') 
    if (config.altKey) parts.push('alt')
    if (config.metaKey) parts.push('meta')
    parts.push(config.key.toLowerCase())
    return parts.join('+')
  }

  const handleKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    const isInInputField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

    const config: ShortcutConfig = {
      key: event.key.toLowerCase(),
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      handler: () => {}
    }

    const shortcutKey = getShortcutKey(config)
    const shortcut = shortcuts.value.get(shortcutKey)

    if (shortcut) {
      // Allow certain shortcuts to work globally, even in input fields
      const isGlobalShortcut = (shortcut.ctrlKey && shortcut.shiftKey) || 
                              shortcut.altKey || 
                              shortcut.key === 'escape'
      
      // Skip shortcuts that shouldn't work in input fields
      if (isInInputField && !isGlobalShortcut) {
        return
      }
      
      if (shortcut.preventDefault !== false) {
        event.preventDefault()
      }
      shortcut.handler()
    }
  }

  const addShortcut = (config: ShortcutConfig) => {
    const key = getShortcutKey(config)
    shortcuts.value.set(key, config)
  }

  const removeShortcut = (config: Omit<ShortcutConfig, 'handler'>) => {
    const key = getShortcutKey(config as ShortcutConfig)
    shortcuts.value.delete(key)
  }

  const startListening = () => {
    if (!isListening.value) {
      document.addEventListener('keydown', handleKeydown)
      isListening.value = true
    }
  }

  const stopListening = () => {
    if (isListening.value) {
      document.removeEventListener('keydown', handleKeydown)
      isListening.value = false
    }
  }

  onMounted(() => {
    startListening()
  })

  onUnmounted(() => {
    stopListening()
  })

  return {
    addShortcut,
    removeShortcut,
    startListening,
    stopListening,
    isListening
  }
}