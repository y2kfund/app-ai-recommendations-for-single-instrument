<script setup lang="ts">
import { ref, watch, shallowRef, onBeforeUnmount, nextTick, onMounted } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView, keymap, Decoration, DecorationSet, WidgetType, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { RangeSetBuilder } from '@codemirror/state'
import type { JournalEntry } from '../composables/useJournal'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { display } from 'html2canvas/dist/types/css/property-descriptors/display'

interface JournalEditorProps {
  entry: JournalEntry
  symbolRoot: string
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
const pdfInput = ref<HTMLInputElement | null>(null)
const editorContent = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isUploadingPdf = ref(false)
const isToolbarVisible = ref(false)

// Broadcast Channel for cross-tab communication
const broadcastChannel = new BroadcastChannel('journal-updates')

// Listen for updates from other tabs
onMounted(() => {
  broadcastChannel.onmessage = (event) => {
    const { entryId, title: newTitle, content: newContent, isBold: newIsBold } = event.data
    
    // Only update if it's the same entry but from another tab
    if (entryId === props.entry.id) {
      // Check if data is different to avoid infinite loops
      if (title.value !== newTitle || content.value !== newContent || isBold.value !== newIsBold) {
        title.value = newTitle
        content.value = newContent
        isBold.value = newIsBold
        
        // Force CodeMirror to update
        if (view.value) {
          nextTick(() => {
            view.value?.requestMeasure()
          })
        }
      }
    }
  }
})

// Gitea configuration
const GITEA_TOKEN = import.meta.env.VITE_GITEA_TOKEN
const GITEA_HOST = import.meta.env.VITE_GITEA_HOST
const GITEA_REPO = 'y2kfund' // Update this to match your repo name

// Image widget for CodeMirror with delete button
class ImageWidget extends WidgetType {
  constructor(readonly src: string, readonly alt: string, readonly from: number, readonly to: number, readonly view: EditorView) {
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
    wrap.style.position = 'relative'
    
    const imgContainer = document.createElement('div')
    imgContainer.style.position = 'relative'
    imgContainer.style.display = 'inline-block'
    imgContainer.style.width = '100%'
    
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
    
    // Delete button
    const deleteBtn = document.createElement('button')
    deleteBtn.innerHTML = '🗑️'
    deleteBtn.className = 'cm-image-delete-btn'
    deleteBtn.style.position = 'absolute'
    deleteBtn.style.top = '12px'
    deleteBtn.style.right = '4px'
    deleteBtn.style.padding = '6px 10px'
    deleteBtn.style.background = 'rgba(239, 68, 68, 0.95)'
    deleteBtn.style.color = '#ffffff'
    deleteBtn.style.border = 'none'
    deleteBtn.style.borderRadius = '4px'
    deleteBtn.style.cursor = 'pointer'
    deleteBtn.style.fontSize = '16px'
    deleteBtn.style.opacity = '0'
    deleteBtn.style.transition = 'opacity 0.2s ease'
    deleteBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
    deleteBtn.style.width = 'auto'
    deleteBtn.title = 'Delete image'
    
    // Show delete button on hover
    imgContainer.addEventListener('mouseenter', () => {
      deleteBtn.style.opacity = '1'
    })
    
    imgContainer.addEventListener('mouseleave', () => {
      deleteBtn.style.opacity = '0'
    })
    
    // Delete image on click
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.view.dispatch({
        changes: { from: this.from, to: this.to, insert: '' }
      })
      this.view.focus()
    })
    
    // Click image to view full size
    img.onclick = () => {
      window.open(this.src, '_blank')
    }
    
    imgContainer.appendChild(img)
    imgContainer.appendChild(deleteBtn)
    wrap.appendChild(imgContainer)
    return wrap
  }

  ignoreEvent(event: Event) {
    // Allow click events on delete button
    return event.type === 'mousedown'
  }
}

