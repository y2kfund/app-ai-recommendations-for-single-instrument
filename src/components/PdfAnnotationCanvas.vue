<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { Annotation } from '../composables/usePdfAnnotations'
import type { AnnotationTool } from './PdfAnnotationToolbar.vue'

interface Props {
  width: number
  height: number
  scale: number
  activeTool: AnnotationTool
  activeColor: string
  annotations: Annotation[]
  pageNumber: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-annotation': [annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>]
  'update-annotation': [id: string, updates: Partial<Annotation>]
  'delete-annotation': [id: string]
  'select-annotation': [annotation: Annotation | null]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const isDrawing = ref(false)
const startPoint = ref<{ x: number; y: number } | null>(null)
const currentPoints = ref<{ x: number; y: number }[]>([])
const selectedAnnotation = ref<Annotation | null>(null)
const textInputPos = ref<{ x: number; y: number } | null>(null)
const textInputValue = ref('')

const pageAnnotations = computed(() =>
  props.annotations.filter(ann => ann.page === props.pageNumber)
)

const scaledWidth = computed(() => props.width * props.scale)
const scaledHeight = computed(() => props.height * props.scale)

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
    redraw()
  }
})

watch([() => props.annotations, () => props.scale, () => props.pageNumber], () => {
  nextTick(() => redraw())
})

const redraw = () => {
  if (!ctx.value || !canvas.value) return

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

  pageAnnotations.value.forEach(annotation => {
    drawAnnotation(annotation)
  })
}

const drawAnnotation = (annotation: Annotation) => {
  if (!ctx.value) return

  const scale = props.scale
  ctx.value.save()

  switch (annotation.type) {
    case 'highlight':
      ctx.value.fillStyle = annotation.color + '80' // 50% opacity
      ctx.value.fillRect(
        annotation.x * scale,
        annotation.y * scale,
        (annotation.width || 100) * scale,
        (annotation.height || 20) * scale
      )
      break

    case 'underline':
      ctx.value.strokeStyle = annotation.color
      ctx.value.lineWidth = 2 * scale
      ctx.value.beginPath()
      ctx.value.moveTo(annotation.x * scale, (annotation.y + (annotation.height || 20)) * scale)
      ctx.value.lineTo((annotation.x + (annotation.width || 100)) * scale, (annotation.y + (annotation.height || 20)) * scale)
      ctx.value.stroke()
      break

    case 'strikethrough':
      ctx.value.strokeStyle = annotation.color
      ctx.value.lineWidth = 2 * scale
      ctx.value.beginPath()
      const midY = (annotation.y + (annotation.height || 20) / 2) * scale
      ctx.value.moveTo(annotation.x * scale, midY)
      ctx.value.lineTo((annotation.x + (annotation.width || 100)) * scale, midY)
      ctx.value.stroke()
      break

    case 'text':
      // Draw text bubble
      ctx.value.fillStyle = annotation.color + 'CC'
      const padding = 8 * scale
      const textWidth = Math.max(100, (annotation.content?.length || 10) * 8) * scale
      const textHeight = 30 * scale
      
      ctx.value.beginPath()
      ctx.value.roundRect(annotation.x * scale, annotation.y * scale, textWidth + padding * 2, textHeight, 6 * scale)
      ctx.value.fill()
      
      ctx.value.fillStyle = '#000000'
      ctx.value.font = `${14 * scale}px sans-serif`
      ctx.value.fillText(annotation.content || '', (annotation.x + 8) * scale, (annotation.y + 20) * scale)
      break

    case 'drawing':
      if (annotation.points && annotation.points.length > 1) {
        ctx.value.strokeStyle = annotation.color
        ctx.value.lineWidth = 2 * scale
        ctx.value.lineCap = 'round'
        ctx.value.lineJoin = 'round'
        ctx.value.beginPath()
        ctx.value.moveTo(annotation.points[0].x * scale, annotation.points[0].y * scale)
        annotation.points.forEach(point => {
          ctx.value!.lineTo(point.x * scale, point.y * scale)
        })
        ctx.value.stroke()
      }
      break

    case 'rectangle':
      ctx.value.strokeStyle = annotation.color
      ctx.value.lineWidth = 2 * scale
      ctx.value.strokeRect(
        annotation.x * scale,
        annotation.y * scale,
        (annotation.width || 100) * scale,
        (annotation.height || 100) * scale
      )
      break

    case 'circle':
      ctx.value.strokeStyle = annotation.color
      ctx.value.lineWidth = 2 * scale
      ctx.value.beginPath()
      const radiusX = ((annotation.width || 100) / 2) * scale
      const radiusY = ((annotation.height || 100) / 2) * scale
      ctx.value.ellipse(
        (annotation.x + (annotation.width || 100) / 2) * scale,
        (annotation.y + (annotation.height || 100) / 2) * scale,
        radiusX,
        radiusY,
        0, 0, 2 * Math.PI
      )
      ctx.value.stroke()
      break
  }

  // Draw selection indicator
  if (selectedAnnotation.value?.id === annotation.id) {
    ctx.value.strokeStyle = '#3b82f6'
    ctx.value.lineWidth = 2
    ctx.value.setLineDash([5, 5])
    ctx.value.strokeRect(
      annotation.x * scale - 4,
      annotation.y * scale - 4,
      ((annotation.width || 100) + 8) * scale,
      ((annotation.height || 30) + 8) * scale
    )
    ctx.value.setLineDash([])
  }

  ctx.value.restore()
}

