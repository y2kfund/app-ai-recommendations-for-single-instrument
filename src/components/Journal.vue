<script setup lang="ts">
import { computed, ref } from 'vue'
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
      </svg>
    </button>

    <div v-if="isSidebarVisible" class="journal-sidebar">
      <div class="journal-header">
        <h3>📓 Notes</h3>
        <button class="btn-new-note" @click="handleCreateEntry(null)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="btn-text">New Note</span>
        </button>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading notes...</p>
      </div>

      <JournalTree
        v-else
        :entries="entries"
        :selected-id="selectedEntry?.id"
        @select="selectEntry"
        @create="handleCreateEntry"
        @delete="handleDeleteEntry"
        @toggle="handleToggle"
      />
    </div>

    <div class="journal-editor-panel" :class="isSidebarVisible ? `sidebar-visible` : `sidebar-hidden`">
      <JournalEditor
        v-if="selectedEntry"
        :entry="selectedEntry"
        @update="handleUpdateEntry"
      />
      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <h3>No Note Selected</h3>
        <p>Select a note from the sidebar or create a new one</p>
      </div>
    </div>

    <div v-if="error" class="error-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
  gap: 12px;
  position: relative;
}

.sidebar-toggle-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle-btn:hover {
  background: #f8f9fa;
  border-color: #cbd5e1;
  color: #1e293b;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.sidebar-toggle-btn:active {
  transform: scale(0.95);
}

.journal-sidebar {
  width: 280px;
  min-width: 200px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  padding-left: 45px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 8px;
}

.journal-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.btn-new-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
}

.btn-new-note:hover {
  background: #2563eb;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.btn-new-note:active {
  transform: scale(0.98);
}

.journal-editor-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  gap: 16px;
  padding: 32px 16px;
  text-align: center;
}

.empty-state svg {
  color: #cbd5e1;
}

.empty-state h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #475569;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  color: #64748b;
}

.loading-spinner {
  width: 32px;
  height: 32px;
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
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
  max-width: calc(100% - 32px);
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
    max-height: 300px;
  }

  .journal-editor-panel {
    min-height: 300px;
  }

  .journal-header {
    flex-direction: row;
  }

  .btn-text {
    display: none;
  }

  .btn-new-note {
    padding: 8px;
  }

  .sidebar-toggle-btn {
    top: 8px;
    left: 8px;
  }
}

@media (max-width: 480px) {
  .journal-container {
    gap: 8px;
  }

  .journal-sidebar {
    padding: 12px;
    border-radius: 8px;
  }

  .journal-editor-panel {
    border-radius: 8px;
  }

  .journal-header h3 {
    font-size: 14px;
  }

  .btn-new-note {
    padding: 6px 8px;
    font-size: 11px;
  }
}

/* Scrollbar Styling */
.journal-sidebar::-webkit-scrollbar {
  width: 6px;
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