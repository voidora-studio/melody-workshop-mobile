/**
 * Forced alignment worker — runs in a WebView context.
 *
 * This worker receives LRC lines + audio PCM data and returns
 * word-level timing via postMessage.
 *
 * To use this worker:
 * 1. Install `react-native-webview`
 * 2. Create a hidden WebView loading this worker's HTML wrapper
 * 3. Communicate via postMessage/onMessage bridge
 *
 * Message format:
 *   Input:  { type: 'align', id: string, lrcLines: LineInput[], pcm: number[], sampleRate: number }
 *   Output: { type: 'line', id: string, index: number, line: AlignedLine }
 *   Output: { type: 'complete', id: string, lines: AlignedLine[] }
 *   Output: { type: 'error', id: string, message: string }
 */

// Compute short-time energy (RMS) for each frame
function computeEnergyEnvelope(pcm, sampleRate, frameSizeMs, hopSizeMs) {
  var frameSize = Math.round((frameSizeMs / 1000) * sampleRate)
  var hopSize = Math.round((hopSizeMs / 1000) * sampleRate)
  var numFrames = Math.floor((pcm.length - frameSize) / hopSize) + 1
  if (numFrames <= 0) return new Float64Array(0)

  var energy = new Float64Array(numFrames)
  for (var i = 0; i < numFrames; i++) {
    var offset = i * hopSize
    var sum = 0
    for (var j = 0; j < frameSize; j++) {
      sum += pcm[offset + j] * pcm[offset + j]
    }
    energy[i] = Math.sqrt(sum / frameSize)
  }
  return energy
}

// Find local minima in the energy envelope
function findEnergyMinima(energy, hopSizeMs, minDistanceMs) {
  var minDistanceFrames = Math.round(minDistanceMs / hopSizeMs)
  var minima = []
  for (var i = 1; i < energy.length - 1; i++) {
    if (energy[i] < energy[i - 1] && energy[i] <= energy[i + 1]) {
      if (minima.length === 0 || i - minima[minima.length - 1] >= minDistanceFrames) {
        minima.push(i)
      }
    }
  }
  return minima
}

function frameToMs(frameIndex, hopSizeMs) {
  return frameIndex * hopSizeMs
}

// Align a single line: detect syllable boundaries in the audio segment
function alignLine(pcm, sampleRate, line, hopSizeMs) {
  var chars = line.text.split('')
  var charCount = chars.length
  if (charCount === 0) return []

  var lineDurationMs = line.endTime - line.startTime
  var startSample = Math.round((line.startTime / 1000) * sampleRate)
  var endSample = Math.round((line.endTime / 1000) * sampleRate)

  var segStart = Math.max(0, Math.min(startSample, pcm.length - 1))
  var segEnd = Math.max(segStart + 1, Math.min(endSample, pcm.length))

  // Use a small slice — avoid copying the whole segment for performance
  var segment = pcm.slice(segStart, segEnd)
  var energy = computeEnergyEnvelope(segment, sampleRate, 25, hopSizeMs || 10)

  if (energy.length === 0) {
    // Fallback: uniform distribution
    var charDuration = lineDurationMs / charCount
    var words = []
    for (var i = 0; i < charCount; i++) {
      words.push({
        word: chars[i],
        startTime: line.startTime + i * charDuration,
        endTime: line.startTime + (i + 1) * charDuration,
      })
    }
    return words
  }

  var minima = findEnergyMinima(energy, hopSizeMs || 10, 40)
  var canUseMinima = minima.length >= charCount - 2 && minima.length <= charCount + 2

  if (canUseMinima && minima.length > 0) {
    var selectedBoundaries = []
    if (minima.length <= charCount - 1) {
      for (var m = 0; m < minima.length; m++) {
        selectedBoundaries.push(frameToMs(minima[m], hopSizeMs || 10))
      }
    } else {
      var step = minima.length / charCount
      for (var i = 1; i < charCount; i++) {
        var idx = Math.round(i * step)
        selectedBoundaries.push(frameToMs(minima[Math.min(idx, minima.length - 1)], hopSizeMs || 10))
      }
    }
    selectedBoundaries.sort(function(a, b) { return a - b })

    var words = []
    var prevBoundary = 0
    for (var i = 0; i < charCount; i++) {
      var boundary = i < selectedBoundaries.length ? selectedBoundaries[i] : lineDurationMs
      words.push({
        word: chars[i],
        startTime: line.startTime + prevBoundary,
        endTime: line.startTime + boundary,
      })
      prevBoundary = boundary
    }
    return words
  }

  // Fallback: uniform
  var charDur = lineDurationMs / charCount
  var fallbackWords = []
  for (var i = 0; i < charCount; i++) {
    fallbackWords.push({
      word: chars[i],
      startTime: line.startTime + i * charDur,
      endTime: line.startTime + (i + 1) * charDur,
    })
  }
  return fallbackWords
}

self.onmessage = function(e) {
  var data = e.data
  if (data.type === 'align') {
    try {
      var lrcLines = data.lrcLines
      var pcm = new Float32Array(data.pcm)
      var sampleRate = data.sampleRate
      var taskId = data.id

      for (var i = 0; i < lrcLines.length; i++) {
        var line = lrcLines[i]
        var words = alignLine(pcm, sampleRate, line)
        self.postMessage({
          type: 'line',
          id: taskId,
          index: i,
          line: {
            startTime: line.startTime,
            endTime: line.endTime,
            words: words,
          },
        })
      }

      self.postMessage({ type: 'complete', id: taskId })
    } catch (err) {
      self.postMessage({ type: 'error', id: data.id, message: err.message })
    }
  }
}
