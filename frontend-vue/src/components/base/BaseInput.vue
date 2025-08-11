<template>
  <div class="base-input">
    <label v-if="label" :for="inputId" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>
    
    <div class="base-input__wrapper">
      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :class="[
          'base-input__field',
          { 'base-input__field--error': error }
        ]"
        @input="handleInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @keydown="$emit('keydown', $event)"
        @keyup="$emit('keyup', $event)"
      />
    </div>
    
    <div v-if="error" :id="`${inputId}-error`" class="base-input__error">
      {{ error }}
    </div>
    
    <div v-else-if="helpText" class="base-input__help">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autocomplete?: string
  error?: string
  helpText?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
}>()

const inputRef = ref<HTMLInputElement>()
const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? parseFloat(target.value) || 0 : target.value
  emit('update:modelValue', value)
}

const focus = () => {
  inputRef.value?.focus()
}

defineExpose({
  focus,
  inputRef
})
</script>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.base-input__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.base-input__required {
  color: #ef4444;
}

.base-input__wrapper {
  position: relative;
}

.base-input__field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background-color: #ffffff;
  color: #111827;
  transition: all 0.2s ease;
  outline: none;
}

.base-input__field:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.base-input__field:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.base-input__field:readonly {
  background-color: #f9fafb;
  cursor: default;
}

.base-input__field--error {
  border-color: #ef4444;
}

.base-input__field--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.base-input__error {
  font-size: 0.875rem;
  color: #ef4444;
}

.base-input__help {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .base-input__label {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .base-input__field {
    background-color: #374151;
    color: rgba(255, 255, 255, 0.87);
    border-color: #4b5563;
  }
  
  .base-input__field:disabled,
  .base-input__field:readonly {
    background-color: #1f2937;
    color: #9ca3af;
  }
  
  .base-input__help {
    color: #9ca3af;
  }
}
</style>