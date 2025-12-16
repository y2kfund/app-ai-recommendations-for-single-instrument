<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { marked } from 'marked'
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
const isPreviewMode = ref(false)

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  try {
    return marked(content.value || '')
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return content.value
  }
})

watch(() => props.entry, (newEntry) => {
  title.value = newEntry.title
  content.value = newEntry.content
  isBold.value = newEntry.is_bold
}, { immediate: true })

const handleSave = () => {
  emit('update', props.entry.id, title.value, content.value, isBold.value)
}

const handleBlur = () => {
  if (title.value !== props.entry.title || content.value !== props.entry.content || isBold.value !== props.entry.is_bold) {
    handleSave()
  }
}

const togglePreview = () => {
  isPreviewMode.value = !isPreviewMode.value
}

const insertMarkdown = (syntax: string) => {
  const textarea = document.querySelector('.content-textarea') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  let newText = ''
  let cursorOffset = 0

  switch (syntax) {
    case 'bold':
      newText = `**${selectedText || 'bold text'}**`
      cursorOffset = selectedText ? newText.length : 2
      break
    case 'italic':
      newText = `*${selectedText || 'italic text'}*`
      cursorOffset = selectedText ? newText.length : 1
      break
    case 'heading':
      newText = `## ${selectedText || 'Heading'}`
      cursorOffset = selectedText ? newText.length : 3
      break
    case 'link':
      newText = `[${selectedText || 'link text'}](url)`
      cursorOffset = selectedText ? newText.length - 4 : 1
      break
    case 'code':
      newText = `\`${selectedText || 'code'}\``
      cursorOffset = selectedText ? newText.length : 1
      break
    case 'list':
      newText = `- ${selectedText || 'list item'}`
      cursorOffset = newText.length
      break
  }

  content.value = content.value.substring(0, start) + newText + content.value.substring(end)
  
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + cursorOffset, start + cursorOffset)
  }, 0)
}
</script>

<template>
  <div class="journal-editor">
    <div class="editor-header">
      <input
        v-model="title"
        class="title-input"
        placeholder="Note title..."
        @blur="handleBlur"
      />
      <div class="editor-toolbar">
        <button
          class="toolbar-btn"
          @click="insertMarkdown('bold')"
          title="Bold (Ctrl+B)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          @click="insertMarkdown('italic')"
          title="Italic (Ctrl+I)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="4" x2="10" y2="4"/>
            <line x1="14" y1="20" x2="5" y2="20"/>
            <line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          @click="insertMarkdown('heading')"
          title="Heading"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12h8m-8-6v12m8-12v12m-4-6h8"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          @click="insertMarkdown('link')"
          title="Link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          @click="insertMarkdown('code')"
          title="Code"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          @click="insertMarkdown('list')"
          title="List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
        <div class="toolbar-divider"></div>
        <button
          :class="['toolbar-btn', { active: isPreviewMode }]"
          @click="togglePreview"
          title="Toggle Preview"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="!isPreviewMode" class="editor-content">
      <textarea
        v-model="content"
        class="content-textarea"
        placeholder="Write your notes here... (Markdown supported)"
        @blur="handleBlur"
      ></textarea>
    </div>

    <div v-else class="preview-content">
      <div class="markdown-body" v-html="renderedContent"></div>
    </div>
    
    <div class="editor-footer">
      <span class="markdown-hint">💡 Markdown supported</span>
      <span class="updated-at">Last updated: {{ new Date(entry.updated_at).toLocaleString() }}</span>
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
  gap: 12px;
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
  flex-wrap: wrap;
}

.title-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
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
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #cbd5e1;
  margin: 0 4px;
}

.toolbar-btn {
  padding: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
}

.toolbar-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #334155;
}

.toolbar-btn.active {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #3b82f6;
}

.editor-content,
.preview-content {
  flex: 1;
  overflow-y: auto;
}

.content-textarea {
  width: calc(100% - 30px);
  height: calc(100% - 34px);
  padding: 15px;
  background: #ffffff;
  border: none;
  color: #334155;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.content-textarea::placeholder {
  color: #94a3b8;
}

.content-textarea:focus {
  outline: none;
}

.preview-content {
  padding: 20px;
  background: #ffffff;
}

.markdown-body {
  color: #334155;
  font-size: 14px;
  line-height: 1.7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 24px 0 16px 0;
  font-weight: 600;
  line-height: 1.25;
  color: #1e293b;
}

.markdown-body :deep(h1) { font-size: 2em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
.markdown-body :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
.markdown-body :deep(h3) { font-size: 1.25em; }
.markdown-body :deep(h4) { font-size: 1em; }
.markdown-body :deep(h5) { font-size: 0.875em; }
.markdown-body :deep(h6) { font-size: 0.85em; color: #64748b; }

.markdown-body :deep(p) {
  margin: 0 0 16px 0;
}

.markdown-body :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #e11d48;
}

.markdown-body :deep(pre) {
  background: #1e293b;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-body :deep(pre code) {
  background: transparent;
  color: #e2e8f0;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #cbd5e1;
  padding-left: 16px;
  margin: 16px 0;
  color: #64748b;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 16px 0;
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}

.markdown-body :deep(em) {
  font-style: italic;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 24px 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(table th) {
  background: #f8f9fa;
  font-weight: 600;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
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
  font-size: 12px;
  color: #64748b;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    padding: 12px;
    gap: 8px;
  }

  .title-input {
    font-size: 14px;
    padding: 8px 12px;
    min-width: 150px;
  }

  .toolbar-btn {
    width: 32px;
    height: 32px;
  }

  .content-textarea,
  .preview-content {
    padding: 16px;
    font-size: 13px;
  }

  .editor-footer {
    padding: 10px 16px;
  }
}

@media (max-width: 480px) {
  .editor-header {
    padding: 10px;
  }

  .title-input {
    font-size: 13px;
  }

  .content-textarea,
  .preview-content {
    padding: 12px;
    font-size: 12px;
  }
}

/* Scrollbar Styling */
.preview-content::-webkit-scrollbar,
.editor-content::-webkit-scrollbar {
  width: 8px;
}

.preview-content::-webkit-scrollbar-track,
.editor-content::-webkit-scrollbar-track {
  background: transparent;
}

.preview-content::-webkit-scrollbar-thumb,
.editor-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb:hover,
.editor-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>