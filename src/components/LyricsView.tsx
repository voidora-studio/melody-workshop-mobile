import { memo, useState, useEffect, useRef, useMemo } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { getLyricsFromCache } from '@/utils/lyricsCache'
import { convertLrcToUniformLyricLines } from '@/utils/lrcParser'
import { getLyricsDataProgressive } from '@/utils/alignmentManager'
import { generateUniformWords } from '@/utils/lxlyricParser'
import AnimatedFillWords from '@/screens/PlayDetail/components/AnimatedFillLine'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

interface Props {
  songId: string
  lrcText: string
  /** Path to cached audio file for forced alignment */
  audioFilePath?: string
  activeLineIndex: number
  lineTime: number
  nextLineTime: number
  lineText: string
  playedColor?: string
  unplayedColor?: string
  fontSize?: number
}

interface InternalLyricLine {
  startTime: number
  endTime: number
  words: Array<{
    word: string
    startTime: number
    endTime: number
  }>
}

const LyricsView = memo(({
  songId,
  lrcText,
  audioFilePath,
  activeLineIndex,
  lineTime,
  nextLineTime,
  lineText,
  playedColor,
  unplayedColor,
  fontSize = 16,
}: Props) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [lyricLines, setLyricLines] = useState<InternalLyricLine[]>([])
  const loadingRef = useRef(false)

  const resolvedPlayedColor = playedColor ?? theme['c-primary']
  const resolvedUnplayedColor = unplayedColor ?? theme['c-350']

  useEffect(() => {
    if (!songId || !lrcText) {
      setLyricLines([])
      setLoading(false)
      return
    }

    if (loadingRef.current) return
    loadingRef.current = true

    let cancelled = false

    const init = async() => {
      // 1. Check cache
      const cached = await getLyricsFromCache(songId)
      if (cancelled) return

      if (cached && cached.length > 0) {
        setLyricLines(cached as InternalLyricLine[])
        setLoading(false)
        loadingRef.current = false
        return
      }

      // 2. Show uniform fallback immediately
      const uniformLines = convertLrcToUniformLyricLines(lrcText)
      if (!cancelled) {
        setLyricLines(uniformLines as InternalLyricLine[])
        if (uniformLines.length > 0) {
          setLoading(false)
        }
      }

      // 3. Progressive alignment with audio if available
      try {
        await getLyricsDataProgressive(
          songId,
          lrcText,
          undefined,
          audioFilePath,
          {
            timeout: 15000,
            onLineReady: (index, line) => {
              if (cancelled) return
              setLyricLines(prev => {
                const next = [...prev]
                if (index < next.length) {
                  next[index] = line as InternalLyricLine
                }
                return next
              })
            },
            onComplete: (lines) => {
              if (cancelled) return
              setLyricLines(lines as InternalLyricLine[])
              setLoading(false)
            },
          },
        )
      } catch {
        // Keep uniform fallback
      }

      loadingRef.current = false
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [songId, lrcText, audioFilePath])

  // Words for the currently active line
  const activeWords = useMemo(() => {
    if (activeLineIndex < 0 || activeLineIndex >= lyricLines.length) {
      return generateUniformWords(lineText, lineTime, nextLineTime)
    }
    const line = lyricLines[activeLineIndex]
    if (!line?.words?.length) {
      return generateUniformWords(lineText, lineTime, nextLineTime)
    }
    return line.words.map(w => ({
      text: w.word,
      offset: w.startTime - line.startTime,
      duration: w.endTime - w.startTime,
    }))
  }, [activeLineIndex, lyricLines, lineText, lineTime, nextLineTime])

  const lineHeight = fontSize * 1.3

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <ActivityIndicator size="small" color={resolvedPlayedColor} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <AnimatedFillWords
        words={activeWords}
        lineTime={lineTime}
        playedColor={resolvedPlayedColor}
        unplayedColor={resolvedUnplayedColor}
        size={fontSize}
        lineHeight={lineHeight}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
})

export default LyricsView
