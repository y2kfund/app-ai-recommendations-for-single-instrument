import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import AiReccomendations from '../views/AiReccomendations.vue'
// Use the correct type for the routes array
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'AiReccomendations',
    component: AiReccomendations
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router