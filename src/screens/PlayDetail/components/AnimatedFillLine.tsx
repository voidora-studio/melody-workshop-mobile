import { memo, useRef, useState, useEffect, useMemo } from 'react'
import { Text } from 'react-native'
import { setSpText } from '@/utils/pixelRatio'
import type { WordData } from '@/utils/lxlyricParser'
import playerState from '@/store/player/state'

interface Props {
  words: WordData[]
  lineTime: number
  playedColor: string
  unplayedColor: string
  size: number
  lineHeight: number
}

const interpolateColor = (color1: string, color2: string, ratio: number): string => {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')
  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)
  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)
  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)
  return `rgb(${r},${g},${b})`
}

// Creates a wavefront effect: a single ~1-char-wide transition sweeps
// left-to-right. Characters before the wave are fully lit, characters
// after are dim, and the character at the wavefront is mid-transition.
// This matches the Apple Music lyric fill style.
const AnimatedFillWords = memo(({ words, lineTime, playedColor, unplayedColor, size, lineHeight }: Props) => {
  const initialTimeMs = playerState.progress.nowPlayTime * 1000
  const [currentMs, setCurrentMs] = useState(initialTimeMs)
  const currentMsRef = useRef(initialTimeMs)
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(true)

  useEffect(() => {
    runningRef.current = true
    let lastSyncTime = playerState.progress.nowPlayTime
    let lastSyncWall = Date.now()
    const seedMs = lastSyncTime * 1000
    currentMsRef.current = Math.max(currentMsRef.current, seedMs)
    setCurrentMs(currentMsRef.current)

    const tick = () => {
      if (!runningRef.current) return
      const storeTime = playerState.progress.nowPlayTime
      if (storeTime !== lastSyncTime) {
        lastSyncTime = storeTime
        lastSyncWall = Date.now()
      }
      // Stop wall-clock drift when paused; never go backward
      const estimatedMs = playerState.isPlay
        ? lastSyncTime * 1000 + (Date.now() - lastSyncWall)
        : lastSyncTime * 1000
      if (estimatedMs > currentMsRef.current) {
        currentMsRef.current = estimatedMs
        setCurrentMs(estimatedMs)
      } else if (!playerState.isPlay) {
        // Paused: still sync to store time if it changed
        currentMsRef.current = estimatedMs
        setCurrentMs(estimatedMs)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      runningRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [lineTime, words])

  const fontSize = setSpText(size)

  // Expand words into individual characters
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

  // Total line duration, clamped to avoid divide-by-zero
  const lineDuration = Math.max(100, lineEnd - lineTime)
  // Normalised line progress [0, 1]
  const lineProgress = Math.min(1, Math.max(0, (currentMs - lineTime) / lineDuration))
  // Number of characters the wavefront spans (1 = razor-sharp, larger = softer)
  const WAVE_WIDTH = 1.2
  const totalChars = chars.length

  return (
    <Text textBreakStrategy="simple" style={{ fontSize, lineHeight }}>
      {chars.map((char, i) => {
        // Normalised wave position: 0..totalChars
        const wavePos = lineProgress * totalChars
        // Distance from wave centre to this character (chars)
        const distance = wavePos - i
        // Clamp to [0, 1] with a transition window of WAVE_WIDTH chars
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