// PDF widget for CodeMirror with clickable link and delete button
class PdfWidget extends WidgetType {
  constructor(readonly fileName: string, readonly url: string, readonly from: number, readonly to: number, readonly view: EditorView) {
    super()
  }

  eq(other: PdfWidget) {
    return other.url === this.url && other.fileName === this.fileName
  }

  toDOM() {
    const wrap = document.createElement('span')
    wrap.className = 'cm-pdf-widget'
    wrap.style.display = 'inline-block'
    wrap.style.verticalAlign = 'middle'
    wrap.style.margin = '4px 0'
    
    const pdfContainer = document.createElement('div')
    pdfContainer.className = 'pdf-link-container'
    pdfContainer.style.display = 'inline-flex'
    pdfContainer.style.alignItems = 'center'
    pdfContainer.style.gap = '8px'
    pdfContainer.style.padding = '2px 5px'
    //pdfContainer.style.background = 'rgba(239, 68, 68, 0.05)'
    //pdfContainer.style.border = '1px solid rgba(239, 68, 68, 0.2)'
    //pdfContainer.style.borderRadius = '6px'
    pdfContainer.style.transition = 'all 0.2s ease'
    pdfContainer.style.position = 'relative'
    
    // PDF icon
    const icon = document.createElement('span')
    icon.textContent = '📄'
    //icon.style.fontSize = '20px'
    
    // PDF link with token parameter
    const link = document.createElement('a')
    const giteaToken = import.meta.env.VITE_GITEA_TOKEN
    const urlWithToken = `${this.url}?token=${giteaToken}`
    link.href = urlWithToken
    link.textContent = this.fileName
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    //link.style.color = '#ef4444'
    link.style.textDecoration = 'none'
    link.style.fontWeight = '500'
    link.style.fontSize = '14px'
    //link.style.maxWidth = '300px'
    //link.style.overflow = 'hidden'
    link.style.textOverflow = 'ellipsis'
    link.style.whiteSpace = 'nowrap'
    link.title = `Open ${this.fileName}`
    
    link.addEventListener('mouseenter', () => {
      link.style.textDecoration = 'underline'
    })
    
    link.addEventListener('mouseleave', () => {
      link.style.textDecoration = 'none'
    })
    
    // Delete button
    const deleteBtn = document.createElement('button')
    deleteBtn.innerHTML = '×'
    deleteBtn.className = 'cm-pdf-delete-btn'
    deleteBtn.style.marginLeft = 'auto'
    deleteBtn.style.padding = '2px 8px'
    deleteBtn.style.background = '#ef4444'
    deleteBtn.style.color = '#ffffff'
    deleteBtn.style.border = 'none'
    deleteBtn.style.borderRadius = '4px'
    deleteBtn.style.cursor = 'pointer'
    deleteBtn.style.fontSize = '18px'
    deleteBtn.style.fontWeight = 'bold'
    deleteBtn.style.lineHeight = '1'
    deleteBtn.style.opacity = '0'
    deleteBtn.style.transition = 'opacity 0.2s ease'
    deleteBtn.title = 'Delete PDF link'
    
    // Show delete button on hover
    pdfContainer.addEventListener('mouseenter', () => {
      deleteBtn.style.opacity = '1'
      //pdfContainer.style.background = 'rgba(239, 68, 68, 0.1)'
      //pdfContainer.style.borderColor = 'rgba(239, 68, 68, 0.4)'
    })
    
    pdfContainer.addEventListener('mouseleave', () => {
      deleteBtn.style.opacity = '0'
      //pdfContainer.style.background = 'rgba(239, 68, 68, 0.05)'
      //pdfContainer.style.borderColor = 'rgba(239, 68, 68, 0.2)'
    })
    
    // Delete PDF link on click
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.view.dispatch({
        changes: { from: this.from, to: this.to, insert: '' }
      })
      this.view.focus()
    })
    
    pdfContainer.appendChild(icon)
    pdfContainer.appendChild(link)
    pdfContainer.appendChild(deleteBtn)
    wrap.appendChild(pdfContainer)
    return wrap
  }

  ignoreEvent(event: Event) {
    // Allow click events on link and delete button
    return event.type === 'mousedown'
  }
}

