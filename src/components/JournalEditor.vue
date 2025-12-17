<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
const textareaRef = ref<HTMLTextAreaElement | null>(null)

watch(() => props.entry, (newEntry) => {
  title.value = newEntry.title
  content.value = newEntry.content
  isBold.value = newEntry.is_bold
}, { immediate: true })

const renderMarkdown = (text: string): string => {
  if (!text) return ''
  
  const lines = text.split('\n')
  const fragments: string[] = []

  for (const line of lines) {
    let formattedLine = ''

    // Check for headers at start of line - keep the # symbols
    if (line.match(/^######\s/)) {
      const hashes = line.substring(0, 7) // '###### '
      const lineContent = line.substring(7)
      formattedLine = `<span class="md-hash">${escapeHtml(hashes)}</span><span class="md-h6">${formatInline(lineContent)}</span>`
    } else if (line.match(/^#####\s/)) {
      const hashes = line.substring(0, 6) // '##### '
      const lineContent = line.substring(6)
      formattedLine = `<span class="md-hash">${escapeHtml(hashes)}</span><span class="md-h5">${formatInline(lineContent)}</span>`
    } else if (line.match(/^####\s/)) {
      const hashes = line.substring(0, 5) // '#### '
      const lineContent = line.substring(5)
      formattedLine = `<span class="md-hash">${escapeHtml(hashes)}</span><span class="md-h4">${formatInline(lineContent)}</span>`
    } else if (line.match(/^###\s/)) {
      const hashes = line.substring(0, 4) // '### '
      const lineContent = line.substring(4)
      formattedLine = `<span class="md-hash">${escapeHtml(hashes)}</span><span class="md-h3">${formatInline(lineContent)}</span>`
    } else if (line.match(/^##\s/)) {
      const hashes = line.substring(0, 3) // '## '
      const lineContent = line.substring(3)
      formattedLine = `<span class="md-hash">${escapeHtml(hashes)}</span><span class="md-h2">${formatInline(lineContent)}</span>`
    } else if (line.match(/^#\s/)) {
      const hashes = line.substring(0, 2) // '# '
      const lineContent = line.substring(2)
      formattedLine = `<span class="md-hash">${escapeHtml(hashes)}</span><span class="md-h1">${formatInline(lineContent)}</span>`
    } else if (line.match(/^>\s/)) {
      const lineContent = line.substring(2)
      formattedLine = `<span class="md-blockquote">${formatInline(lineContent)}</span>`
    } else if (line.match(/^[\*\-]\s/)) {
      const lineContent = line.substring(2)
      formattedLine = `<span class="md-list-item">• ${formatInline(lineContent)}</span>`
    } else if (line === '') {
      formattedLine = ''
    } else {
      formattedLine = formatInline(line)
    }

    fragments.push(formattedLine)
  }

  return fragments.join('\n')
}

const formatInline = (text: string): string => {
  let result = escapeHtml(text)

  // Bold **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic *text* or _text_ (but not part of bold)
  result = result.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
  result = result.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>')

  // Code `text`
  result = result.replace(/`([^`]+?)`/g, '<code>$1</code>')

  // Links [text](url)
  result = result.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank">$1</a>')

  return result
}

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const renderedHtml = computed(() => renderMarkdown(content.value))

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  content.value = target.value
}

const handleBlur = () => {
  if (title.value !== props.entry.title || content.value !== props.entry.content || isBold.value !== props.entry.is_bold) {
    emit('update', props.entry.id, title.value, content.value, isBold.value)
  }
}

const syncScroll = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const preview = target.parentElement?.querySelector('.preview-overlay') as HTMLElement
  if (preview) {
    preview.scrollTop = target.scrollTop
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
        @blur="handleBlur"
      />
    </div>
    
    <div class="editor-content">
      <div class="editor-wrapper">
        <textarea
          ref="textareaRef"
          v-model="content"
          class="markdown-textarea"
          placeholder="Start typing... Use # for headings, **bold**, *italic*, `code`, [links](url)"
          spellcheck="false"
          @input="handleInput"
          @blur="handleBlur"
          @scroll="syncScroll"
        ></textarea>
        <div 
          class="preview-overlay"
          v-html="renderedHtml"
        ></div>
      </div>
    </div>
    
    <div class="editor-footer">
      <span class="markdown-hint">💡 Live markdown editing - Start typing... Use # for headings, **bold**, *italic*, `code`, [links](url)</span>
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

.editor-content {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  background: #ffffff;
}

.editor-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

.markdown-textarea {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  resize: none;
  color: transparent;
  caret-color: #1e293b;
  background: transparent;
  font-size: 14px;
  line-height: 1.7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
  z-index: 2;
}

.markdown-textarea::placeholder {
  color: #94a3b8;
  opacity: 1;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  color: #334155;
  font-size: 14px;
  line-height: 1.7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
  pointer-events: none;
  z-index: 1;
}

/* Remove transform scale and use consistent font-size with bold, color, and spacing */
.preview-overlay :deep(.md-h1),
.preview-overlay :deep(.md-h2),
.preview-overlay :deep(.md-h3),
.preview-overlay :deep(.md-h4),
.preview-overlay :deep(.md-h5),
.preview-overlay :deep(.md-h6) {
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.022em;
}

.preview-overlay :deep(.md-h1) { 
  color: #000000;
}

.preview-overlay :deep(.md-h2) { 
  color: #0f172a;
}

.preview-overlay :deep(.md-h3) { 
  color: #1e293b;
}

.preview-overlay :deep(.md-h4) { 
  color: #334155;
}

.preview-overlay :deep(.md-h5) { 
  color: #475569;
}

.preview-overlay :deep(.md-h6) { 
  color: #64748b;
  font-style: italic;
}

.preview-overlay :deep(.md-blockquote) {
  border-left: 4px solid #cbd5e1;
  padding-left: 12px;
  color: #64748b;
  font-style: italic;
  display: inline-block;
}

.preview-overlay :deep(.md-list-item) {
  display: inline-block;
}

.preview-overlay :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}

.preview-overlay :deep(em) {
  font-style: italic;
  color: #475569;
}

.preview-overlay :deep(code) {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.95em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #e11d48;
}

.preview-overlay :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

/* Style for markdown hash symbols - make them subtle */
.preview-overlay :deep(.md-hash) {
  color: #cbd5e1;
  font-weight: 400;
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

/* Scrollbar Styling */
.markdown-textarea::-webkit-scrollbar,
.preview-overlay::-webkit-scrollbar {
  width: 8px;
}

.markdown-textarea::-webkit-scrollbar-track,
.preview-overlay::-webkit-scrollbar-track {
  background: transparent;
}

.markdown-textarea::-webkit-scrollbar-thumb,
.preview-overlay::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.markdown-textarea::-webkit-scrollbar-thumb:hover,
.preview-overlay::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    padding: 10px 12px;
  }

  .editor-content {
    padding: 16px;
  }

  .markdown-textarea,
  .preview-overlay {
    font-size: 13px;
  }
}
</style>