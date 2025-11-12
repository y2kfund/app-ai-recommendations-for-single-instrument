import { AiApiResponse, ConversationContext } from '../types';
export declare const aiService: {
    /**
     * Send a question with screenshot to AI for analysis
     */
    analyzePosition(question: string, screenshot?: string, symbolRoot?: string, conversationContext?: ConversationContext): Promise<AiApiResponse>;
};