// ViewPlugin to handle both image and PDF decorations
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
    
    // Match both image and PDF markdown patterns
    const markdownRegex = /(!?\[([^\]]*)\]\(([^)]+)\))/g
    
    const text = doc.toString()
    let match
    
    while ((match = markdownRegex.exec(text)) !== null) {
      const fullMatch = match[1]
      const isImage = fullMatch.startsWith('!')
      const label = match[2]
      const url = match[3]
      const start = match.index
      const end = start + fullMatch.length
      
      if (isImage) {
        // Image widget
        if (url.startsWith('http') || url.startsWith('data:image')) {
          const deco = Decoration.replace({
            widget: new ImageWidget(url, label, start, end, view)
          })
          builder.add(start, end, deco)
        }
      } else {
        // PDF widget - check if it's a PDF link
        if (url.includes('.pdf') || url.includes('journal-attachments')) {
          const fileName = label || url.split('/').pop() || 'PDF File'
          const deco = Decoration.replace({
            widget: new PdfWidget(fileName, url, start, end, view)
          })
          builder.add(start, end, deco)
        }
      }
    }
    
    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})

// Add this new ViewPlugin to hide heading marks
const headingMarkPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>()
    const doc = view.state.doc
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i)
      const text = line.text
      const match = text.match(/^(#{1,6})\s/)
      
      if (match) {
        const start = line.from
        const end = start + match[1].length + 1 // +1 for the space
        builder.add(start, start + match[1].length, Decoration.mark({
          class: 'cm-heading-mark'
        }))
      }
    }
    
    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})

// Custom syntax highlighting for markdown headings
const markdownHighlighting = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.5em', fontWeight: 'bold', color: '#1e293b', lineHeight: '1.3' },
  { tag: tags.heading2, fontSize: '1.3em', fontWeight: 'bold', color: '#334155', lineHeight: '1.35' },
  { tag: tags.heading3, fontSize: '1.2em', fontWeight: '600', color: '#475569', lineHeight: '1.4' },
  { tag: tags.heading4, fontSize: '1.1em', fontWeight: '600', color: '#64748b', lineHeight: '1.45' },
  { tag: tags.heading5, fontSize: '1em', fontWeight: '600', color: '#64748b', lineHeight: '1.5' },
  { tag: tags.heading6, fontSize: '0.95em', fontWeight: '600', color: '#64748b', lineHeight: '1.5' },
])

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
  headingMarkPlugin,
  syntaxHighlighting(markdownHighlighting),
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
    '.cm-heading-mark': {
      opacity: '0.3',
      fontSize: '0.8em',
      display: 'none',
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
  
  // Broadcast update to other tabs
  broadcastChannel.postMessage({
    entryId: props.entry.id,
    title: title.value,
    content: content.value,
    isBold: isBold.value
  })
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
  // Close broadcast channel
  broadcastChannel.close()
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

// Helper function to insert image into editor
const insertImage = (file: File) => {
  if (!file.type.startsWith('image/') || !view.value) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
    }
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    const altText = file.name.replace(/\.[^/.]+$/, '')
    
    if (view.value) {
      const { from } = view.value.state.selection.main
      const imageMarkdown = `![${altText}](${base64})\n\n`
      
      view.value.dispatch({
        changes: { from, insert: imageMarkdown },
        selection: { anchor: from + imageMarkdown.length }
      })
      
      nextTick(() => {
        view.value?.requestMeasure()
      })
      
      view.value.focus()
    }
  }
  
  reader.readAsDataURL(file)
}

// Image upload functionality
const triggerImageUpload = () => {
  fileInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) return
  
  insertImage(files[0])
  
  // Reset input
  target.value = ''
}

