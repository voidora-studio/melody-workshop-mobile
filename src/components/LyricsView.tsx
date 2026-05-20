import { memo, useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { Karaoke } from 'react-native-transcript-karaoke'
import { getLyricsFromCache } from '@/utils/lyricsCache'
import { convertLrcToAmllFallback } from '@/utils/lrcParser'
import { getLyricsDataProgressive } from '@/utils/alignmentManager'
import type { LyricLine } from '@/utils/lyricsCache'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { useProgress } from '@/store/player/hook'

interface Props {
  songId: string
  lrcText: string
  /** Path to cached audio file for forced alignment */
  audioFilePath?: string
  fontSize?: number
}

/**
 * Convert LyricLine[] to karaoke transcript string.
 * Each line becomes: [HH:mm:ss.SSS]full_text
 *
 * Spec: formatToTranscript 将 LyricLine[] 转为 [mm:ss.SS]歌词行 格式字符串
 * SimpleParser requires HH:mm:ss.SSS format.
 */
const formatToTranscript = (lines: LyricLine[]): string => {
  return lines.map(line => {
    const sec = Math.floor(line.startTime / 1000)
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    const ms = Math.round(line.startTime % 1000)
    const text = line.words.map(w => w.word).join('')
    return `${fmtHms(h, m, s, ms)}${text}`
  }).join('\n')
}

const fmtHms = (h: number, m: number, s: number, ms: number): string =>
  `[${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}]`

/**
 * 歌词展示组件
 *
 * 严格按照文档实现：
 * - 收到 songId、lrcText、cachedAudioPath 后，立即用匀速数据初始化 lyrics
 * - 启动 getLyricsDataProgressive，在 onLineReady 中替换对应索引行数据
 * - 首句就绪后关闭 loading，渲染 Karaoke 组件
 * - 加载 UI：半透明遮罩 + ActivityIndicator + "获取中..." 文字
 */
const LyricsView = memo(({ songId, lrcText, audioFilePath, fontSize = 16 }: Props) => {
  const theme = useTheme()
  const progress = useProgress()
  const [loading, setLoading] = useState(true)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const loadingRef = useRef(false)

  // ── Data loading: cache → uniform → progressive alignment ────────
  useEffect(() => {
    if (!songId || !lrcText) {
      setLyrics([])
      setLoading(false)
      return
    }

    if (loadingRef.current) return
    loadingRef.current = true
    let cancelled = false

    const init = async () => {
      // 1. Check cache
      const cached = await getLyricsFromCache(songId)
      if (cancelled) return
      if (cached && cached.length > 0) {
        setLyrics(cached)
        setLoading(false)
        loadingRef.current = false
        return
      }

      // 2. Show uniform fallback immediately (spec: 立即用匀速数据初始化)
      const uniformLines = convertLrcToAmllFallback(lrcText)
      if (cancelled) return
      setLyrics(uniformLines)
      if (uniformLines.length > 0) {
        setLoading(false)
      }

      // 3. Progressive alignment with audio
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
              setLyrics(prev => {
                const next = [...prev]
                if (index < next.length) next[index] = line
                return next
              })
            },
            onComplete: (lines) => {
              if (cancelled) return
              setLyrics(lines)
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
      loadingRef.current = false
    }
  }, [songId, lrcText, audioFilePath])

  // ── Transcript for Karaoke ────────────────────────────────────────
  const transcript = useMemo(() => formatToTranscript(lyrics), [lyrics])

  // ── Loading UI: 半透明遮罩 + ActivityIndicator + "获取中..." ──────
  if (loading) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme['c-primary']} />
          <Text style={[styles.loadingText, { color: theme['c-300'] }]}>
            获取中...
          </Text>
        </View>
      </View>
    )
  }

  // ── Karaoke component per spec ────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      <Karaoke
        transcript={transcript}
        progress={progress.nowPlayTime}
        progressType="seconds"
        activeStyle={{ color: theme['c-primary'], fontSize }}
        style={{ color: theme['c-350'], fontSize }}
      />
    </View>
  )
})

const styles = createStyle({
  wrapper: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
})

export default LyricsView
