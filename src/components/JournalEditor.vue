<script setup lang="ts">
import { ref, watch } from 'vue'
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
          :class="['toolbar-btn', { active: isBold }]"
          @click="isBold = !isBold; handleSave()"
          title="Bold title"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <textarea
      v-model="content"
      class="content-textarea"
      placeholder="Write your notes here..."
      @blur="handleBlur"
    ></textarea>
    
    <div class="editor-footer">
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
  padding: 16px;
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

.content-textarea {
  flex: 1;
  padding: 20px;
  background: #ffffff;
  border: none;
  color: #334155;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.content-textarea::placeholder {
  color: #94a3b8;
}

.content-textarea:focus {
  outline: none;
}

.editor-footer {
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8f9fa;
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

  .content-textarea {
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

  .content-textarea {
    padding: 12px;
    font-size: 12px;
  }
}
</style>