interface JournalProps {
    userId: string;
    symbolRoot: string;
}
declare const _default: import('vue').DefineComponent<JournalProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:selectedEntry": (entry: any) => any;
}, string, import('vue').PublicProps, Readonly<JournalProps> & Readonly<{
    "onUpdate:selectedEntry"?: ((entry: any) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
