import { memo, useRef, useState, useEffect, useMemo } from 'react'
import { Text } from 'react-native'
import { setSpText } from '@/utils/pixelRatio'
import type { WordData } from '@/utils/lxlyricParser'
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

const parseColor = (color: string): { r: number; g: number; b: number } | null => {
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
 * Uses wall-clock advance during playback for smooth 60fps animation
 * independent of player progress event frequency. Player position is
 * smoothly chased with gradual catch-up, preventing the initial jump
 * that would skip the first few characters of each line.
 *
 * When a new line mounts, displayMs starts at lineTime so the wavefront
 * begins at position 0. A smooth chase factor closes the gap toward
 * the true player position over ~500ms — imperceptibly fast during
 * normal playback. Forward/backward seeks (>1s gap) snap immediately.
 *
 * react-native-transcript-karaoke's Karaoke component cannot achieve
 * inline per-character fill animation because it renders each chunk
 * as a sibling <Text> element (each on its own line). This component
 * renders all characters of one line inline with a smooth gradient
 * wavefront transition (WAVE_WIDTH = 2 chars for CJK readability).
 */

const AnimatedFillWords = memo(({ words, lineTime, playedColor, unplayedColor, size, lineHeight }: Props) => {
  const isPlay = useIsPlay()

  // Always start the wavefront from the beginning of the line.
  // The smooth-chase in the RAF loop handles catch-up to the actual
  // audio position within ~500ms, so every character animates in.
  const [displayMs, setDisplayMs] = useState(() => lineTime)
  const displayMsRef = useRef(displayMs)
  const rafRef = useRef<number | null>(null)

  // ── RAF loop: wall-clock advance, smooth-chase player position ───
  useEffect(() => {
    if (!isPlay) {
      const ms = Math.round(playerState.progress.nowPlayTime * 1000)
      displayMsRef.current = ms
      setDisplayMs(ms)
      return
    }

    let lastWall = Date.now()

    const tick = () => {
      const now = Date.now()
      const dt = now - lastWall
      lastWall = now

      const playerMs = Math.round(playerState.progress.nowPlayTime * 1000)

      if (dt > 200) {
        // App was backgrounded — re-sync from player
        displayMsRef.current = playerMs
      } else {
        // Advance by real wall-clock delta (= audio time during normal playback)
        displayMsRef.current += dt

        // Smooth-chase player position to handle the initial gap (line
        // activated slightly after audio reached it) and clock drift.
        const gap = playerMs - displayMsRef.current
        if (gap > 1000) {
          // Forward seek — snap immediately
          displayMsRef.current = playerMs
        } else if (gap > 0) {
          // Smooth catch-up: close the gap over ~200ms so the wavefront
          // catches up to the audio position quickly but without a visible jump.
          displayMsRef.current += gap * Math.min(dt / 200, 1)
        } else if (gap < -1000) {
          // Backward seek (> 1s drop) — snap immediately
          displayMsRef.current = playerMs
          lastWall = now
        }
      }

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
  const WAVE_WIDTH = 2.0 // characters — wider wavefront for smoother CJK transition
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
