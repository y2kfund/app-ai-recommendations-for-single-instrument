export declare function useScreenshot(): {
    isCapturing: import('vue').Ref<boolean, boolean>;
    error: import('vue').Ref<string | null, string | null>;
    captureElement: (elementId: string) => Promise<string | null>;
    captureInstrumentDetails: () => Promise<string | null>;
};
