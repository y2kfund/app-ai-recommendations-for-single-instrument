interface AiRecommendationsProps {
    symbolRoot: string;
    userId?: string | null;
    defaultTab?: 'analyst' | 'journal';
    noteId?: string | null;
}
declare const _default: import('vue').DefineComponent<AiRecommendationsProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:defaultTab": (value: "analyst" | "journal") => any;
}, string, import('vue').PublicProps, Readonly<AiRecommendationsProps> & Readonly<{
    "onUpdate:defaultTab"?: ((value: "analyst" | "journal") => any) | undefined;
}>, {
    noteId: string | null;
    symbolRoot: string;
    userId: string | null;
    defaultTab: "analyst" | "journal";
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
