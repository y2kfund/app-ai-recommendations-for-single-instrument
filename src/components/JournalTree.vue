<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { JournalEntry } from '../composables/useJournal'

interface JournalTreeProps {
  entries: JournalEntry[]
  selectedId?: string | null
  level?: number 
  noteId?: string | null
}

const props = withDefaults(defineProps<JournalTreeProps>(), {
  selectedId: null,
  level: 0,
  noteId: null
})

const router = useRouter()

const emit = defineEmits<{
  select: [id: string]
  create: [parentId: string]
  delete: [id: string]
  toggle: [id: string]
}>()

function handleClick(entry: JournalEntry) {
  if (props.noteId) {
    //router.push(`/notes/${entry.id}`)
    window.location.href = `/notes/${entry.id}`
  } else {
    emit('select', entry.id)
  }
}
</script>

<template>
  <div class="journal-tree">
    <div
      v-for="entry in entries"
      :key="entry.id"
      class="tree-node"
      :style="{ paddingLeft: `${level * 12}px` }"
    >
      <div
        :class="['node-header', { selected: entry.id === selectedId }]"
        @click="handleClick(entry)"
      >
        <component
          :is="noteId ? 'a' : 'div'"
          :href="noteId ? `/notes/${entry.id}` : undefined"
          class="node-content"
          @click.prevent
        >
          <a :href="`/notes/${entry.id}`" @click.prevent>
            <button
              v-if="entry.children && entry.children.length > 0"
              class="collapse-btn"
              @click.stop="emit('toggle', entry.id)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline :points="entry.is_collapsed ? '9 18 15 12 9 6' : '6 9 12 15 18 9'"/>
              </svg>
            </button>
            <span v-else class="spacer"></span>
            
            <span :class="['node-title', { bold: entry.is_bold }]">{{ entry.title }}</span>
            
            <div class="node-actions">
              <button class="action-btn" @click.stop="emit('create', entry.id)" title="Add child note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button class="action-btn delete" @click.stop="emit('delete', entry.id)" title="Delete note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </a>
        </component>
      </div>
      
      <JournalTree
        v-if="entry.children && entry.children.length > 0 && !entry.is_collapsed"
        :entries="entry.children"
        :selected-id="selectedId"
        :level="level + 1"
        :note-id="noteId"
        @select="emit('select', $event)"
        @create="emit('create', $event)"
        @delete="emit('delete', $event)"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.journal-tree {
  user-select: none;
}

.tree-node {
  margin-bottom: 1px;
}

.node-content a {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  min-height: 26px;
  box-sizing: border-box;
  text-decoration: none;
  width: 100%;
  color: inherit;
}

.node-header:hover {
  background: #e2e8f0;
}

.node-header.selected {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.collapse-btn {
  padding: 2px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, transform 0.15s ease;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}

.collapse-btn:hover {
  color: #1e293b;
}

.collapse-btn:active {
  transform: scale(0.9);
}

.spacer {
  width: 14px;
  flex-shrink: 0;
}

.node-title {
  flex: 1;
  font-size: 12px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.node-title.bold {
  font-weight: 700;
  color: #1e293b;
}

.node-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
  margin-left: auto;
}

.node-header:hover .node-actions {
  opacity: 1;
}

.action-btn {
  padding: 3px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.action-btn:hover {
  background: #cbd5e1;
  color: #1e293b;
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Responsive */
@media (max-width: 480px) {
  .node-header {
    padding: 3px 5px;
    min-height: 24px;
  }

  .node-title {
    font-size: 11px;
  }

  .action-btn {
    width: 18px;
    height: 18px;
  }
}
</style>

<style>
a.node-content {
  text-decoration: none;
}
</style>