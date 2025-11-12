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
  let formatted = response
    // Headers (##, ###, etc.)
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Tables - detect and convert markdown tables
    .replace(/(\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g, (match) => {
      const lines = match.trim().split('\n')
      const headers = lines[0].split('|').filter(cell => cell.trim())
      const rows = lines.slice(2).map(row => 
        row.split('|').filter(cell => cell.trim())
      )
      
      let table = '<table><thead><tr>'
      headers.forEach(header => {
        table += `<th>${header.trim()}</th>`
      })
      table += '</tr></thead><tbody>'
      
      rows.forEach(row => {
        table += '<tr>'
        row.forEach(cell => {
          table += `<td>${cell.trim()}</td>`
        })
        table += '</tr>'
      })
      table += '</tbody></table>'
      
      return table
    })
    
    // Unordered lists
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>.*?<\/li>(?:\n)?)+/g, '<ul>$&</ul>')
    
    // Line breaks and paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    
  // Wrap in paragraph if not already wrapped in block element
  if (!formatted.match(/^<(h[1-6]|table|ul|ol|div|p)/)) {
    formatted = `<p>${formatted}</p>`
  }
  
  return formatted
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
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.message {
  padding: 0.75rem;
  border-radius: 8px;
  max-width: 85%;
  font-size: 0.875rem;
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
  font-size: 0.75rem;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.sender {
  font-weight: 600;
  font-size: 0.75rem;
}

.sender.ai {
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.model-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 9999px;
  font-weight: 500;
}

.timestamp {
  font-size: 0.625rem;
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
  line-height: normal;
  font-size: 0.875rem;
}

.message-content p {
  margin: 0.375rem 0;
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
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.813rem;
}

.response-content :deep(h1),
.response-content :deep(h2),
.response-content :deep(h3) {
  margin: 0;
  font-weight: 600;
  line-height: 1.3;
}

.response-content :deep(h1) {
  font-size: 1.125rem;
  color: #111827;
}

.response-content :deep(h2) {
  font-size: 1rem;
  color: #1f2937;
}

.response-content :deep(h3) {
  font-size: 0.938rem;
  color: #374151;
}

.response-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
  font-size: 0.813rem;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.response-content :deep(thead) {
  background: #f9fafb;
}

.response-content :deep(th) {
  padding: 0.2rem 0.3rem;
  text-align: left;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.75rem;
}

.response-content :deep(td) {
  padding: 0.2rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.813rem;
}

.response-content :deep(tbody tr:last-child td) {
  border-bottom: none;
}

.response-content :deep(tbody tr:hover) {
  background: #fafafa;
}

.response-content :deep(ul) {
  margin: 0.375rem 0;
  padding-left: 1.25rem;
}

.response-content :deep(li) {
  margin: 0.25rem 0;
  line-height: 1.5;
  font-size: 0.875rem;
}

.screenshot-preview {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.screenshot-preview img {
  max-width: 180px;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.screenshot-preview img:hover {
  opacity: 0.85;
}

.screenshot-label {
  font-size: 0.688rem;
  opacity: 0.9;
}

.loading-response {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: #6b7280;
  padding: 0.375rem 0;
  font-size: 0.813rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-response {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #dc2626;
  padding: 0.375rem;
  background: #fee2e2;
  border-radius: 4px;
  font-size: 0.813rem;
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