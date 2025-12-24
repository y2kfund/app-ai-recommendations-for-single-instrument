import { JournalEntry } from '../composables/useJournal';
interface JournalTreeProps {
    entries: JournalEntry[];
    selectedId?: string | null;
    level?: number;
    noteId?: string | null;
}
declare const _default: import('vue').DefineComponent<JournalTreeProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    select: (id: string) => any;
    delete: (id: string) => any;
    create: (parentId: string) => any;
    toggle: (id: string) => any;
}, string, import('vue').PublicProps, Readonly<JournalTreeProps> & Readonly<{
    onSelect?: ((id: string) => any) | undefined;
    onDelete?: ((id: string) => any) | undefined;
    onCreate?: ((parentId: string) => any) | undefined;
    onToggle?: ((id: string) => any) | undefined;
}>, {
    selectedId: string | null;
    level: number;
    noteId: string | null;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
