<script setup lang="ts">
import { ref, watch, shallowRef, onBeforeUnmount, nextTick } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView, keymap, Decoration, DecorationSet, WidgetType, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { RangeSetBuilder } from '@codemirror/state'
import type { JournalEntry } from '../composables/useJournal'

interface JournalEditorProps {
  entry: JournalEntry
}

const props = defineProps<JournalEditorProps>()

const emit = defineEmits<{
  update: [id: string, title: string, content: string, isBold: boolean]
}>()

const title = ref(props.entry.title)
const content = ref(props.entry.content)
const isBold = ref(props.entry.is_bold)
const view = shallowRef<EditorView>()
let updateTimeout: NodeJS.Timeout | null = null
const fileInput = ref<HTMLInputElement | null>(null)

// Image widget for CodeMirror
class ImageWidget extends WidgetType {
  constructor(readonly src: string, readonly alt: string) {
    super()
  }

  eq(other: ImageWidget) {
    return other.src === this.src && other.alt === this.alt
  }

  toDOM() {
    const wrap = document.createElement('span')
    wrap.className = 'cm-image-widget'
    wrap.style.display = 'inline-block'
    wrap.style.verticalAlign = 'top'
    wrap.style.width = '100%'
    
    const img = document.createElement('img')
    img.src = this.src
    img.alt = this.alt
    img.style.maxWidth = '100%'
    img.style.maxHeight = '400px'
    img.style.display = 'block'
    img.style.margin = '8px 0'
    img.style.borderRadius = '4px'
    img.style.cursor = 'pointer'
    img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
    img.style.border = '1px solid #e2e8f0'
    
    // Click to view full size
    img.onclick = () => {
      window.open(this.src, '_blank')
    }
    
    wrap.appendChild(img)
    return wrap
  }

  ignoreEvent() {
    return false
  }
}

// ViewPlugin to handle image decorations
const imagePlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>()
    const doc = view.state.doc
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    
    // Scan entire document, not just visible ranges
    const text = doc.toString()
    let match
    
    while ((match = imageRegex.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length
      const alt = match[1]
      const src = match[2]
      
      // Only show widget if it's a valid image URL or base64
      if (src.startsWith('http') || src.startsWith('data:image')) {
        const deco = Decoration.replace({
          widget: new ImageWidget(src, alt)
        })
        builder.add(start, end, deco)
      }
    }
    
    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})

// CodeMirror extensions
const extensions = [
  markdown(),
  history(),
  keymap.of([
    ...defaultKeymap,
    ...historyKeymap,
  ]),
  EditorView.lineWrapping,
  imagePlugin,
  EditorView.theme({
    '&': {
      fontSize: '15px',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.8',
    },
    '.cm-content': {
      padding: '12px 4px',
    },
    '.cm-line': {
      padding: '0 4px',
    },
    '.cm-image-widget': {
      display: 'inline-block',
      width: '100%',
      padding: '4px 0',
    },
  }),
]

watch(() => props.entry, (newEntry) => {
  if (newEntry.id !== props.entry.id) {
    title.value = newEntry.title
    content.value = newEntry.content
    isBold.value = newEntry.is_bold
  }
})

const handleReady = (payload: { view: EditorView }) => {
  view.value = payload.view
  // Force initial decoration update
  nextTick(() => {
    if (view.value) {
      view.value.requestMeasure()
    }
  })
}

const emitUpdate = () => {
  emit('update', props.entry.id, title.value, content.value, isBold.value)
}

const handleContentChange = (value: string) => {
  content.value = value
  
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  updateTimeout = setTimeout(() => {
    emitUpdate()
  }, 500)
}

const handleTitleInput = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  updateTimeout = setTimeout(() => {
    emitUpdate()
  }, 500)
}

const handleBlur = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
    updateTimeout = null
  }
  emitUpdate()
}

onBeforeUnmount(() => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
})

// Helper methods for toolbar actions
const insertMarkdown = (before: string, after: string = '') => {
  if (!view.value) return
  
  const { from, to } = view.value.state.selection.main
  const selectedText = view.value.state.doc.sliceString(from, to)
  const newText = `${before}${selectedText}${after}`
  
  view.value.dispatch({
    changes: { from, to, insert: newText },
    selection: { anchor: from + before.length, head: from + before.length + selectedText.length }
  })
  
  view.value.focus()
}

const insertBold = () => insertMarkdown('**', '**')
const insertItalic = () => insertMarkdown('*', '*')
const insertHeading = () => insertMarkdown('## ')
const insertLink = () => insertMarkdown('[', '](url)')
const insertCode = () => insertMarkdown('`', '`')
const insertCodeBlock = () => insertMarkdown('```\n', '\n```')
const insertList = () => insertMarkdown('- ')
const insertOrderedList = () => insertMarkdown('1. ')
const insertQuote = () => insertMarkdown('> ')
const insertTaskList = () => insertMarkdown('- [ ] ')

