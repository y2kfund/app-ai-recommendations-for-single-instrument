<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
//import { useAiRecommendationsQuery } from '@y2kfund/core/ReccomendationsForSingleInstrument'

interface aiRecommendationsProps {
  symbolRoot: string
  userId?: string | null
}

const props = withDefaults(defineProps<aiRecommendationsProps>(), {
  //symbolRoot: 'META',
  //userId: '67e578fd-2cf7-48a4-b028-a11a3f89bb9b'
  userId: null,
  symbolRoot: ''
})

</script>

<template>
  <div class="ai-recommendations-for-single-instrument-view">
    <h2>AI Recommendations for {{ props.symbolRoot }}</h2>
    
    jaikalima
  </div>
</template>

<style>
@import '../styles/styles.css';
</style>

<style scoped>
@import '../styles/scoped-styles.css';
</style>