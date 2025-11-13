<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ChatMessage from './ChatMessage.vue'
import type { AiConversation } from '../types'

interface Props {
  conversations: AiConversation[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'clear-all'): void
}>()

const timelineRef = ref<HTMLElement>()
const selectedScreenshot = ref<string | null>(null)

const showScreenshot = (screenshot: string) => {
  selectedScreenshot.value = screenshot
}

const scrollToBottom = () => {
  nextTick(() => {
    if (timelineRef.value) {
      timelineRef.value.scrollTop = timelineRef.value.scrollHeight
    }
  })
}

// Auto-scroll when new conversations are added
watch(() => props.conversations.length, () => {
  scrollToBottom()
})
</script>

<template>
  <div class="conversation-timeline-container">
    <!--div class="timeline-header">
      <h3>Conversation History</h3>
      <button 
        v-if="conversations.length > 0"
        @click="emit('clear-all')"
        class="clear-button"
        title="Clear all conversations"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Clear All
      </button>
    </div-->

    <div class="timeline-content" ref="timelineRef">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner-large"></div>
        <p>Loading conversations...</p>
      </div>

      <div v-else-if="conversations.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 10h.01"/>
          <path d="M12 10h.01"/>
          <path d="M16 10h.01"/>
        </svg>
        <h4>Start a Conversation</h4>
        <p>Ask questions about your positions, get risk analysis, or receive trading recommendations.</p>
      </div>

      <div v-else class="messages-list">
        <ChatMessage
          v-for="conversation in conversations"
          :key="conversation.id"
          :conversation="conversation"
          @show-screenshot="showScreenshot"
          @delete="emit('delete', $event)"
        />
      </div>
    </div>

    <!-- Screenshot Modal -->
    <Teleport to="body">
      <div 
        v-if="selectedScreenshot" 
        class="screenshot-modal"
        @click="selectedScreenshot = null"
      >
        <div class="screenshot-modal-content" @click.stop>
          <button @click="selectedScreenshot = null" class="modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img :src="selectedScreenshot" alt="Full screenshot">
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.conversation-timeline-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.timeline-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.timeline-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.875rem;
  transition: all 0.2s;
  width: auto;
}

.clear-button:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.timeline-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #6b7280;
}

.empty-state svg {
  margin-bottom: 1.5rem;
  color: #d1d5db;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1.125rem;
}

.empty-state p {
  margin: 0;
  max-width: 300px;
  font-size: 0.875rem;
  line-height: 1.5;
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.screenshot-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
  cursor: pointer;
}

.screenshot-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  cursor: default;
}

.screenshot-modal-content img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: -3rem;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .timeline-header {
    padding: 0.75rem 1rem;
  }

  .clear-button {
    font-size: 0.8125rem;
    padding: 0.375rem 0.625rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .screenshot-modal {
    padding: 1rem;
  }
}
</style>