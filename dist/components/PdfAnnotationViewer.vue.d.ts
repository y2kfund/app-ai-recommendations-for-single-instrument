interface Props {
    pdfUrl: string;
    fileName: string;
    symbolRoot: string;
    entryId: string;
}
declare const _default: import('vue').DefineComponent<Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    close: () => any;
}, string, import('vue').PublicProps, Readonly<Props> & Readonly<{
    onClose?: (() => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    containerRef: HTMLDivElement;
    pdfCanvas: HTMLCanvasElement;
}, HTMLDivElement>;
export default _default;
