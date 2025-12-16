import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPA_URL
const supabaseAnonKey = import.meta.env.VITE_SUPA_ANON

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface JournalEntry {
  id: string
  user_id: string
  symbol_root: string
  parent_id: string | null
  title: string
  content: string
  is_bold: boolean
  is_collapsed: boolean
  order_index: number
  created_at: string
  updated_at: string
  children?: JournalEntry[]
}

export function useJournal(userId: string, symbolRoot: string) {
  const entries = ref<JournalEntry[]>([])
  const selectedEntry = ref<JournalEntry | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadEntries = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .schema('hf')
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol_root', symbolRoot)
        .order('order_index', { ascending: true })

      if (fetchError) throw fetchError

      // Build tree structure
      const entryMap = new Map<string, JournalEntry>()
      const rootEntries: JournalEntry[] = []

      data?.forEach((entry: JournalEntry) => {
        entryMap.set(entry.id, { ...entry, children: [] })
      })

      data?.forEach((entry: JournalEntry) => {
        const node = entryMap.get(entry.id)!
        if (entry.parent_id) {
          const parent = entryMap.get(entry.parent_id)
          if (parent) {
            parent.children = parent.children || []
            parent.children.push(node)
          } else {
            rootEntries.push(node)
          }
        } else {
          rootEntries.push(node)
        }
      })

      entries.value = rootEntries
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to load journal entries:', err)
    } finally {
      isLoading.value = false
    }
  }

  const createEntry = async (title: string, parentId: string | null = null) => {
    try {
      error.value = null

      const { data, error: insertError } = await supabase
        .schema('hf')
        .from('journal_entries')
        .insert({
          user_id: userId,
          symbol_root: symbolRoot,
          parent_id: parentId,
          title,
          content: '',
          is_bold: false,
          is_collapsed: false,
          order_index: entries.value.length
        })
        .select()
        .single()

      if (insertError) throw insertError

      await loadEntries()
      selectedEntry.value = data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to create entry:', err)
    }
  }

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    try {
      error.value = null

      const { error: updateError } = await supabase
        .schema('hf')
        .from('journal_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      await loadEntries()
      
      // Update selected entry if it's the one being updated
      if (selectedEntry.value?.id === id) {
        const findEntry = (entries: JournalEntry[]): JournalEntry | null => {
          for (const entry of entries) {
            if (entry.id === id) return entry
            if (entry.children) {
              const found = findEntry(entry.children)
              if (found) return found
            }
          }
          return null
        }
        selectedEntry.value = findEntry(entries.value)
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to update entry:', err)
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      error.value = null

      const { error: deleteError } = await supabase
        .schema('hf')
        .from('journal_entries')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      if (selectedEntry.value?.id === id) {
        selectedEntry.value = null
      }

      await loadEntries()
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to delete entry:', err)
    }
  }

  const selectEntry = (id: string) => {
    const findEntry = (entries: JournalEntry[]): JournalEntry | null => {
      for (const entry of entries) {
        if (entry.id === id) return entry
        if (entry.children) {
          const found = findEntry(entry.children)
          if (found) return found
        }
      }
      return null
    }
    selectedEntry.value = findEntry(entries.value)
  }

  const toggleCollapse = async (id: string) => {
    const findEntry = (entries: JournalEntry[]): JournalEntry | null => {
      for (const entry of entries) {
        if (entry.id === id) return entry
        if (entry.children) {
          const found = findEntry(entry.children)
          if (found) return found
        }
      }
      return null
    }
    
    const entry = findEntry(entries.value)
    if (entry) {
      await updateEntry(id, { is_collapsed: !entry.is_collapsed })
    }
  }

  onMounted(() => {
    loadEntries()
  })

  return {
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
  }
}