import { AiConversation } from '../types';
interface Props {
    conversation: AiConversation;
}
declare const _default: import('vue').DefineComponent<Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {} & {
    "show-screenshot": (screenshot: string) => any;
    delete: (id: string) => any;
}, string, import('vue').PublicProps, Readonly<Props> & Readonly<{
    "onShow-screenshot"?: ((screenshot: string) => any) | undefined;
    onDelete?: ((id: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
