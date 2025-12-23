export interface Annotation {
    id: string;
    type: 'highlight' | 'underline' | 'strikethrough' | 'text' | 'drawing' | 'rectangle' | 'circle';
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: string;
    content?: string;
    points?: {
        x: number;
        y: number;
    }[];
    createdAt: string;
    updatedAt: string;
}
export interface PdfAnnotationRecord {
    id: string;
    pdf_url: string;
    symbol_root: string;
    entry_id: string;
    annotations: Annotation[];
    created_at: string;
    updated_at: string;
}
export declare function usePdfAnnotations(): {
    annotations: import('vue').Ref<{
        id: string;
        type: "highlight" | "underline" | "strikethrough" | "text" | "drawing" | "rectangle" | "circle";
        page: number;
        x: number;
        y: number;
        width?: number | undefined;
        height?: number | undefined;
        color: string;
        content?: string | undefined;
        points?: {
            x: number;
            y: number;
        }[] | undefined;
        createdAt: string;
        updatedAt: string;
    }[], Annotation[] | {
        id: string;
        type: "highlight" | "underline" | "strikethrough" | "text" | "drawing" | "rectangle" | "circle";
        page: number;
        x: number;
        y: number;
        width?: number | undefined;
        height?: number | undefined;
        color: string;
        content?: string | undefined;
        points?: {
            x: number;
            y: number;
        }[] | undefined;
        createdAt: string;
        updatedAt: string;
    }[]>;
    isLoading: import('vue').Ref<boolean, boolean>;
    error: import('vue').Ref<string | null, string | null>;
    fetchAnnotations: (pdfUrl: string, entryId: string) => Promise<Annotation[]>;
    saveAnnotations: (pdfUrl: string, symbolRoot: string, entryId: string, newAnnotations: Annotation[]) => Promise<boolean>;
    addAnnotation: (pdfUrl: string, symbolRoot: string, entryId: string, annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt">) => Promise<Annotation | null>;
    updateAnnotation: (pdfUrl: string, symbolRoot: string, entryId: string, annotationId: string, updates: Partial<Annotation>) => Promise<boolean>;
    deleteAnnotation: (pdfUrl: string, symbolRoot: string, entryId: string, annotationId: string) => Promise<boolean>;
    deleteAllAnnotations: (pdfUrl: string, symbolRoot: string, entryId: string) => Promise<boolean>;
};