// Image upload functionality
const triggerImageUpload = () => {
  fileInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0 || !view.value) return
  
  const file = files[0]
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }
  
  // Convert to base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    const altText = file.name.replace(/\.[^/.]+$/, '')
    
    // Insert markdown image syntax
    if (view.value) {
      const { from } = view.value.state.selection.main
      const imageMarkdown = `![${altText}](${base64})\n\n`
      
      view.value.dispatch({
        changes: { from, insert: imageMarkdown },
        selection: { anchor: from + imageMarkdown.length }
      })
      
      // Force view update to rebuild decorations
      nextTick(() => {
        view.value?.requestMeasure()
      })
      
      view.value.focus()
    }
  }
  
  reader.readAsDataURL(file)
  
  // Reset input
  target.value = ''
}

const insertImageUrl = () => {
  const url = prompt('Enter image URL:')
  if (url && view.value) {
    const { from } = view.value.state.selection.main
    const imageMarkdown = `![Image](${url})\n\n`
    
    view.value.dispatch({
      changes: { from, insert: imageMarkdown },
      selection: { anchor: from + imageMarkdown.length }
    })
    
    // Force view update to rebuild decorations
    nextTick(() => {
      view.value?.requestMeasure()
    })
    
    view.value.focus()
  }
}
</script>

<template>
  <div class="journal-editor">
    <div class="editor-header">
      <input
        v-model="title"
        class="title-input"
        placeholder="Note title..."
        @input="handleTitleInput"
        @blur="handleBlur"
      />
    </div>
    
    <div class="editor-toolbar">
      <button @click="insertBold" class="toolbar-btn" title="Bold">
        <strong>B</strong>
      </button>
      <button @click="insertItalic" class="toolbar-btn" title="Italic">
        <em>I</em>
      </button>
      <button @click="insertHeading" class="toolbar-btn" title="Heading">
        H
      </button>
      <div class="toolbar-divider"></div>
      <button @click="insertLink" class="toolbar-btn" title="Link">
        🔗
      </button>
      <button @click="triggerImageUpload" class="toolbar-btn" title="Upload Image">
        🖼️
      </button>
      <button @click="insertImageUrl" class="toolbar-btn" title="Insert Image URL">
        🌐
      </button>
      <button @click="insertCode" class="toolbar-btn" title="Inline Code">
        &lt;/&gt;
      </button>
      <button @click="insertCodeBlock" class="toolbar-btn" title="Code Block">
        { }
      </button>
      <div class="toolbar-divider"></div>
      <button @click="insertList" class="toolbar-btn" title="Bullet List">
        •
      </button>
      <button @click="insertOrderedList" class="toolbar-btn" title="Numbered List">
        1.
      </button>
      <button @click="insertTaskList" class="toolbar-btn" title="Task List">
        ☑
      </button>
      <button @click="insertQuote" class="toolbar-btn" title="Quote">
        "
      </button>
    </div>
    
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageUpload"
    />
    
    <div class="editor-content">
      <Codemirror
        v-model="content"
        :extensions="extensions"
        :style="{ height: '100%' }"
        placeholder="Start writing your journal entry..."
        @ready="handleReady"
        @change="handleContentChange"
      />
    </div>
    
    <div class="editor-footer">
      <span class="markdown-hint">💡 Markdown editor - Images show as previews, click to open full size</span>
      <span class="updated-at">{{ new Date(entry.updated_at).toLocaleString() }}</span>
    </div>
  </div>
</template>

<style scoped>
.journal-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
}

.title-input {
  flex: 1;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.title-input::placeholder {
  color: #94a3b8;
}

.title-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 2px 5px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #475569;
  width: auto;
}

.toolbar-btn:hover {
  background-color: #e2e8f0;
  border-color: #94a3b8;
}

.toolbar-btn:active {
  background-color: #cbd5e1;
}

.toolbar-divider {
  width: 1px;
  background: #cbd5e1;
  margin: 0 4px;
}

.editor-content {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8f9fa;
  flex-wrap: wrap;
  gap: 8px;
}

.markdown-hint {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.updated-at {
  font-size: 11px;
  color: #64748b;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    padding: 10px 12px;
  }

  .toolbar-btn {
    padding: 4px 8px;
    font-size: 13px;
  }
}

/* CodeMirror styling */
:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-focused) {
  outline: none;
}

:deep(.cm-selectionBackground) {
  background-color: rgba(59, 130, 246, 0.2) !important;
}
</style>