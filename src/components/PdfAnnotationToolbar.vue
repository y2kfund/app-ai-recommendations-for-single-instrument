<script setup lang="ts">
import { ref } from 'vue'

export type AnnotationTool = 'select' | 'highlight' | 'underline' | 'strikethrough' | 'text' | 'drawing' | 'rectangle' | 'circle'

interface Props {
  activeTool: AnnotationTool
  activeColor: string
  currentPage: number
  totalPages: number
  scale: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:activeTool': [tool: AnnotationTool]
  'update:activeColor': [color: string]
  'update:scale': [scale: number]
  'goToPage': [page: number]
  'save': []
  'clearAll': []
  'close': []
}>()

const colors = [
  '#FFEB3B', // Yellow
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#F44336', // Red
  '#9C27B0', // Purple
  '#FF9800', // Orange
]

const tools: { id: AnnotationTool; icon: string; title: string }[] = [
  { id: 'select', icon: '👆', title: 'Select' },
  { id: 'highlight', icon: '🖍️', title: 'Highlight' },
  { id: 'underline', icon: '⎁', title: 'Underline' },
  { id: 'strikethrough', icon: '⊝', title: 'Strikethrough' },
  { id: 'text', icon: '💬', title: 'Text Note' },
  { id: 'drawing', icon: '✏️', title: 'Free Draw' },
  { id: 'rectangle', icon: '⬜', title: 'Rectangle' },
  { id: 'circle', icon: '⭕', title: 'Circle' },
]

const pageInput = ref(props.currentPage)

const goToPage = () => {
  const page = Math.max(1, Math.min(props.totalPages, pageInput.value))
  emit('goToPage', page)
}

const zoomIn = () => {
  emit('update:scale', Math.min(3, props.scale + 0.25))
}

const zoomOut = () => {
  emit('update:scale', Math.max(0.5, props.scale - 0.25))
}
</script>

<template>
  <div class="pdf-annotation-toolbar">
    <div class="toolbar-section">
      <button class="close-btn" @click="emit('close')" title="Close">
        ✕
      </button>
    </div>

    <div class="toolbar-section tools">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool-btn"
        :class="{ active: activeTool === tool.id }"
        :title="tool.title"
        @click="emit('update:activeTool', tool.id)"
      >
        {{ tool.icon }}
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section colors">
      <button
        v-for="color in colors"
        :key="color"
        class="color-btn"
        :class="{ active: activeColor === color }"
        :style="{ backgroundColor: color }"
        :title="color"
        @click="emit('update:activeColor', color)"
      />
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section navigation">
      <button class="nav-btn" @click="emit('goToPage', currentPage - 1)" :disabled="currentPage <= 1">
        ◀
      </button>
      <div class="page-info">
        <input
          v-model.number="pageInput"
          type="number"
          min="1"
          :max="totalPages"
          class="page-input"
          @keyup.enter="goToPage"
          @blur="goToPage"
        />
        <span>/ {{ totalPages }}</span>
      </div>
      <button class="nav-btn" @click="emit('goToPage', currentPage + 1)" :disabled="currentPage >= totalPages">
        ▶
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section zoom">
      <button class="zoom-btn" @click="zoomOut" title="Zoom Out">−</button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button class="zoom-btn" @click="zoomIn" title="Zoom In">+</button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section actions">
      <button class="action-btn save" @click="emit('save')" title="Save Annotations">
        💾 Save
      </button>
      <button class="action-btn clear" @click="emit('clearAll')" title="Clear All Annotations">
        🗑️ Clear
      </button>
    </div>
  </div>
</template>

<style scoped>
.pdf-annotation-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  background: #475569;
}

.close-btn {
  padding: 6px 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  width: auto;
}

.close-btn:hover {
  background: #dc2626;
}

.tool-btn {
  padding: 6px 10px;
  background: #334155;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  width: auto;
}

.tool-btn:hover {
  background: #475569;
}

.tool-btn.active {
  background: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.color-btn {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.nav-btn,
.zoom-btn {
  padding: 4px 10px;
  background: #334155;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  width: auto;
}

.nav-btn:hover:not(:disabled),
.zoom-btn:hover {
  background: #475569;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e2e8f0;
  font-size: 14px;
}

.page-input {
  width: 50px;
  padding: 4px 8px;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 4px;
  color: white;
  text-align: center;
  font-size: 14px;
}

.page-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  color: #e2e8f0;
  font-size: 14px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  width: auto;
}

.action-btn.save {
  background: #22c55e;
  color: white;
}

.action-btn.save:hover {
  background: #16a34a;
}

.action-btn.clear {
  background: #f59e0b;
  color: white;
}

.action-btn.clear:hover {
  background: #d97706;
}

@media (max-width: 768px) {
  .pdf-annotation-toolbar {
    padding: 8px;
    gap: 8px;
  }

  .toolbar-divider {
    display: none;
  }

  .action-btn {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>