import { createClient } from '@supabase/supabase-js'
import type { AiConversation } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPA_URL
const supabaseAnonKey = import.meta.env.VITE_SUPA_ANON

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const conversationService = {
  /**
   * Fetch all conversations for a user and symbol
   */
  async fetchConversations(
    userId: string,
    symbolRoot: string
  ): Promise<AiConversation[]> {
    const { data, error } = await supabase
      .schema('hf')
      .from('ai_recommendations_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol_root', symbolRoot)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching conversations:', error)
      throw new Error(error.message)
    }

    return (data || []).map(conv => ({
      ...conv,
      created_at: new Date(conv.created_at),
      updated_at: new Date(conv.updated_at)
    }))
  },

  /**
   * Save a new conversation
   */
  async saveConversation(conversation: Omit<AiConversation, 'id' | 'created_at' | 'updated_at'>): Promise<AiConversation> {
    const { data, error } = await supabase
      .schema('hf')
      .from('ai_recommendations_conversations')
      .insert([conversation])
      .select()
      .single()

    if (error) {
      console.error('Error saving conversation:', error)
      throw new Error(error.message)
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .schema('hf')
      .from('ai_recommendations_conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Error deleting conversation:', error)
      throw new Error(error.message)
    }
  },

  /**
   * Delete all conversations for a symbol
   */
  async deleteAllConversations(userId: string, symbolRoot: string): Promise<void> {
    const { error } = await supabase
      .schema('hf')
      .from('ai_recommendations_conversations')
      .delete()
      .eq('user_id', userId)
      .eq('symbol_root', symbolRoot)

    if (error) {
      console.error('Error deleting conversations:', error)
      throw new Error(error.message)
    }
  }
}