<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAiChat } from '../composables/useAiChat'
import ConversationTimeline from '../components/ConversationTimeline.vue'
import ChatInput from '../components/ChatInput.vue'

interface AiRecommendationsProps {
  symbolRoot: string
  userId?: string | null
}

const props = withDefaults(defineProps<AiRecommendationsProps>(), {
  userId: null,
  symbolRoot: ''
})

const {
  conversations,
  isLoading,
  isProcessing,
  isCapturing,
  error,
  hasConversations,
  loadConversations,
  askQuestion,
  deleteConversation,
  clearAllConversations
} = useAiChat(props.userId || '', props.symbolRoot)

// Load conversations on mount
onMounted(async () => {
  if (props.userId && props.symbolRoot) {
    await loadConversations()
  }
})

// Reload conversations when userId or symbolRoot changes
watch(
  () => [props.userId, props.symbolRoot],
  async ([newUserId, newSymbolRoot]) => {
    if (newUserId && newSymbolRoot) {
      await loadConversations()
    }
  }
)

const handleSubmit = async (question: string) => {
  try {
    await askQuestion(question, true) // Always include screenshot
  } catch (err) {
    console.error('Failed to ask question:', err)
  }
}

const handleDelete = async (conversationId: string) => {
  if (confirm('Are you sure you want to delete this conversation?')) {
    try {
      await deleteConversation(conversationId)
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }
}

const handleClearAll = async () => {
  if (confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
    try {
      await clearAllConversations()
    } catch (err) {
      console.error('Failed to clear conversations:', err)
    }
  }
}
</script>

<template>
  <div class="ai-recommendation-box">
    <div class="recommendation-header">
      <div class="header-content">
        <h2>🤖 AI Recommendations</h2>
        <!--span class="symbol-badge">{{ symbolRoot }}</span-->
      </div>
      <p class="header-subtitle">Get AI-powered analysis and recommendations for your positions</p>
    </div>

    <div v-if="!userId" class="error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Authentication Required</h3>
      <p>Please log in to access AI recommendations</p>
    </div>

    <div v-else-if="!symbolRoot" class="error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Symbol Not Found</h3>
      <p>No symbol root provided for analysis</p>
    </div>

    <div v-else class="recommendation-content">
      <ConversationTimeline
        :conversations="conversations"
        :is-loading="isLoading"
        @delete="handleDelete"
        @clear-all="handleClearAll"
      />

      <ChatInput
        :disabled="!userId || !symbolRoot || isCapturing"
        :is-processing="isProcessing || isCapturing"
        @submit="handleSubmit"
      />

      <div v-if="error" class="error-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <div v-if="isCapturing" class="capture-banner">
        <div class="loading-spinner-small"></div>
        <span>📸 Capturing screenshot...</span>
      </div>
    </div>
  </div>
</template>

<style>
@import '../styles/styles.css';
</style>

<style scoped>
@import '../styles/scoped-styles.css';
</style>