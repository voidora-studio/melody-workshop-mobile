export interface WordData {
  offset: number // ms from line start
  duration: number
  text: string
}

export interface ParsedLxlyricLine {
  time: number // line start time in ms
  words: WordData[]
}

/**
 * Parse lxlyric string into word-level timing data.
 * Format per line: [mm:ss.ms]<offset,duration>word<offset,duration>word...
 * The offset is relative to the line's start time.
 */
export const parseLxlyric = (lxlyric: string): ParsedLxlyricLine[] => {
  if (!lxlyric) return []
  const lines = lxlyric.split('\n')
  const result: ParsedLxlyricLine[] = []

  const lineTimeExp = /\[(\d{1,3}):(\d{2})\.(\d{1,3})\]/
  const wordExp = /<(\d+),(\d+)>([^<]*)/g

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const timeMatch = lineTimeExp.exec(trimmed)
    if (!timeMatch) continue

    const minutes = parseInt(timeMatch[1])
    const seconds = parseInt(timeMatch[2])
    const ms = parseInt(timeMatch[3].padEnd(3, '0'))
    const lineTime = minutes * 60000 + seconds * 1000 + ms

    const words: WordData[] = []
    const wordsStr = trimmed.replace(lineTimeExp, '')

    let wordMatch
    while ((wordMatch = wordExp.exec(wordsStr)) !== null) {
      const offset = parseInt(wordMatch[1])
      const duration = parseInt(wordMatch[2])
      const text = wordMatch[3]
      if (text) {
        words.push({ offset, duration, text })
      }
    }

    if (words.length > 0) {
      result.push({ time: lineTime, words })
    }
  }

  return result
}

/**
 * Build a map from line time (ms) to word array for fast lookup.
 */
export const buildLxlyricMap = (lxlyric: string): Map<number, WordData[]> => {
  const map = new Map<number, WordData[]>()
  const parsed = parseLxlyric(lxlyric)
  for (const line of parsed) {
    map.set(line.time, line.words)
  }
  return map
}

/**
 * Get the active word index within a line given the current playback time
 * relative to the line's start time.
 */
export const getActiveWordIndex = (words: WordData[], elapsedInLine: number): number => {
  for (let i = words.length - 1; i >= 0; i--) {
    if (elapsedInLine >= words[i].offset) return i
  }
  return -1
}
