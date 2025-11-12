export interface AiConversation {
    id: string;
    user_id: string;
    symbol_root: string;
    question: string;
    screenshot?: string;
    ai_response: string;
    model: string;
    page_url?: string;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
    loading?: boolean;
    error?: string;
}
export interface ConversationInput {
    question: string;
    screenshot?: string;
    symbolRoot: string;
    userId: string;
}
export interface AiApiResponse {
    response: string;
    timestamp: string;
    model: string;
    api_payload?: {
        request_sent_to_openrouter: any;
        response_received_from_openrouter: any;
    };
}
export interface ConversationContext {
    previousQuestion: string;
    previousResponse: string;
}
