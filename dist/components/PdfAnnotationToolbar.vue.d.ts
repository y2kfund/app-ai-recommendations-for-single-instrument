export type AnnotationTool = 'select' | 'highlight' | 'underline' | 'strikethrough' | 'text' | 'drawing' | 'rectangle' | 'circle';
interface Props {
    activeTool: AnnotationTool;
    activeColor: string;
    currentPage: number;
    totalPages: number;
    scale: number;
}
declare const _default: import('vue').DefineComponent<Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:activeTool": (tool: AnnotationTool) => any;
    "update:activeColor": (color: string) => any;
    "update:scale": (scale: number) => any;
    goToPage: (page: number) => any;
    save: () => any;
    clearAll: () => any;
    close: () => any;
}, string, import('vue').PublicProps, Readonly<Props> & Readonly<{
    "onUpdate:activeTool"?: ((tool: AnnotationTool) => any) | undefined;
    "onUpdate:activeColor"?: ((color: string) => any) | undefined;
    "onUpdate:scale"?: ((scale: number) => any) | undefined;
    onGoToPage?: ((page: number) => any) | undefined;
    onSave?: (() => any) | undefined;
    onClearAll?: (() => any) | undefined;
    onClose?: (() => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
