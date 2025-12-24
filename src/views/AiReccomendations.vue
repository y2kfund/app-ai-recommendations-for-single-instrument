<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { useAiChat } from '../composables/useAiChat'
import ConversationTimeline from '../components/ConversationTimeline.vue'
import ChatInput from '../components/ChatInput.vue'
import Journal from '../components/Journal.vue'

interface AiRecommendationsProps {
  symbolRoot: string
  userId?: string | null
  defaultTab?: 'analyst' | 'journal'
  noteId?: string | null
}

const props = withDefaults(defineProps<AiRecommendationsProps>(), {
  userId: '67e578fd-2cf7-48a4-b028-a11a3f89bb9b',
  symbolRoot: 'NotePage',
  defaultTab: 'analyst',
  noteId: null,
})

const emit = defineEmits<{
  'update:defaultTab': [value: 'analyst' | 'journal']
  'update:selectedEntry': [entry: any]
}>()

// Helper functions for URL params (similar to Summary.vue)
function parseTabFromUrl(): 'analyst' | 'journal' {
  const url = new URL(window.location.href)
  const tabParam = url.searchParams.get('analystJournalActiveTab')
  if (tabParam === 'analyst' || tabParam === 'journal') {
    return tabParam
  }
  return props.defaultTab
}

function writeTabToUrl(tab: 'analyst' | 'journal') {
  const url = new URL(window.location.href)
  url.searchParams.set('analystJournalActiveTab', tab)
  window.history.replaceState({}, '', url.toString())
}

// Initialize activeTab from URL params or prop default
const activeTab = ref<'analyst' | 'journal'>(parseTabFromUrl())

// Update URL when tab changes
watch(activeTab, (newTab) => {
  emit('update:defaultTab', newTab)
  writeTabToUrl(newTab)
})

// Listen for browser back/forward navigation
onMounted(() => {
  window.addEventListener('popstate', () => {
    const newTab = parseTabFromUrl()
    if (newTab !== activeTab.value) {
      activeTab.value = newTab
    }
  })
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

// Track selected journal entry
const selectedJournalEntry = ref<any>(null)

// Compute journal tab label
const journalTabLabel = computed(() => {
  return selectedJournalEntry.value?.title || 'Journal'
})

const handleSelectedEntryUpdate = (entry: any) => {
  selectedJournalEntry.value = entry
  emit('update:selectedEntry', entry)
}

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
      // Reset selected entry when switching symbols
      selectedJournalEntry.value = null
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
    <div class="recommendation-header" v-if="symbolRoot !== 'NotePage'">
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
            {{ journalTabLabel }}
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

    <div v-else-if="symbolRoot === 'NotePage'" class="journal-only-content">
      <Journal
          :user-id="userId"
          :symbol-root="symbolRoot"
          @update:selected-entry="handleSelectedEntryUpdate" 
          :note-id="props.noteId"
        />
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
          @update:selected-entry="handleSelectedEntryUpdate" 
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

.recommendation-header {
  background: transparent;
  padding: 0 !important;
}
.header-content {
    border-bottom: 1px solid #3b82f6;
    margin-bottom: 6px;
}
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab {
  padding: 7px 20px !important;
  border: none;
  border-bottom: 1px solid #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  width: auto;
  color: #000;
  margin-bottom: -2px;
  border-radius: 0;
  background: #fff;
}

.tab.active {
    color: #3b82f6;
    border: 1px solid #3b82f6;
    font-weight: 600;
    border-bottom: transparent;
    border-radius: 6px 6px 0 0;
}
</style>