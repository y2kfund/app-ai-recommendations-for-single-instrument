<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useJournal } from '../composables/useJournal'
import JournalTree from './JournalTree.vue'
import JournalEditor from './JournalEditor.vue'

interface JournalProps {
  userId: string
  symbolRoot: string
}

const props = defineProps<JournalProps>()

const {
  entries,
  selectedEntry,
  isLoading,
  error,
  loadEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  selectEntry,
  toggleCollapse
} = useJournal(props.userId, props.symbolRoot)

const isSidebarVisible = ref(false)

const handleCreateEntry = async (parentId: string | null = null) => {
  await createEntry('New Note', parentId)
}

const handleUpdateEntry = async (id: string, title: string, content: string, isBold: boolean) => {
  await updateEntry(id, { title, content, is_bold: isBold })
}

const handleDeleteEntry = async (id: string) => {
  if (confirm('Are you sure you want to delete this note and all its children?')) {
    await deleteEntry(id)
  }
}

const handleToggle = async (id: string) => {
  await toggleCollapse(id)
}

const handleSelectEntry = async (id: string) => {
  await selectEntry(id)
}

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}
</script>

<template>
  <div class="journal-container">
    <button 
      class="sidebar-toggle-btn" 
      @click="toggleSidebar"
      :title="isSidebarVisible ? 'Hide notes' : 'Show notes'"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
      </svg>
    </button>

    <div v-if="isSidebarVisible" class="journal-sidebar">
      <div class="journal-header">
        <h3>📓 Notes</h3>
        <button class="btn-new-note" @click="handleCreateEntry(null)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="btn-text">New</span>
        </button>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>

      <JournalTree
        v-else
        :entries="entries"
        :selected-id="selectedEntry?.id"
        @select="handleSelectEntry"
        @create="handleCreateEntry"
        @delete="handleDeleteEntry"
        @toggle="handleToggle"
      />
    </div>

    <!-- Journal Editor -->
    <div v-if="selectedEntry" class="journal-editor-container" :class="isSidebarVisible ? `visible` : `hidden`">
      <JournalEditor
        :key="selectedEntry.id"
        :entry="selectedEntry"
        :symbol-root="props.symbolRoot"
        @update="handleUpdateEntry"
      />
    </div>

    <div v-else class="empty-state">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <h3>No Note Selected</h3>
      <p>Select a note from the sidebar or create a new one</p>
    </div>

    <div v-if="error" class="error-banner">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<style scoped>
.journal-container {
  display: flex;
  height: calc(100vh - 200px);
  min-height: 400px;
  gap: 8px;
  position: relative;
  min-width: 600px;
}

.sidebar-toggle-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: auto;
}

.sidebar-toggle-btn:hover {
  color: #1e293b;
}

.sidebar-toggle-btn:active {
  transform: scale(0.95);
}

.journal-sidebar {
  width: 240px;
  min-width: 180px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  padding-left: 28px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 6px;
}

.journal-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.btn-new-note {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
  width: auto;
}

.btn-new-note:hover {
  background: #2563eb;
  box-shadow: 0 2px 3px rgba(59, 130, 246, 0.3);
}

.btn-new-note:active {
  transform: scale(0.98);
}

.journal-editor-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.journal-editor-container {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
}

.empty-state svg {
  color: #cbd5e1;
}

.empty-state h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #475569;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  color: #64748b;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-banner {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  color: #dc2626;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
  max-width: calc(100% - 24px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .journal-container {
    flex-direction: column;
    height: auto;
    min-height: 500px;
  }

  .journal-sidebar {
    width: 100%;
    min-width: auto;
    max-height: 250px;
  }

  .journal-editor-panel {
    min-height: 300px;
  }

  .btn-text {
    display: none;
  }

  .btn-new-note {
    padding: 5px;
  }
}

@media (max-width: 480px) {
  .journal-container {
    gap: 6px;
  }

  .journal-sidebar {
    padding: 8px;
    border-radius: 6px;
  }

  .journal-editor-panel {
    border-radius: 6px;
  }

  .journal-header h3 {
    font-size: 12px;
  }
}

/* Scrollbar Styling */
.journal-sidebar::-webkit-scrollbar {
  width: 5px;
}

.journal-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.journal-sidebar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.journal-sidebar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

<style>
.journal-editor-container.hidden .editor-header {
    padding-left: 36px !important;
}
</style>