// Helper function to get unique filename
const getUniqueFileName = (originalName: string): string => {
  const timestamp = new Date().getTime()
  const lastDotIndex = originalName.lastIndexOf('.')
  
  if (lastDotIndex === -1) {
    return `${originalName}_${timestamp}`
  }
  
  const baseName = originalName.substring(0, lastDotIndex)
  const ext = originalName.substring(lastDotIndex)
  
  return `${baseName}_${timestamp}${ext}`
}

// Ensure journal-attachments folder exists
const ensureJournalAttachmentsFolder = async (): Promise<boolean> => {
  const folderPath = `journal-attachments/${props.symbolRoot}`
  //const folderPath = `journal-attachments`
  
  try {
    // Check if folder exists
    const checkResponse = await fetch(
      `${GITEA_HOST}/api/v1/repos/associateattorney/${GITEA_REPO}/contents/${folderPath}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `token ${GITEA_TOKEN}`,
          'Accept': 'application/json',
        }
      }
    )
    
    if (!checkResponse.ok) {
      // Create folder with .gitkeep
      const createResponse = await fetch(
        `${GITEA_HOST}/api/v1/repos/associateattorney/${GITEA_REPO}/contents/${folderPath}/.gitkeep`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${GITEA_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Create journal-attachments folder for ${props.symbolRoot}`,
            content: '',
            branch: 'main'
          })
        }
      )
      
      if (!createResponse.ok) {
        throw new Error('Failed to create journal-attachments folder')
      }
      
      console.log(`Created journal-attachments folder for ${props.symbolRoot}`)
    }
    
    return true
  } catch (error) {
    console.error('Error ensuring journal-attachments folder:', error)
    return false
  }
}

// Upload PDF to Gitea
const uploadPdfToGitea = async (file: File): Promise<string | null> => {
  isUploadingPdf.value = true
  
  try {
    // Ensure folder exists
    const folderCreated = await ensureJournalAttachmentsFolder()
    if (!folderCreated) {
      alert('Failed to create attachments folder')
      return null
    }
    
    // Generate unique filename
    const uniqueFileName = getUniqueFileName(file.name)
    const uploadPath = `journal-attachments/${props.symbolRoot}/${uniqueFileName}`
    
    // Convert file to base64
    const base64Content = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.readAsDataURL(file)
    })
    
    // Upload to Gitea
    const response = await fetch(
      `${GITEA_HOST}/api/v1/repos/associateattorney/${GITEA_REPO}/contents/${uploadPath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITEA_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload ${uniqueFileName} to journal-attachments/${props.symbolRoot}`,
          content: base64Content,
          branch: 'main'
        })
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to upload PDF')
    }
    
    const data = await response.json()
    return data.content.download_url
  } catch (error) {
    console.error('Error uploading PDF:', error)
    alert('Failed to upload PDF: ' + (error as Error).message)
    return null
  } finally {
    isUploadingPdf.value = false
  }
}

// Insert PDF link into editor
const insertPdfLink = (fileName: string, downloadUrl: string) => {
  if (!view.value) return
  
  const { from } = view.value.state.selection.main
  // Changed format - removed emoji, just clean markdown link
  const pdfMarkdown = `[${fileName}](${downloadUrl})\n\n`
  
  view.value.dispatch({
    changes: { from, insert: pdfMarkdown },
    selection: { anchor: from + pdfMarkdown.length }
  })
  
  // Force decoration update
  nextTick(() => {
    view.value?.requestMeasure()
  })
  
  view.value.focus()
}

// Trigger PDF upload
const triggerPdfUpload = () => {
  pdfInput.value?.click()
}

// Handle PDF upload
const handlePdfUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) return
  
  const file = files[0]
  
  // Validate file type
  if (file.type !== 'application/pdf') {
    alert('Please select a PDF file')
    target.value = ''
    return
  }
  
  // Upload to Gitea
  const downloadUrl = await uploadPdfToGitea(file)
  
  if (downloadUrl) {
    insertPdfLink(file.name, downloadUrl)
  }
  
  // Reset input
  target.value = ''
}

