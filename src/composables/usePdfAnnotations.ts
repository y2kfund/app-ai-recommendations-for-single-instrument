import { ref } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPA_URL
const supabaseAnonKey = import.meta.env.VITE_SUPA_ANON

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Annotation {
  id: string
  type: 'highlight' | 'underline' | 'strikethrough' | 'text' | 'drawing' | 'rectangle' | 'circle'
  page: number
  x: number
  y: number
  width?: number
  height?: number
  color: string
  content?: string
  points?: { x: number; y: number }[]
  createdAt: string
  updatedAt: string
}

export interface PdfAnnotationRecord {
  id: string
  pdf_url: string
  symbol_root: string
  entry_id: string
  annotations: Annotation[]
  created_at: string
  updated_at: string
}

export function usePdfAnnotations() {
  const annotations = ref<Annotation[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentRecordId = ref<string | null>(null)

  const fetchAnnotations = async (pdfUrl: string, entryId: string): Promise<Annotation[]> => {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .schema('hf')
        .from('journal_pdf_annotations')
        .select('*')
        .eq('pdf_url', pdfUrl)
        .eq('entry_id', entryId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        currentRecordId.value = data.id
        annotations.value = data.annotations || []
      } else {
        currentRecordId.value = null
        annotations.value = []
      }

      return annotations.value
    } catch (err) {
      error.value = (err as Error).message
      console.error('Error fetching annotations:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const saveAnnotations = async (
    pdfUrl: string,
    symbolRoot: string,
    entryId: string,
    newAnnotations: Annotation[]
  ): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      if (currentRecordId.value) {
        // Update existing record
        const { error: updateError } = await supabase
          .schema('hf')
          .from('journal_pdf_annotations')
          .update({
            annotations: newAnnotations,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentRecordId.value)

        if (updateError) throw updateError
      } else {
        // Create new record
        const { data, error: insertError } = await supabase
          .schema('hf')
          .from('journal_pdf_annotations')
          .insert({
            pdf_url: pdfUrl,
            symbol_root: symbolRoot,
            entry_id: entryId,
            annotations: newAnnotations
          })
          .select()
          .single()

        if (insertError) throw insertError
        currentRecordId.value = data.id
      }

      annotations.value = newAnnotations
      return true
    } catch (err) {
      error.value = (err as Error).message
      console.error('Error saving annotations:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const addAnnotation = async (
    pdfUrl: string,
    symbolRoot: string,
    entryId: string,
    annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Annotation | null> => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedAnnotations = [...annotations.value, newAnnotation]
    const success = await saveAnnotations(pdfUrl, symbolRoot, entryId, updatedAnnotations)

    return success ? newAnnotation : null
  }

  const updateAnnotation = async (
    pdfUrl: string,
    symbolRoot: string,
    entryId: string,
    annotationId: string,
    updates: Partial<Annotation>
  ): Promise<boolean> => {
    const updatedAnnotations = annotations.value.map(ann =>
      ann.id === annotationId
        ? { ...ann, ...updates, updatedAt: new Date().toISOString() }
        : ann
    )

    return saveAnnotations(pdfUrl, symbolRoot, entryId, updatedAnnotations)
  }

  const deleteAnnotation = async (
    pdfUrl: string,
    symbolRoot: string,
    entryId: string,
    annotationId: string
  ): Promise<boolean> => {
    const updatedAnnotations = annotations.value.filter(ann => ann.id !== annotationId)
    return saveAnnotations(pdfUrl, symbolRoot, entryId, updatedAnnotations)
  }

  const deleteAllAnnotations = async (
    pdfUrl: string,
    symbolRoot: string,
    entryId: string
  ): Promise<boolean> => {
    return saveAnnotations(pdfUrl, symbolRoot, entryId, [])
  }

  return {
    annotations,
    isLoading,
    error,
    fetchAnnotations,
    saveAnnotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteAllAnnotations
  }
}