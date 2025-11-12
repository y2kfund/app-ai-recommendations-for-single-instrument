import { AiConversation } from '../types';
interface Props {
    conversations: AiConversation[];
    isLoading?: boolean;
}
declare const _default: import('vue').DefineComponent<Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {} & {
    delete: (id: string) => any;
    "clear-all": () => any;
}, string, import('vue').PublicProps, Readonly<Props> & Readonly<{
    onDelete?: ((id: string) => any) | undefined;
    "onClear-all"?: (() => any) | undefined;
}>, {
    isLoading: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    timelineRef: HTMLDivElement;
}, HTMLDivElement>;
export default _default;