// Handle PDF drop
const handlePdfDrop = async (file: File) => {
  if (file.type !== 'application/pdf') return
  
  const downloadUrl = await uploadPdfToGitea(file)
  
  if (downloadUrl) {
    insertPdfLink(file.name, downloadUrl)
  }
}

// Drag and drop handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  
  // Process all dropped files
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      insertImage(file)
    } else if (file.type === 'application/pdf') {
      handlePdfDrop(file)
    }
  })
}

// Paste handler for Cmd+V / Ctrl+V
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  // Check if clipboard contains image
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      if (file) {
        insertImage(file)
      }
      break
    }
  }
}

// Insert image from URL
const insertImageUrl = () => {
  const url = prompt('Enter image URL:')
  if (!url) return
  
  const alt = prompt('Enter image description (optional):', '')
  
  if (view.value) {
    const { from } = view.value.state.selection.main
    const imageMarkdown = `![${alt || 'Image'}](${url})\n\n`
    
    view.value.dispatch({
      changes: { from, insert: imageMarkdown },
      selection: { anchor: from + imageMarkdown.length }
    })
    
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
      <button 
        @click="isToolbarVisible = !isToolbarVisible" 
        class="toolbar-toggle-btn"
        :title="isToolbarVisible ? 'Hide Toolbar' : 'Show Toolbar'"
      >
        {{ isToolbarVisible ? '▲' : '▼' }}
      </button>
      <input
        v-model="title"
        class="title-input"
        placeholder="Note title..."
        @input="handleTitleInput"
        @blur="handleBlur"
      />
    </div>
    
    <div v-show="isToolbarVisible" class="editor-toolbar">
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
      <button @click="triggerPdfUpload" class="toolbar-btn" title="Upload PDF" :disabled="isUploadingPdf">
        📄
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
    
    <input
      ref="pdfInput"
      type="file"
      accept="application/pdf"
      style="display: none"
      @change="handlePdfUpload"
    />
    
    <div 
      ref="editorContent"
      class="editor-content"
      :class="{ 'dragging': isDragging, 'uploading': isUploadingPdf }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @paste="handlePaste"
    >
      <div v-if="isDragging" class="drop-overlay">
        <div class="drop-message">
          <span class="drop-icon">🖼️ 📄</span>
          <span>Drop image or PDF here</span>
        </div>
      </div>
      <div v-if="isUploadingPdf" class="upload-overlay">
        <div class="upload-message">
          <span class="upload-icon">⏳</span>
          <span>Uploading PDF...</span>
        </div>
      </div>
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
      <span class="markdown-hint">💡 Markdown editor - Drag & drop or paste (Cmd+V) images • Upload PDFs • Click preview to open full size</span>
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
  padding-left: 8px !important;
}

.toolbar-toggle-btn {
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #475569;
  min-width: 32px;
  width: auto;
}

.toolbar-toggle-btn:hover {
  background-color: #e2e8f0;
  border-color: #94a3b8;
}

.toolbar-toggle-btn:active {
  background-color: #cbd5e1;
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
  position: relative;
}

.editor-content.dragging {
  border: 2px dashed #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.editor-content.uploading {
  pointer-events: none;
  opacity: 0.6;
}

.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.drop-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px dashed #3b82f6;
}

.drop-icon {
  font-size: 48px;
}

.drop-message span:last-child {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.upload-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px solid #3b82f6;
}

.upload-icon {
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.upload-message span:last-child {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* PDF Widget Styles */
:deep(.cm-pdf-widget) {
  display: inline-block;
  margin: 4px 0;
}

:deep(.pdf-link-container) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

:deep(.cm-pdf-delete-btn:hover) {
  background: #dc2626 !important;
  width: auto;
}
.pdf-link-container {
    line-height: 1rem;
}
</style>

<style>
.cm-gutters.cm-gutters-before {
    background-color: transparent !important;
    border: none !important;
}
.cm-gutter.cm-lineNumbers {
    display: none !important;
}
</style>