const getMousePos = (e: MouseEvent): { x: number; y: number } => {
  const rect = canvas.value!.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / props.scale,
    y: (e.clientY - rect.top) / props.scale
  }
}

const handleMouseDown = (e: MouseEvent) => {
  const pos = getMousePos(e)

  if (props.activeTool === 'select') {
    // Check if clicking on an existing annotation
    const clicked = findAnnotationAt(pos.x, pos.y)
    selectedAnnotation.value = clicked
    emit('select-annotation', clicked)
    return
  }

  if (props.activeTool === 'text') {
    textInputPos.value = pos
    textInputValue.value = ''
    return
  }

  isDrawing.value = true
  startPoint.value = pos
  currentPoints.value = [pos]
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value || !startPoint.value) return

  const pos = getMousePos(e)

  if (props.activeTool === 'drawing') {
    currentPoints.value.push(pos)
    redraw()
    // Draw current path
    if (ctx.value && currentPoints.value.length > 1) {
      ctx.value.strokeStyle = props.activeColor
      ctx.value.lineWidth = 2 * props.scale
      ctx.value.lineCap = 'round'
      ctx.value.lineJoin = 'round'
      ctx.value.beginPath()
      ctx.value.moveTo(currentPoints.value[0].x * props.scale, currentPoints.value[0].y * props.scale)
      currentPoints.value.forEach(point => {
        ctx.value!.lineTo(point.x * props.scale, point.y * props.scale)
      })
      ctx.value.stroke()
    }
  } else {
    redraw()
    // Draw preview
    drawPreview(startPoint.value, pos)
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (!isDrawing.value || !startPoint.value) return

  const pos = getMousePos(e)
  isDrawing.value = false

  const annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
    type: props.activeTool as Annotation['type'],
    page: props.pageNumber,
    x: Math.min(startPoint.value.x, pos.x),
    y: Math.min(startPoint.value.y, pos.y),
    width: Math.abs(pos.x - startPoint.value.x),
    height: Math.abs(pos.y - startPoint.value.y),
    color: props.activeColor
  }

  if (props.activeTool === 'drawing') {
    annotation.points = [...currentPoints.value]
    annotation.x = Math.min(...currentPoints.value.map(p => p.x))
    annotation.y = Math.min(...currentPoints.value.map(p => p.y))
  }

  // Ensure minimum size
  if (annotation.width! < 5 && annotation.height! < 5 && props.activeTool !== 'drawing') {
    startPoint.value = null
    currentPoints.value = []
    redraw()
    return
  }

  emit('add-annotation', annotation)
  startPoint.value = null
  currentPoints.value = []
}

