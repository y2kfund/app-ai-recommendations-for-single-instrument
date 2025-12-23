import { Annotation } from '../composables/usePdfAnnotations';
import { AnnotationTool } from './PdfAnnotationToolbar.vue';
interface Props {
    width: number;
    height: number;
    scale: number;
    activeTool: AnnotationTool;
    activeColor: string;
    annotations: Annotation[];
    pageNumber: number;
}
declare const _default: import('vue').DefineComponent<Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "add-annotation": (annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt">) => any;
    "update-annotation": (id: string, updates: Partial<Annotation>) => any;
    "delete-annotation": (id: string) => any;
    "select-annotation": (annotation: Annotation | null) => any;
}, string, import('vue').PublicProps, Readonly<Props> & Readonly<{
    "onAdd-annotation"?: ((annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt">) => any) | undefined;
    "onUpdate-annotation"?: ((id: string, updates: Partial<Annotation>) => any) | undefined;
    "onDelete-annotation"?: ((id: string) => any) | undefined;
    "onSelect-annotation"?: ((annotation: Annotation | null) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    canvas: HTMLCanvasElement;
}, HTMLDivElement>;
export default _default;
