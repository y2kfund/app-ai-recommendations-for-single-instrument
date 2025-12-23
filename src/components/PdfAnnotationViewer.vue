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

interface PageInfo {
  pageNumber: number
  width: number
  height: number
  canvas: HTMLCanvasElement | null
  isRendered: boolean
  isReady: boolean
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
const totalPages = ref(0)
const scale = ref(1)
const containerRef = ref<HTMLDivElement | null>(null)
const isLoadingPdf = ref(true)
const pdfError = ref<string | null>(null)
const renderKey = ref(0) // Force re-render key

// Page state for all pages
const pages = ref<PageInfo[]>([])
const pageCanvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map())

// Annotation state
const activeTool = ref<AnnotationTool>('select')
const activeColor = ref('#FFEB3B')
const selectedAnnotation = ref<Annotation | null>(null)
const isSaving = ref(false)
const hasUnsavedChanges = ref(false)

// Current visible page (for toolbar display)
const currentVisiblePage = ref(1)

// Computed URL with token
const pdfUrlWithToken = computed(() => {
  const giteaToken = import.meta.env.VITE_GITEA_TOKEN
  return `${props.pdfUrl}?token=${giteaToken}`
})

// Get annotations for a specific page
const getAnnotationsForPage = (pageNumber: number) => {
  return annotations.value.filter(a => a.page === pageNumber)
}

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

watch(scale, async () => {
  await renderAllPages()
})

const setCanvasRef = (pageNumber: number, el: HTMLCanvasElement | null) => {
  if (el) {
    pageCanvasRefs.value.set(pageNumber, el)
  } else {
    pageCanvasRefs.value.delete(pageNumber)
  }
}

const loadPdf = async () => {
  isLoadingPdf.value = true
  pdfError.value = null

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrlWithToken.value,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    })

    const doc = await loadingTask.promise
    pdfDoc.value = doc
    totalPages.value = doc.numPages
    
    // Initialize page info for all pages
    const pageInfos: PageInfo[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale: 1 })
      pageInfos.push({
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        canvas: null,
        isRendered: false,
        isReady: false
      })
    }
    pages.value = pageInfos
    
    // Set loading to false first so canvas elements mount
    isLoadingPdf.value = false
    
    // Wait for canvas elements to be available in DOM
    await nextTick()
    
    // Small delay to ensure DOM is fully updated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Render all pages
    await renderAllPages()
    
  } catch (err) {
    console.error('Error loading PDF:', err)
    pdfError.value = 'Failed to load PDF. Please try again.'
    isLoadingPdf.value = false
  }
}

const renderAllPages = async () => {
  const doc = pdfDoc.value
  if (!doc) return

  // Mark all pages as not ready during re-render
  pages.value.forEach(p => {
    p.isReady = false
  })

  // Render each page
  for (let i = 0; i < pages.value.length; i++) {
    const pageInfo = pages.value[i]
    await renderPage(pageInfo.pageNumber)
  }
  
  // Increment render key to force annotation canvas updates
  renderKey.value++
}

const renderPage = async (pageNumber: number) => {
  const doc = pdfDoc.value
  const canvas = pageCanvasRefs.value.get(pageNumber)
  
  if (!doc || !canvas) {
    console.log('Doc or canvas not ready for page', pageNumber)
    return
  }

  try {
    const page = await doc.getPage(pageNumber)
    const viewport = page.getViewport({ scale: scale.value })

    // Get base dimensions (unscaled)
    const baseWidth = viewport.width / scale.value
    const baseHeight = viewport.height / scale.value
    
    // Update page dimensions
    const pageIndex = pages.value.findIndex(p => p.pageNumber === pageNumber)
    if (pageIndex >= 0) {
      pages.value[pageIndex].width = baseWidth
      pages.value[pageIndex].height = baseHeight
    }

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
    
    // Mark page as rendered and ready
    if (pageIndex >= 0) {
      pages.value[pageIndex].isRendered = true
      pages.value[pageIndex].isReady = true
    }
    
  } catch (err) {
    console.error('Error rendering page:', pageNumber, err)
  }
}

const goToPage = async (page: number) => {
  const targetPage = Math.max(1, Math.min(totalPages.value, page))
  const pageElement = document.getElementById(`pdf-page-${targetPage}`)
  if (pageElement) {
    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Track current visible page on scroll
const handleScroll = () => {
  if (!containerRef.value) return
  
  const container = containerRef.value
  const scrollTop = container.scrollTop
  const containerHeight = container.clientHeight
  
  // Find the page that's most visible
  let mostVisiblePage = 1
  let maxVisibleArea = 0
  
  for (const pageInfo of pages.value) {
    const pageElement = document.getElementById(`pdf-page-${pageInfo.pageNumber}`)
    if (!pageElement) continue
    
    const rect = pageElement.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    
    // Calculate visible area of this page
    const visibleTop = Math.max(rect.top, containerRect.top)
    const visibleBottom = Math.min(rect.bottom, containerRect.bottom)
    const visibleArea = Math.max(0, visibleBottom - visibleTop)
    
    if (visibleArea > maxVisibleArea) {
      maxVisibleArea = visibleArea
      mostVisiblePage = pageInfo.pageNumber
    }
  }
  
  currentVisiblePage.value = mostVisiblePage
}

const handleAddAnnotation = async (pageNumber: number, annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
  const result = await addAnnotation(props.pdfUrl, props.symbolRoot, props.entryId, {
    ...annotation,
    page: pageNumber
  })
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
      :current-page="currentVisiblePage"
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

    <div ref="containerRef" class="pdf-container" @scroll="handleScroll">
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

      <div v-else class="pdf-pages-container">
        <!-- Render all pages -->
        <div
          v-for="pageInfo in pages"
          :key="pageInfo.pageNumber"
          :id="`pdf-page-${pageInfo.pageNumber}`"
          class="pdf-page-wrapper"
          :style="{ 
            width: (pageInfo.width * scale) + 'px', 
            height: (pageInfo.height * scale) + 'px'
          }"
        >
          <!-- Page number indicator -->
          <div class="page-number-badge">{{ pageInfo.pageNumber }}</div>
          
          <!-- PDF Canvas Layer (bottom) -->
          <canvas 
            :ref="(el) => setCanvasRef(pageInfo.pageNumber, el as HTMLCanvasElement)" 
            class="pdf-canvas" 
          />
          
          <!-- Annotation Canvas Layer (top) -->
          <PdfAnnotationCanvas
            v-if="pageInfo.isReady && pageInfo.width > 0 && pageInfo.height > 0"
            :key="`canvas-${pageInfo.pageNumber}-${renderKey}`"
            :width="pageInfo.width"
            :height="pageInfo.height"
            :scale="scale"
            :active-tool="activeTool"
            :active-color="activeColor"
            :annotations="getAnnotationsForPage(pageInfo.pageNumber)"
            :page-number="pageInfo.pageNumber"
            @add-annotation="(annotation) => handleAddAnnotation(pageInfo.pageNumber, annotation)"
            @update-annotation="handleUpdateAnnotation"
            @delete-annotation="handleDeleteAnnotation"
            @select-annotation="handleSelectAnnotation"
          />
        </div>
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
  padding: 20px;
  background: #334155;
}

.pdf-pages-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding-bottom: 40px;
}

.pdf-page-wrapper {
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  background: white;
  flex-shrink: 0;
}

.page-number-badge {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #94a3b8;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  z-index: 10;
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