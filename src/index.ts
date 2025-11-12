// src/index.ts
import AiReccomendations from './views/AiReccomendations.vue'

// Named export
export { AiReccomendations }

// Default export (optional)
export default AiReccomendations

// Props interface
export interface aiRecommendationsProps {
  symbolRoot: string    // Root symbol of the instrument
  userId?: string | null    // Current user ID for access control
}
