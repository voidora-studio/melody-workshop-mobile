import type { LyricLine, LyricWord } from './lyricsCache'
import { generateUniformWords } from './lxlyricParser'

/**
 * Convert raw LRC text into uniform word-level timing data.
 * Each character in a line gets an equal share of the line duration.
 * Used as fallback when precise word timings are unavailable.
 *
 * Export name matches the spec requirement (convertLrcToAmllFallback).
 */
function _toUniform(lrcText: string): LyricLine[] {
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

  return entries.map((entry, i) => {
    const nextTime = i < entries.length - 1 ? entries[i + 1].time : entry.time + 3000
    const uniformWords = generateUniformWords(entry.text, entry.time, nextTime)
    const words: LyricWord[] = uniformWords.map(w => ({
      word: w.text,
      startTime: entry.time + w.offset,
      endTime: entry.time + w.offset + w.duration,
    }))
    return {
      startTime: entry.time,
      endTime: nextTime,
      words,
    }
  })
}

/** Spec-required name */
export const convertLrcToAmllFallback = _toUniform

/** Descriptive name for internal use */
export const convertLrcToUniformLyricLines = _toUniform
