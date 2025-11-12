import type { AiApiResponse, ConversationContext } from '../types'

const AI_ANALYZE_ENDPOINT = import.meta.env.VITE_AI_ANALYZE_ENDPOINT || 
  'https://www.y2k.fund/api/ai-analyze'

export const aiService = {
  /**
   * Send a question with screenshot to AI for analysis
   */
  async analyzePosition(
    question: string,
    screenshot?: string,
    symbolRoot?: string,
    conversationContext?: ConversationContext
  ): Promise<AiApiResponse> {
    const response = await fetch(AI_ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        screenshot,
        timestamp: new Date().toISOString(),
        url: `${window.location.origin}/instrument/${symbolRoot || 'unknown'}`,
        context: conversationContext
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to get AI response')
    }

    const data = await response.json()
    
    if (!data.response) {
      throw new Error('Invalid response from AI service')
    }

    return data
  }
}