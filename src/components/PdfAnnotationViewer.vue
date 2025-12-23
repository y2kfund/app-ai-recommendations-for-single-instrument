<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, shallowRef } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import PdfAnnotationToolbar from './PdfAnnotationToolbar.vue'
import PdfAnnotationCanvas from './PdfAnnotationCanvas.vue'
import { usePdfAnnotations, type Annotation } from '../composables/usePdfAnnotations'
import type { AnnotationTool } from './PdfAnnotationToolbar.vue'

// Use local worker file from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface Props {
  pdfUrl: string
  fileName: string
  symbolRoot: string
  entryId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const {
  annotations,
  isLoading,
  error,
  fetchAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  deleteAllAnnotations
} = usePdfAnnotations()

// PDF state - use shallowRef for PDF.js objects to prevent Vue reactivity issues
const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1)
const pageWidth = ref(0)
const pageHeight = ref(0)
const pdfCanvas = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isLoadingPdf = ref(true)
const pdfError = ref<string | null>(null)
const isRendering = ref(false)
const isPdfReady = ref(false)
const renderKey = ref(0) // Force re-render key

// Annotation state
const activeTool = ref<AnnotationTool>('select')
const activeColor = ref('#FFEB3B')
const selectedAnnotation = ref<Annotation | null>(null)
const isSaving = ref(false)
const hasUnsavedChanges = ref(false)

// Computed URL with token
const pdfUrlWithToken = computed(() => {
  const giteaToken = import.meta.env.VITE_GITEA_TOKEN
  return `${props.pdfUrl}?token=${giteaToken}`
})

onMounted(async () => {
  await loadPdf()
  await fetchAnnotations(props.pdfUrl, props.entryId)
})

onUnmounted(() => {
  if (pdfDoc.value) {
    pdfDoc.value.destroy()
    pdfDoc.value = null
  }
})

watch(currentPage, async () => {
  isPdfReady.value = false
  await renderPage()
})

watch(scale, async () => {
  await renderPage()
})

const loadPdf = async () => {
  isLoadingPdf.value = true
  pdfError.value = null
  isPdfReady.value = false

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrlWithToken.value,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    })

    const doc = await loadingTask.promise
    pdfDoc.value = doc
    totalPages.value = doc.numPages
    
    // Set loading to false first so canvas element mounts
    isLoadingPdf.value = false
    
    // Wait for canvas to be available in DOM
    await nextTick()
    
    // Small delay to ensure DOM is fully updated
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Render the first page
    await renderPage()
    
  } catch (err) {
    console.error('Error loading PDF:', err)
    pdfError.value = 'Failed to load PDF. Please try again.'
    isLoadingPdf.value = false
  }
}

const renderPage = async () => {
  const doc = pdfDoc.value
  const canvas = pdfCanvas.value
  
  if (!doc || !canvas) {
    console.log('Doc or canvas not ready', { doc: !!doc, canvas: !!canvas })
    return
  }
  
  // Wait if already rendering
  if (isRendering.value) {
    return
  }

  isRendering.value = true
  isPdfReady.value = false

  try {
    const page = await doc.getPage(currentPage.value)
    const viewport = page.getViewport({ scale: scale.value })

    // Get base dimensions (unscaled)
    const baseWidth = viewport.width / scale.value
    const baseHeight = viewport.height / scale.value
    
    // Update dimensions
    pageWidth.value = baseWidth
    pageHeight.value = baseHeight

    const context = canvas.getContext('2d')!

    // Set canvas dimensions to scaled size
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    // Also set CSS dimensions to match
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'

    // Clear canvas before rendering
    context.clearRect(0, 0, canvas.width, canvas.height)

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }

    await page.render(renderContext).promise
    
    // Increment render key to force annotation canvas update
    renderKey.value++
    
    // Wait for DOM update
    await nextTick()
    
    // Now mark as ready
    isPdfReady.value = true
    
  } catch (err) {
    console.error('Error rendering page:', err)
  } finally {
    isRendering.value = false
  }
}

const goToPage = async (page: number) => {
  const newPage = Math.max(1, Math.min(totalPages.value, page))
  if (newPage !== currentPage.value) {
    currentPage.value = newPage
  }
}

const handleAddAnnotation = async (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
  const result = await addAnnotation(props.pdfUrl, props.symbolRoot, props.entryId, annotation)
  if (result) {
    hasUnsavedChanges.value = false
  }
}

const handleUpdateAnnotation = async (id: string, updates: Partial<Annotation>) => {
  await updateAnnotation(props.pdfUrl, props.symbolRoot, props.entryId, id, updates)
  hasUnsavedChanges.value = false
}

const handleDeleteAnnotation = async (id: string) => {
  await deleteAnnotation(props.pdfUrl, props.symbolRoot, props.entryId, id)
  selectedAnnotation.value = null
}

const handleSave = async () => {
  isSaving.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  isSaving.value = false
  hasUnsavedChanges.value = false
}

const handleClearAll = async () => {
  if (confirm('Are you sure you want to clear all annotations on this PDF?')) {
    await deleteAllAnnotations(props.pdfUrl, props.symbolRoot, props.entryId)
    selectedAnnotation.value = null
  }
}

