import { AiConversation } from '../types';
export declare const supabase: import('@supabase/supabase-js').SupabaseClient<any, "public", "public", any, any>;
export declare const conversationService: {
    /**
     * Fetch all conversations for a user and symbol
     */
    fetchConversations(userId: string, symbolRoot: string): Promise<AiConversation[]>;
    /**
     * Save a new conversation
     */
    saveConversation(conversation: Omit<AiConversation, "id" | "created_at" | "updated_at">): Promise<AiConversation>;
    /**
     * Delete a conversation
     */
    deleteConversation(conversationId: string): Promise<void>;
    /**
     * Delete all conversations for a symbol
     */
    deleteAllConversations(userId: string, symbolRoot: string): Promise<void>;
};
