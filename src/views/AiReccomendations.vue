<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAiChat } from '../composables/useAiChat'
import ConversationTimeline from '../components/ConversationTimeline.vue'
import ChatInput from '../components/ChatInput.vue'
import Journal from '../components/Journal.vue'

interface AiRecommendationsProps {
  symbolRoot: string
  userId?: string | null
  // Make it controllable via v-model
  defaultTab?: 'analyst' | 'journal'
}

const props = withDefaults(defineProps<AiRecommendationsProps>(), {
  userId: '67e578fd-2cf7-48a4-b028-a11a3f89bb9b',
  symbolRoot: 'META',
  defaultTab: 'analyst'
})

const emit = defineEmits<{
  'update:defaultTab': [value: 'analyst' | 'journal']
}>()

// Initialize activeTab from prop
const activeTab = ref<'analyst' | 'journal'>(props.defaultTab)

// Watch prop changes
watch(() => props.defaultTab, (newTab) => {
  activeTab.value = newTab
})

// Emit changes to parent
watch(activeTab, (newTab) => {
  emit('update:defaultTab', newTab)
})

// Try to get router, but don't fail if it's not available
let route: any = null
let router: any = null

try {
  route = useRoute()
  router = useRouter()
} catch (error) {
  console.log('Router not available, using component in standalone mode')
}

// Initialize activeTab from URL params (if router available) or prop default
const urlActiveTab = ref<'analyst' | 'journal'>(
  route?.query?.analystJournalActiveTab as 'analyst' | 'journal' || props.defaultTab
)

// Watch activeTab and update URL params only if router is available
watch(activeTab, (newTab) => {
  if (router && route) {
    router.replace({
      query: {
        ...route.query,
        analystJournalActiveTab: newTab
      }
    }).catch(() => {
      // Ignore navigation errors
    })
  }
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
    await askQuestion(question, true)
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
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'analyst' }]"
            @click="activeTab = 'analyst'"
          >
            Analyst
          </button>
          <button
            :class="['tab', { active: activeTab === 'journal' }]"
            @click="activeTab = 'journal'"
          >
            Journal
          </button>
        </div>
      </div>
    </div>

    <div v-if="!userId" class="error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Authentication Required</h3>
      <p>Please log in to access this feature</p>
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
      <!-- Analyst Tab -->
      <div v-show="activeTab === 'analyst'">
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

      <!-- Journal Tab -->
      <div v-show="activeTab === 'journal'">
        <Journal
          :user-id="userId"
          :symbol-root="symbolRoot"
        />
      </div>
    </div>
  </div>
</template>

<style>
@import '../styles/styles.css';
</style>

<style scoped>
@import '../styles/scoped-styles.css';

.tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.tab.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #fff;
}
</style>