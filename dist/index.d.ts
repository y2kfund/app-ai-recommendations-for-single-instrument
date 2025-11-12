import { default as AiReccomendations } from './views/AiReccomendations.vue';
export { AiReccomendations };
export default AiReccomendations;
export interface aiRecommendationsProps {
    symbolRoot: string;
    userId?: string | null;
}