const drawPreview = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  if (!ctx.value) return

  const scale = props.scale
  const x = Math.min(start.x, end.x) * scale
  const y = Math.min(start.y, end.y) * scale
  const width = Math.abs(end.x - start.x) * scale
  const height = Math.abs(end.y - start.y) * scale

  ctx.value.save()
  ctx.value.strokeStyle = props.activeColor
  ctx.value.lineWidth = 2 * scale
  ctx.value.setLineDash([5, 5])

  switch (props.activeTool) {
    case 'highlight':
      ctx.value.fillStyle = props.activeColor + '40'
      ctx.value.fillRect(x, y, width, height)
      break
    case 'underline':
      ctx.value.beginPath()
      ctx.value.moveTo(x, y + height)
      ctx.value.lineTo(x + width, y + height)
      ctx.value.stroke()
      break
    case 'strikethrough':
      ctx.value.beginPath()
      ctx.value.moveTo(x, y + height / 2)
      ctx.value.lineTo(x + width, y + height / 2)
      ctx.value.stroke()
      break
    case 'rectangle':
      ctx.value.strokeRect(x, y, width, height)
      break
    case 'circle':
      ctx.value.beginPath()
      ctx.value.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI)
      ctx.value.stroke()
      break
  }

  ctx.value.restore()
}

const findAnnotationAt = (x: number, y: number): Annotation | null => {
  for (const annotation of pageAnnotations.value) {
    const ax = annotation.x
    const ay = annotation.y
    const aw = annotation.width || 100
    const ah = annotation.height || 30

    if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) {
      return annotation
    }
  }
  return null
}

const handleTextSubmit = () => {
  if (!textInputPos.value || !textInputValue.value.trim()) {
    textInputPos.value = null
    return
  }

  const annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
    type: 'text',
    page: props.pageNumber,
    x: textInputPos.value.x,
    y: textInputPos.value.y,
    color: props.activeColor,
    content: textInputValue.value.trim()
  }

  emit('add-annotation', annotation)
  textInputPos.value = null
  textInputValue.value = ''
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedAnnotation.value) {
      emit('delete-annotation', selectedAnnotation.value.id)
      selectedAnnotation.value = null
    }
  }
  if (e.key === 'Escape') {
    textInputPos.value = null
    selectedAnnotation.value = null
  }
}
</script>

<template>
  <div class="annotation-canvas-container" @keydown="handleKeyDown" tabindex="0">
    <canvas
      ref="canvas"
      :width="scaledWidth"
      :height="scaledHeight"
      class="annotation-canvas"
      :class="{ 'cursor-crosshair': activeTool !== 'select', 'cursor-pointer': activeTool === 'select' }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    />
    
    <!-- Text input popup -->
    <div
      v-if="textInputPos"
      class="text-input-popup"
      :style="{
        left: textInputPos.x * scale + 'px',
        top: textInputPos.y * scale + 'px'
      }"
    >
      <input
        v-model="textInputValue"
        type="text"
        class="text-input"
        placeholder="Enter note..."
        autofocus
        @keyup.enter="handleTextSubmit"
        @keyup.escape="textInputPos = null"
        @blur="handleTextSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.annotation-canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  outline: none;
}

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
}

.cursor-crosshair {
  cursor: crosshair;
}

.cursor-pointer {
  cursor: pointer;
}

.text-input-popup {
  position: absolute;
  z-index: 100;
}

.text-input {
  padding: 8px 12px;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.text-input:focus {
  outline: none;
  border-color: #2563eb;
}
</style>