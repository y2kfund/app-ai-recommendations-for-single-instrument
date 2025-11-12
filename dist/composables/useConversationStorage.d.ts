import { AiConversation } from '../types';
export declare function useConversationStorage(userId: string, symbolRoot: string): {
    conversations: import('vue').Ref<{
        id: string;
        user_id: string;
        symbol_root: string;
        question: string;
        screenshot?: string | undefined;
        ai_response: string;
        model: string;
        page_url?: string | undefined;
        metadata?: Record<string, any> | undefined;
        created_at: Date;
        updated_at: Date;
        loading?: boolean | undefined;
        error?: string | undefined;
    }[], AiConversation[] | {
        id: string;
        user_id: string;
        symbol_root: string;
        question: string;
        screenshot?: string | undefined;
        ai_response: string;
        model: string;
        page_url?: string | undefined;
        metadata?: Record<string, any> | undefined;
        created_at: Date;
        updated_at: Date;
        loading?: boolean | undefined;
        error?: string | undefined;
    }[]>;
    isLoading: import('vue').Ref<boolean, boolean>;
    error: import('vue').Ref<string | null, string | null>;
    loadConversations: () => Promise<void>;
    saveConversation: (conversation: Omit<AiConversation, "id" | "created_at" | "updated_at">) => Promise<AiConversation>;
    deleteConversation: (conversationId: string) => Promise<void>;
    clearAllConversations: () => Promise<void>;
};
