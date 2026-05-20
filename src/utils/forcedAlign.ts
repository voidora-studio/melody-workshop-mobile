/**
 * Forced alignment engine: aligns LRC text lines to audio PCM data
 * to produce word-level timing.
 *
 * Algorithm: Energy-based syllable boundary detection + character distribution.
 * Each Chinese character maps to one syllable. We detect syllable nuclei
 * from the short-time energy envelope and assign characters to them.
 */

export interface AlignedWord {
  word: string
  startTime: number // ms from song start
  endTime: number
}

export interface AlignedLine {
  startTime: number
  endTime: number
  words: AlignedWord[]
}

interface LineInput {
  startTime: number // ms
  endTime: number // ms
  text: string
}

/**
 * Compute short-time energy for each frame of the PCM signal.
 * Returns energy values at regular intervals.
 */
const computeEnergyEnvelope = (
  pcm: Float32Array,
  sampleRate: number,
  frameSizeMs = 25,
  hopSizeMs = 10,
): Float64Array => {
  const frameSize = Math.round((frameSizeMs / 1000) * sampleRate)
  const hopSize = Math.round((hopSizeMs / 1000) * sampleRate)
  const numFrames = Math.floor((pcm.length - frameSize) / hopSize) + 1
  if (numFrames <= 0) return new Float64Array(0)

  const energy = new Float64Array(numFrames)
  for (let i = 0; i < numFrames; i++) {
    const offset = i * hopSize
    let sum = 0
    for (let j = 0; j < frameSize; j++) {
      sum += pcm[offset + j] * pcm[offset + j]
    }
    energy[i] = Math.sqrt(sum / frameSize) // RMS energy
  }
  return energy
}

/**
 * Find local minima in the energy envelope — these are potential
 * syllable/character boundaries.
 */
const findEnergyMinima = (
  energy: Float64Array,
  hopSizeMs: number,
  sampleRate: number,
  minDistanceMs = 50,
): number[] => {
  const hopSize = Math.round((hopSizeMs / 1000) * sampleRate)
  const minDistanceFrames = Math.round(minDistanceMs / hopSizeMs)
  const minima: number[] = []

  for (let i = 1; i < energy.length - 1; i++) {
    // Local minimum: lower than both neighbors
    if (energy[i] < energy[i - 1] && energy[i] <= energy[i + 1]) {
      // Enforce minimum distance between minima
      if (minima.length === 0 || i - minima[minima.length - 1] >= minDistanceFrames) {
        minima.push(i)
      }
    }
  }
  return minima
}

/**
 * Compute the time in ms for a given frame index.
 */
const frameToMs = (frameIndex: number, hopSizeMs: number): number =>
  frameIndex * hopSizeMs

/**
 * Split a segment of PCM into character-level timing using energy minima.
 *
 * For each line, we:
 * 1. Extract the audio segment for the line's time range
 * 2. Compute the energy envelope
 * 3. Find syllable boundaries (energy minima)
 * 4. Map characters to detected syllables
 * 5. Fall back to uniform distribution if alignment fails
 */
const alignLine = (
  pcm: Float32Array,
  sampleRate: number,
  line: LineInput,
  hopSizeMs = 10,
): AlignedWord[] => {
  const chars = line.text.split('')
  const charCount = chars.length
  if (charCount === 0) return []

  const lineDurationMs = line.endTime - line.startTime
  const startSample = Math.round((line.startTime / 1000) * sampleRate)
  const endSample = Math.round((line.endTime / 1000) * sampleRate)

  // Clamp to valid range
  const segStart = Math.max(0, Math.min(startSample, pcm.length - 1))
  const segEnd = Math.max(segStart + 1, Math.min(endSample, pcm.length))

  const segment = pcm.slice(segStart, segEnd)

  // Compute energy envelope for this segment
  const energy = computeEnergyEnvelope(segment, sampleRate, 25, hopSizeMs)

  // Find syllable boundaries within the segment
  const minima = findEnergyMinima(energy, hopSizeMs, sampleRate, 40)

  // If we have roughly the right number of boundaries, use them
  // Otherwise fall back to uniform distribution
  const canUseMinima = minima.length >= charCount - 2 && minima.length <= charCount + 2

  if (canUseMinima && minima.length > 0) {
    // Select charCount-1 boundaries from minima, evenly distributed
    const selectedBoundaries: number[] = []
    if (minima.length <= charCount - 1) {
      // Use all minima, pad missing ones uniformly
      for (const m of minima) selectedBoundaries.push(frameToMs(m, hopSizeMs))
      while (selectedBoundaries.length < charCount - 1) {
        const avgGap = lineDurationMs / charCount
        const insertPos = (selectedBoundaries.length + 1) * avgGap
        selectedBoundaries.push(insertPos)
      }
      selectedBoundaries.sort((a, b) => a - b)
    } else {
      // Select charCount-1 boundaries evenly from the detected minima
      const step = minima.length / charCount
      for (let i = 1; i < charCount; i++) {
        const idx = Math.round(i * step)
        selectedBoundaries.push(frameToMs(minima[Math.min(idx, minima.length - 1)], hopSizeMs))
      }
    }

    // Build word timings from boundaries
    const words: AlignedWord[] = []
    let prevBoundary = 0
    for (let i = 0; i < charCount; i++) {
      const boundary = i < selectedBoundaries.length ? selectedBoundaries[i] : lineDurationMs
      words.push({
        word: chars[i],
        startTime: line.startTime + prevBoundary,
        endTime: line.startTime + boundary,
      })
      prevBoundary = boundary
    }
    return words
  }

  // Fallback: uniform distribution
  const charDuration = lineDurationMs / charCount
  return chars.map((char, i) => ({
    word: char,
    startTime: line.startTime + i * charDuration,
    endTime: line.startTime + (i + 1) * charDuration,
  }))
}

/**
 * Run forced alignment on LRC lines against audio PCM data.
 *
 * @param lrcLines - Lines with start/end times and text
 * @param pcm - Mono PCM audio data (Float32Array)
 * @param sampleRate - Audio sample rate in Hz
 * @param onLineReady - Callback for each aligned line
 * @returns Fully aligned lines
 */
export const forcedAlign = (
  lrcLines: LineInput[],
  pcm: Float32Array,
  sampleRate: number,
  onLineReady?: (index: number, line: AlignedLine) => void,
): AlignedLine[] => {
  const result: AlignedLine[] = []

  for (let i = 0; i < lrcLines.length; i++) {
    const line = lrcLines[i]
    const words = alignLine(pcm, sampleRate, line)
    const alignedLine: AlignedLine = {
      startTime: line.startTime,
      endTime: line.endTime,
      words,
    }
    result.push(alignedLine)
    onLineReady?.(i, alignedLine)
  }

  return result
}
