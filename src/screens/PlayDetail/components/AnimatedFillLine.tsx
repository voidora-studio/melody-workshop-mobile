import { memo, useRef, useState, useEffect, useMemo } from 'react'
import { Text } from 'react-native'
import { setSpText } from '@/utils/pixelRatio'
import type { WordData } from '@/utils/lxlyricParser'
import TrackPlayer from 'react-native-track-player'
import playerState from '@/store/player/state'
import { useIsPlay } from '@/store/player/hook'

interface Props {
  words: WordData[]
  lineTime: number
  playedColor: string
  unplayedColor: string
  size: number
  lineHeight: number
}

const parseColor = (color: string): { r: number, g: number, b: number } | null => {
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(color)
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] }
  const hex = /^#?([\da-f]{3,8})/i.exec(color)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    if (h.length >= 6) return { r: parseInt(h[0] + h[1], 16), g: parseInt(h[2] + h[3], 16), b: parseInt(h[4] + h[5], 16) }
  }
  return null
}

const interpolateColor = (color1: string, color2: string, ratio: number): string => {
  const c1 = parseColor(color1)
  const c2 = parseColor(color2)
  if (!c1 || !c2) return color1
  const r = Math.round(c1.r + (c2.r - c1.r) * ratio)
  const g = Math.round(c1.g + (c2.g - c1.g) * ratio)
  const b = Math.round(c1.b + (c2.b - c1.b) * ratio)
  return `rgb(${r},${g},${b})`
}

/**
 * Apple Music-style wavefront fill animation for the active lyric line.
 *
 * Polls TrackPlayer.getPosition() at ~60 Hz and reads the freshest value
 * directly in the RAF loop — no wall-clock interpolation, no smooth-chase.
 * This keeps the wavefront within ~10 ms of the real audio clock, so the
 * first character of each new line is at most a few percent pre-filled,
 * which is visually imperceptible. Equivalent in accuracy to desktop
 * <audio>.currentTime polling.
 */

const POLL_MS = 16

const AnimatedFillWords = memo(({ words, lineTime, playedColor, unplayedColor, size, lineHeight }: Props) => {
  const isPlay = useIsPlay()

  const [displayMs, setDisplayMs] = useState(() => lineTime)
  const displayMsRef = useRef(displayMs)
  const rafRef = useRef<number | null>(null)
  const positionRef = useRef(0)

  // ── High-frequency position poll (~60 fps) ──────────────────────
  useEffect(() => {
    if (!isPlay) return

    let isActive = true
    let timerId: ReturnType<typeof setTimeout> | null = null

    const poll = async() => {
      if (!isActive) return
      try {
        const pos = await TrackPlayer.getPosition()
        if (isActive && pos != null) {
          positionRef.current = Math.round(pos * 1000)
        }
      } catch {
        // ignore
      }
      if (isActive) timerId = setTimeout(poll, POLL_MS)
    }

    timerId = setTimeout(poll, 0)

    return () => {
      isActive = false
      if (timerId != null) clearTimeout(timerId)
    }
  }, [isPlay])

  // ── RAF loop: snap directly to the freshest position ────────────
  useEffect(() => {
    if (!isPlay) {
      const ms = Math.round(playerState.progress.nowPlayTime * 1000)
      displayMsRef.current = ms
      setDisplayMs(ms)
      return
    }

    const tick = () => {
      const playerMs = positionRef.current
      displayMsRef.current = playerMs > 0 ? playerMs : Math.round(playerState.progress.nowPlayTime * 1000)
      setDisplayMs(displayMsRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlay])

  // ── Characters & wavefront computation ────────────────────────────
  const fontSize = setSpText(size)

  const { chars, lineEnd } = useMemo(() => {
    let maxEnd = 0
    const c = words.flatMap(word => {
      const perCharDuration = word.duration / word.text.length
      return word.text.split('').map((char, i) => {
        const offset = word.offset + i * perCharDuration
        const end = offset + perCharDuration
        if (end > maxEnd) maxEnd = end
        return { text: char, offset, duration: perCharDuration }
      })
    })
    return { chars: c, lineEnd: lineTime + maxEnd }
  }, [words, lineTime])

  const lineDuration = Math.max(100, lineEnd - lineTime)
  const lineProgress = Math.min(1, Math.max(0, (displayMs - lineTime) / lineDuration))
  const WAVE_WIDTH = 2.0
  const totalChars = chars.length

  return (
    <Text textBreakStrategy="simple" style={{ fontSize, lineHeight }}>
      {chars.map((char, i) => {
        const wavePos = lineProgress * totalChars
        const distance = wavePos - i
        let charProgress = 0
        if (distance >= WAVE_WIDTH / 2) {
          charProgress = 1
        } else if (distance > -WAVE_WIDTH / 2) {
          charProgress = (distance + WAVE_WIDTH / 2) / WAVE_WIDTH
        }
        const color = charProgress <= 0 ? unplayedColor
          : charProgress >= 1 ? playedColor
            : interpolateColor(unplayedColor, playedColor, charProgress)

        return (
          <Text key={i} style={{ color }} textBreakStrategy="simple">
            {char.text}
          </Text>
        )
      })}
    </Text>
  )
})

export default AnimatedFillWords
