export declare const supabase: import('@supabase/supabase-js').SupabaseClient<any, "public", "public", any, any>;
export interface JournalEntry {
    id: string;
    user_id: string;
    symbol_root: string;
    parent_id: string | null;
    title: string;
    content: string;
    is_bold: boolean;
    is_collapsed: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
    children?: JournalEntry[];
}
export declare function useJournal(userId: string, symbolRoot: string, noteId?: string | null): {
    entries: import('vue').Ref<{
        id: string;
        user_id: string;
        symbol_root: string;
        parent_id: string | null;
        title: string;
        content: string;
        is_bold: boolean;
        is_collapsed: boolean;
        order_index: number;
        created_at: string;
        updated_at: string;
        children?: /*elided*/ any[] | undefined;
    }[], JournalEntry[] | {
        id: string;
        user_id: string;
        symbol_root: string;
        parent_id: string | null;
        title: string;
        content: string;
        is_bold: boolean;
        is_collapsed: boolean;
        order_index: number;
        created_at: string;
        updated_at: string;
        children?: /*elided*/ any[] | undefined;
    }[]>;
    selectedEntry: import('vue').Ref<{
        id: string;
        user_id: string;
        symbol_root: string;
        parent_id: string | null;
        title: string;
        content: string;
        is_bold: boolean;
        is_collapsed: boolean;
        order_index: number;
        created_at: string;
        updated_at: string;
        children?: /*elided*/ any[] | undefined;
    } | null, JournalEntry | {
        id: string;
        user_id: string;
        symbol_root: string;
        parent_id: string | null;
        title: string;
        content: string;
        is_bold: boolean;
        is_collapsed: boolean;
        order_index: number;
        created_at: string;
        updated_at: string;
        children?: /*elided*/ any[] | undefined;
    } | null>;
    isLoading: import('vue').Ref<boolean, boolean>;
    error: import('vue').Ref<string | null, string | null>;
    loadEntries: () => Promise<void>;
    createEntry: (title: string, parentId?: string | null) => Promise<void>;
    updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    selectEntry: (id: string) => Promise<void>;
    toggleCollapse: (id: string) => Promise<void>;
};
