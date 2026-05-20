import type { LyricLine } from './lyricsCache'
import { getLyricsFromCache, setLyricsToCache } from './lyricsCache'
import { convertLrcToUniformLyricLines } from './lrcParser'
import { decodeAudioToPCM } from './audioDecoder'
import { forcedAlign, type AlignedLine } from './forcedAlign'

export interface AlignmentOptions {
  /** Called for each line as alignment completes */
  onLineReady?: (index: number, line: LyricLine) => void
  /** Called when all lines are aligned (or fallback applied) */
  onComplete: (lines: LyricLine[]) => void
  /** Max wait before falling back to uniform timing (default 15s) */
  timeout?: number
}

const alignedToLyricLine = (aligned: AlignedLine): LyricLine => ({
  startTime: aligned.startTime,
  endTime: aligned.endTime,
  words: aligned.words.map(w => ({
    word: w.word,
    startTime: w.startTime,
    endTime: w.endTime,
  })),
})

const parseLrcToLineInputs = (lrcText: string) => {
  if (!lrcText) return []
  const timeRxp = /\[(\d{1,3}):(\d{2})\.(\d{1,3})]/g
  const lines = lrcText.split('\n')
  const entries: { time: number; text: string }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    timeRxp.lastIndex = 0
    const times: number[] = []
    let match
    while ((match = timeRxp.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      times.push(minutes * 60000 + seconds * 1000 + ms)
    }
    const text = trimmed.replace(/\[[\d:.]+\]/g, '').trim()
    if (!text) continue
    for (const time of times) {
      entries.push({ time, text })
    }
  }

  entries.sort((a, b) => a.time - b.time)

  return entries.map((entry, i) => ({
    startTime: entry.time,
    endTime: i < entries.length - 1 ? entries[i + 1].time : entry.time + 3000,
    text: entry.text,
  }))
}

/**
 * Progressive alignment manager.
 *
 * Flow:
 * 1. Check cache → if hit, return immediately
 * 2. Generate uniform fallback → show immediately
 * 3. If audio buffer provided, run forced alignment → upgrade line-by-line
 * 4. Cache the final result
 * 5. On timeout, keep the uniform fallback
 */
export const getLyricsDataProgressive = async(
  songId: string,
  lrcText: string,
  audioArrayBuffer?: ArrayBuffer,
  audioFilePath?: string,
  options?: AlignmentOptions,
): Promise<LyricLine[]> => {
  const timeout = options?.timeout ?? 15000

  // 1. Check cache first
  const cached = await getLyricsFromCache(songId)
  if (cached && cached.length > 0) {
    cached.forEach((line, i) => options?.onLineReady?.(i, line))
    options?.onComplete(cached)
    return cached
  }

  // 2. Generate uniform fallback immediately
  const uniformLines = convertLrcToUniformLyricLines(lrcText)
  uniformLines.forEach((line, i) => options?.onLineReady?.(i, line))

  // 3. If we have audio data, try forced alignment
  let alignedLines: LyricLine[] | null = null

  if (audioFilePath) {
    try {
      const { pcm, sampleRate } = await decodeAudioToPCM(audioFilePath)
      const lineInputs = parseLrcToLineInputs(lrcText)

      if (lineInputs.length > 0 && pcm.length > 0) {
        const aligned = forcedAlign(lineInputs, pcm, sampleRate, (index, line) => {
          const ll = alignedToLyricLine(line)
          options?.onLineReady?.(index, ll)
        })
        alignedLines = aligned.map(alignedToLyricLine)
      }
    } catch (err) {
      console.warn('[alignmentManager] Forced alignment failed, using uniform fallback:', err)
    }
  }

  // 4. Cache result (aligned or uniform)
  const finalLines = alignedLines ?? uniformLines
  void setLyricsToCache(songId, finalLines)

  options?.onComplete(finalLines)
  return finalLines
}