const handleClose = () => {
  if (hasUnsavedChanges.value) {
    if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
      return
    }
  }
  emit('close')
}

const handleSelectAnnotation = (annotation: Annotation | null) => {
  selectedAnnotation.value = annotation
}
</script>

<template>
  <div class="pdf-annotation-viewer">
    <PdfAnnotationToolbar
      :active-tool="activeTool"
      :active-color="activeColor"
      :current-page="currentPage"
      :total-pages="totalPages"
      :scale="scale"
      @update:active-tool="activeTool = $event"
      @update:active-color="activeColor = $event"
      @update:scale="scale = $event"
      @go-to-page="goToPage"
      @save="handleSave"
      @clear-all="handleClearAll"
      @close="handleClose"
    />

    <div class="pdf-header">
      <span class="pdf-title">📄 {{ fileName }}</span>
      <span v-if="isLoading || isSaving" class="saving-indicator">
        {{ isLoading ? 'Loading annotations...' : 'Saving...' }}
      </span>
      <span v-if="hasUnsavedChanges" class="unsaved-indicator">● Unsaved changes</span>
    </div>

    <div ref="containerRef" class="pdf-container">
      <div v-if="isLoadingPdf" class="loading-overlay">
        <div class="loading-spinner">
          <span class="spinner-icon">⏳</span>
          <span>Loading PDF...</span>
        </div>
      </div>

      <div v-else-if="pdfError" class="error-overlay">
        <div class="error-message">
          <span class="error-icon">❌</span>
          <span>{{ pdfError }}</span>
          <button @click="loadPdf" class="retry-btn">Retry</button>
        </div>
      </div>

      <div 
        v-else 
        class="pdf-page-wrapper" 
        :style="{ 
          width: (pageWidth * scale) + 'px', 
          height: (pageHeight * scale) + 'px'
        }"
      >
        <!-- PDF Canvas Layer (bottom) -->
        <canvas ref="pdfCanvas" class="pdf-canvas" />
        
        <!-- Annotation Canvas Layer (top) -->
        <PdfAnnotationCanvas
          v-if="isPdfReady && pageWidth > 0 && pageHeight > 0"
          :key="`canvas-${currentPage}-${renderKey}`"
          :width="pageWidth"
          :height="pageHeight"
          :scale="scale"
          :active-tool="activeTool"
          :active-color="activeColor"
          :annotations="annotations"
          :page-number="currentPage"
          @add-annotation="handleAddAnnotation"
          @update-annotation="handleUpdateAnnotation"
          @delete-annotation="handleDeleteAnnotation"
          @select-annotation="handleSelectAnnotation"
        />
      </div>
    </div>

    <!-- Annotation sidebar -->
    <div v-if="selectedAnnotation" class="annotation-sidebar">
      <div class="sidebar-header">
        <h3>Selected Annotation</h3>
        <button @click="selectedAnnotation = null" class="close-sidebar-btn">✕</button>
      </div>
      <div class="sidebar-content">
        <div class="annotation-info">
          <p><strong>Type:</strong> {{ selectedAnnotation.type }}</p>
          <p><strong>Page:</strong> {{ selectedAnnotation.page }}</p>
          <p v-if="selectedAnnotation.content"><strong>Content:</strong> {{ selectedAnnotation.content }}</p>
        </div>
        <button @click="handleDeleteAnnotation(selectedAnnotation.id)" class="delete-annotation-btn">
          🗑️ Delete Annotation
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-annotation-viewer {
  position: fixed;
  top: 65px;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0f172a;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.pdf-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.pdf-title {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 14px;
}

.saving-indicator {
  color: #60a5fa;
  font-size: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

.unsaved-indicator {
  color: #fbbf24;
  font-size: 12px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pdf-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  background: #334155;
}

.pdf-page-wrapper {
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  background: white;
  flex-shrink: 0;
}

.pdf-canvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.loading-overlay,
.error-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
}

.loading-spinner,
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #1e293b;
  border-radius: 12px;
  color: #e2e8f0;
}

.spinner-icon,
.error-icon {
  font-size: 48px;
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  width: auto;
}

.retry-btn:hover {
  background: #2563eb;
}

.annotation-sidebar {
  position: absolute;
  right: 0;
  top: 120px;
  width: 280px;
  background: #1e293b;
  border-left: 1px solid #334155;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.2);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #334155;
}

.sidebar-header h3 {
  margin: 0;
  color: #e2e8f0;
  font-size: 14px;
}

.close-sidebar-btn {
  padding: 4px 8px;
  background: transparent;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 16px;
  width: auto;
}

.close-sidebar-btn:hover {
  color: #e2e8f0;
}

.sidebar-content {
  padding: 16px;
}

.annotation-info {
  margin-bottom: 16px;
}

.annotation-info p {
  margin: 8px 0;
  color: #cbd5e1;
  font-size: 13px;
}

.delete-annotation-btn {
  width: 100%;
  padding: 10px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.delete-annotation-btn:hover {
  background: #dc2626;
}
</style>