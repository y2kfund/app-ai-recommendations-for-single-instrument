import { ref, watch } from 'vue'
import { conversationService } from '../services/supabaseService'
import type { AiConversation } from '../types'

export function useConversationStorage(userId: string, symbolRoot: string) {
  const conversations = ref<AiConversation[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load conversations from Supabase
   */
  const loadConversations = async () => {
    if (!userId || !symbolRoot) return

    isLoading.value = true
    error.value = null

    try {
      conversations.value = await conversationService.fetchConversations(userId, symbolRoot)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations'
      error.value = message
      console.error('Load conversations error:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save a new conversation
   */
  const saveConversation = async (conversation: Omit<AiConversation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const saved = await conversationService.saveConversation(conversation)
      conversations.value.push(saved)
      return saved
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save conversation'
      error.value = message
      console.error('Save conversation error:', err)
      throw err
    }
  }

  /**
   * Delete a conversation
   */
  const deleteConversation = async (conversationId: string) => {
    try {
      await conversationService.deleteConversation(conversationId)
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation'
      error.value = message
      console.error('Delete conversation error:', err)
      throw err
    }
  }

  /**
   * Clear all conversations
   */
  const clearAllConversations = async () => {
    if (!userId || !symbolRoot) return

    try {
      await conversationService.deleteAllConversations(userId, symbolRoot)
      conversations.value = []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear conversations'
      error.value = message
      console.error('Clear conversations error:', err)
      throw err
    }
  }

  return {
    conversations,
    isLoading,
    error,
    loadConversations,
    saveConversation,
    deleteConversation,
    clearAllConversations
  }
}