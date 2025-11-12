import { ref } from 'vue'
import html2canvas from 'html2canvas'

export function useScreenshot() {
  const isCapturing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Capture screenshot of a specific element
   */
  const captureElement = async (elementId: string): Promise<string | null> => {
    isCapturing.value = true
    error.value = null

    try {
      const element = document.querySelector(elementId) as HTMLElement
      
      if (!element) {
        throw new Error(`Element with selector "${elementId}" not found`)
      }

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })

      // Convert to base64
      const screenshot = canvas.toDataURL('image/jpeg', 0.85)
      return screenshot
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture screenshot'
      error.value = message
      console.error('Screenshot error:', err)
      return null
    } finally {
      isCapturing.value = false
    }
  }

  /**
   * Capture screenshot of the instrument details container
   */
  const captureInstrumentDetails = async (): Promise<string | null> => {
    return captureElement('.instrument-details-container')
  }

  return {
    isCapturing,
    error,
    captureElement,
    captureInstrumentDetails
  }
}