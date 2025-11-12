<script setup lang="ts">
import type { AiConversation } from '../types'
import { computed } from 'vue'

interface Props {
  conversation: AiConversation
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'show-screenshot', screenshot: string): void
  (e: 'delete', id: string): void
}>()

const formattedTime = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(props.conversation.created_at)
})

const formatResponse = (response: string) => {
  // Enhanced markdown formatting
  return response
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/, '<p>$1</p>')
}
</script>

<template>
  <div class="chat-message-group">
    <!-- User Question -->
    <div class="message user-message">
      <div class="message-header">
        <span class="sender">You</span>
        <span class="timestamp">{{ formattedTime }}</span>
      </div>
      <div class="message-content">
        <p>{{ conversation.question }}</p>
      </div>
      <div v-if="conversation.screenshot" class="screenshot-preview">
        <img 
          :src="conversation.screenshot" 
          alt="Position screenshot" 
          @click="emit('show-screenshot', conversation.screenshot!)"
        >
        <span class="screenshot-label">📸 Screenshot attached</span>
      </div>
    </div>

    <!-- AI Response -->
    <div class="message ai-message">
      <div class="message-header">
        <div class="sender-info">
          <span class="sender ai">🤖 AI Recommendations</span>
          <span class="model-badge">{{ conversation.model }}</span>
        </div>
        <button 
          v-if="!conversation.loading && !conversation.error"
          @click="emit('delete', conversation.id)"
          class="delete-button"
          title="Delete conversation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
      
      <div v-if="conversation.loading" class="loading-response">
        <div class="loading-spinner"></div>
        <span>Analyzing your position...</span>
      </div>
      
      <div v-else-if="conversation.error" class="error-response">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>{{ conversation.error }}</span>
      </div>
      
      <div v-else v-html="formatResponse(conversation.ai_response)" class="message-content response-content"></div>
    </div>
  </div>
</template>

<style scoped>
.chat-message-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.message {
  padding: 1rem;
  border-radius: 12px;
  max-width: 85%;
}

.user-message {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message {
  align-self: flex-start;
  background: #f8f9fa;
  color: #1a202c;
  border-bottom-left-radius: 4px;
  max-width: 90%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sender {
  font-weight: 600;
}

.sender.ai {
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.model-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 9999px;
  font-weight: 500;
}

.timestamp {
  font-size: 0.75rem;
  opacity: 0.7;
}

.delete-button {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: #6b7280;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
}

.delete-button:hover {
  background: #e5e7eb;
  color: #dc2626;
}

.message-content {
  line-height: 1.6;
}

.message-content p {
  margin: 0.5rem 0;
}

.message-content:first-child p:first-child {
  margin-top: 0;
}

.message-content:last-child p:last-child {
  margin-bottom: 0;
}

.response-content :deep(strong) {
  color: #1a202c;
  font-weight: 600;
}

.response-content :deep(code) {
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875em;
}

.screenshot-preview {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.screenshot-preview img {
  max-width: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.screenshot-preview img:hover {
  opacity: 0.85;
}

.screenshot-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

.loading-response {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
  padding: 0.5rem 0;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-response {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc2626;
  padding: 0.5rem;
  background: #fee2e2;
  border-radius: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
  
  .ai-message {
    max-width: 95%;
  }
}
</style>