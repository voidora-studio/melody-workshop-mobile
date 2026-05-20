/**
 * Worker manager for forced alignment.
 *
 * React Native doesn't support Web Workers natively. This module
 * provides two strategies:
 *
 * 1. **Inline** (default): Runs alignment in the JS thread using
 *    chunked setTimeout to avoid blocking UI. Good for most cases.
 *
 * 2. **WebView** (requires react-native-webview): Runs alignment
 *    in a hidden WebView for true background processing.
 *    To enable, install react-native-webview and set useWebView=true.
 *
 * The inline strategy splits alignment into per-line chunks and
 * yields to the UI between each chunk via setTimeout(fn, 0).
 */

import { forcedAlign, type AlignedLine } from './forcedAlign'

interface LineInput {
  startTime: number
  endTime: number
  text: string
}

interface AlignRequest {
  id: string
  lrcLines: LineInput[]
  pcm: Float32Array
  sampleRate: number
  onLineReady?: (index: number, line: AlignedLine) => void
  onComplete: (lines: AlignedLine[]) => void
  onError?: (error: Error) => void
}

let currentId = 0

/**
 * Run alignment in the JS thread, yielding to UI between each line.
 * This prevents the alignment from blocking animations/gestures.
 */
const runInline = (request: AlignRequest) => {
  const { lrcLines, pcm, sampleRate, onLineReady, onComplete, onError } = request

  let cancelled = false
  let currentIndex = 0
  const results: AlignedLine[] = []

  const processNext = () => {
    if (cancelled) return

    if (currentIndex >= lrcLines.length) {
      onComplete(results)
      return
    }

    try {
      // Process one line at a time
      const line = lrcLines[currentIndex]
      const words = forcedAlign([line], pcm, sampleRate)
      const alignedLine = words[0]

      if (alignedLine) {
        results.push(alignedLine)
        onLineReady?.(currentIndex, alignedLine)
      }

      currentIndex++
      // Yield to UI before processing next line
      setTimeout(processNext, 0)
    } catch (err: any) {
      if (!cancelled) {
        onError?.(err)
        onComplete(results) // Complete with partial results
      }
    }
  }

  // Start processing
  setTimeout(processNext, 0)

  return {
    cancel: () => {
      cancelled = true
    },
  }
}

/**
 * Submit an alignment task. Currently uses inline strategy.
 * Returns a cancel function.
 */
export const submitAlignTask = (request: AlignRequest) => {
  return runInline(request)
}

/**
 * Generate a unique task ID.
 */
export const generateTaskId = (): string => {
  return `align_${++currentId}_${Date.now()}`
}
