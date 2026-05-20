import { getLyricsDataProgressive } from './alignmentManager'

type AlignTask = {
  songId: string
  lrcText: string
  audioFilePath?: string
  priority: 'high' | 'normal' | 'low'
}

let queue: AlignTask[] = []
let running = false

const priorityOrder = { high: 0, normal: 1, low: 2 }

const processQueue = async() => {
  if (running || queue.length === 0) return
  running = true

  queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const task = queue.shift()!
  try {
    await getLyricsDataProgressive(
      task.songId,
      task.lrcText,
      undefined,
      task.audioFilePath,
      {
        timeout: task.priority === 'high' ? 30000 : 15000,
        onComplete: () => {},
      },
    )
  } catch {
    // Silently fail — alignment is best-effort
  }

  running = false
  void processQueue()
}

export const addAlignTask = (
  songId: string,
  lrcText: string,
  audioFilePath?: string,
  priority: AlignTask['priority'] = 'normal',
) => {
  queue = queue.filter(t => t.songId !== songId)
  queue.push({ songId, lrcText, audioFilePath, priority })
  void processQueue()
}

/**
 * Trigger alignment after a song finishes downloading.
 * Highest priority — the audio file is fresh on disk.
 */
export const onDownloadComplete = (
  songId: string,
  lrcText: string,
  audioFilePath: string,
) => {
  addAlignTask(songId, lrcText, audioFilePath, 'high')
}

/**
 * Pre-align the first N songs in a playlist.
 * Call this when a playlist loads.
 */
export const preAlignPlaylist = (
  songs: Array<{ songId: string; lrcText: string; audioFilePath?: string }>,
  count = 5,
) => {
  for (const song of songs.slice(0, count)) {
    addAlignTask(song.songId, song.lrcText, song.audioFilePath, 'normal')
  }
}
