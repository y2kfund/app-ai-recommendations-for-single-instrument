import { JournalEntry } from '../composables/useJournal';
interface JournalEditorProps {
    entry: JournalEntry;
}
declare const _default: import('vue').DefineComponent<JournalEditorProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    update: (id: string, title: string, content: string, isBold: boolean) => any;
}, string, import('vue').PublicProps, Readonly<JournalEditorProps> & Readonly<{
    onUpdate?: ((id: string, title: string, content: string, isBold: boolean) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    textareaRef: HTMLTextAreaElement;
}, HTMLDivElement>;
export default _default;
