<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean
  isProcessing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isProcessing: false
})

const emit = defineEmits<{
  (e: 'submit', question: string): void
}>()

const question = ref('')

const handleSubmit = () => {
  if (!question.value.trim() || props.disabled || props.isProcessing) return
  
  emit('submit', question.value.trim())
  question.value = ''
}

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="chat-input-container">
    <div class="input-wrapper">
      <textarea
        v-model="question"
        placeholder="Ask about your positions, risk analysis, or trading strategies..."
        class="chat-textarea"
        rows="2"
        :disabled="disabled || isProcessing"
        @keydown="handleKeydown"
      ></textarea>
      <button 
        @click="handleSubmit" 
        :disabled="!question.trim() || disabled || isProcessing"
        class="send-button"
        title="Send message (Ctrl+Enter)"
      >
        <svg v-if="isProcessing" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loading-icon">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22,2 15,22 11,13 2,9 22,2"/>
        </svg>
      </button>
    </div>
    <div class="input-hints">
      <span class="hint">📸 Screenshots automatically included</span>
      <span class="hint">⌨️ Ctrl+Enter to send</span>
    </div>
  </div>
</template>

<style scoped>
.chat-input-container {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.chat-textarea {
  flex: 1;
  resize: none;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  font-family: inherit;
  background: #fafafa;
  transition: all 0.2s;
}

.chat-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-textarea:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.send-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  width: auto;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.input-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.hint {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .input-hints {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>