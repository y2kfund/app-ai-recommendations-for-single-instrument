import { ref, computed } from 'vue'
import { aiService } from '../services/aiService'
import { useScreenshot } from './useScreenshot'
import { useConversationStorage } from './useConversationStorage'
import type { AiConversation, ConversationContext } from '../types'

export function useAiChat(userId: string, symbolRoot: string) {
  const { captureInstrumentDetails, isCapturing } = useScreenshot()
  const {
    conversations,
    isLoading,
    error: storageError,
    loadConversations,
    saveConversation,
    deleteConversation,
    clearAllConversations
  } = useConversationStorage(userId, symbolRoot)

  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  const hasConversations = computed(() => conversations.value.length > 0)

  /**
   * Get the last conversation for context
   */
  const getLastConversationContext = (): ConversationContext | undefined => {
    if (conversations.value.length === 0) return undefined

    const last = conversations.value[conversations.value.length - 1]
    return {
      previousQuestion: last.question,
      previousResponse: last.ai_response
    }
  }

  /**
   * Ask a question with automatic screenshot capture
   */
  const askQuestion = async (question: string, includeScreenshot = true) => {
    if (!userId || !symbolRoot) {
      error.value = 'User ID and Symbol Root are required'
      throw new Error(error.value)
    }

    if (!question.trim()) {
      error.value = 'Question cannot be empty'
      throw new Error(error.value)
    }

    isProcessing.value = true
    error.value = null

    // Create temporary conversation entry with loading state
    const tempConversation: AiConversation = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      symbol_root: symbolRoot,
      question: question.trim(),
      ai_response: '',
      model: 'anthropic/claude-sonnet-4.5',
      page_url: `${window.location.origin}/instrument/${symbolRoot}`,
      created_at: new Date(),
      updated_at: new Date(),
      loading: true
    }

    conversations.value.push(tempConversation)

    try {
      // Capture screenshot if requested
      let screenshot: string | undefined
      if (includeScreenshot) {
        screenshot = await captureInstrumentDetails() || undefined
        tempConversation.screenshot = screenshot
      }

      // Get conversation context for follow-up questions
      const context = conversations.value.length > 1 
        ? getLastConversationContext() 
        : undefined

      // Call AI service
      const aiResponse = await aiService.analyzePosition(
        question,
        screenshot,
        symbolRoot,
        context
      )

      // Remove temp conversation
      conversations.value = conversations.value.filter(c => c.id !== tempConversation.id)

      // Save to Supabase
      const savedConversation = await saveConversation({
        user_id: userId,
        symbol_root: symbolRoot,
        question: question.trim(),
        screenshot,
        ai_response: aiResponse.response,
        model: aiResponse.model,
        page_url: tempConversation.page_url,
        metadata: {
          timestamp: aiResponse.timestamp,
          has_screenshot: !!screenshot
        }
      })

      return savedConversation
    } catch (err) {
      // Remove temp conversation on error
      conversations.value = conversations.value.filter(c => c.id !== tempConversation.id)

      const message = err instanceof Error ? err.message : 'Failed to get AI response'
      error.value = message

      // Add error conversation
      conversations.value.push({
        ...tempConversation,
        id: `error-${Date.now()}`,
        loading: false,
        error: message
      })

      throw err
    } finally {
      isProcessing.value = false
    }
  }

  return {
    conversations,
    isLoading,
    isProcessing,
    isCapturing,
    error: computed(() => error.value || storageError.value),
    hasConversations,
    loadConversations,
    askQuestion,
    deleteConversation,
    clearAllConversations
  }
}