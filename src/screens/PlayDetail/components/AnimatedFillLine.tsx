import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text } from 'react-native'
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

/**
 * Left-to-right text reveal matching desktop's
 * `background-size: X% 100%` + `background-clip: text` approach.
 *
 * We calculate the cumulative fill percentage across the entire line
 * respecting per-character timing (pauses at character boundaries),
 * then clip the played-color overlay with a pixel-width View.
 * The inner Text always gets the full measured width so it never wraps.
 */
const AnimatedFillWords = memo(({ words, lineTime, playedColor, unplayedColor, size, lineHeight }: Props) => {
  const isPlay = useIsPlay()
  const [displayMs, setDisplayMs] = useState(() => {
    const pos = global.getPositionSync?.()
    if (typeof pos === 'number' && pos >= 0) return pos * 1000
    return playerState.progress.nowPlayTime * 1000
  })
  useEffect(() => {
    if (!isPlay) {
      const pos = global.getPositionSync?.()
      if (typeof pos === 'number' && pos >= 0) {
        setDisplayMs(pos * 1000)
      } else {
        setDisplayMs(playerState.progress.nowPlayTime * 1000)
      }
      return
    }

    let raf: number | null = null
    const tick = () => {
      const pos = global.getPositionSync?.()
      if (typeof pos === 'number' && pos >= 0) {
        setDisplayMs(pos * 1000)
      } else {
        setDisplayMs(playerState.progress.nowPlayTime * 1000)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [isPlay])

  const fontSize = setSpText(size)
  const fullText = useMemo(() => words.map(w => w.text).join(''), [words])

  // Cumulative fill percentage across the entire line.
  const fillPercent = useMemo(() => {
    const elapsed = displayMs - lineTime
    if (elapsed <= 0) return 0

    let totalChars = 0
    let filledUnits = 0
    let past = false

    for (const word of words) {
      for (let ci = 0; ci < word.text.length; ci++) {
        const perCharDuration = word.duration / word.text.length
        const charStart = word.offset + ci * perCharDuration
        if (perCharDuration <= 0) {
          totalChars++
          if (!past) {
            if (elapsed >= charStart) filledUnits++
            else past = true
          }
          continue
        }
        totalChars++
        if (past) continue
        const charEnd = charStart + perCharDuration
        if (elapsed >= charEnd) {
          filledUnits++
        } else if (elapsed > charStart) {
          filledUnits += (elapsed - charStart) / perCharDuration
          past = true
        } else {
          past = true
        }
      }
    }

    return totalChars > 0 ? filledUnits / totalChars : 1
  }, [words, displayMs, lineTime])

  // Measure the full text pixel width once via onLayout.
  // This is the key to avoiding text wrapping in the clipped overlay:
  // the inner Text always gets the full width, only the parent clip View
  // is sized to (textWidth * fillPercent) pixels.
  const [textWidth, setTextWidth] = useState(0)
  const handleLayout = useCallback((e: any) => {
    const w = e.nativeEvent.layout.width
    if (w > 0 && w !== textWidth) setTextWidth(w)
  }, [textWidth])

  if (fillPercent >= 1) {
    return (
      <Text textBreakStrategy="simple" style={{ color: playedColor, fontSize, lineHeight }}>
        {fullText}
      </Text>
    )
  }

  if (fillPercent <= 0 || textWidth <= 0) {
    return (
      <Text textBreakStrategy="simple" style={{ color: unplayedColor, fontSize, lineHeight }} onLayout={handleLayout}>
        {fullText}
      </Text>
    )
  }

  // Partial fill: overlay the full text in playedColor,
  // clipped to (textWidth * fillPercent) pixels from the left.
  const clipWidth = textWidth * fillPercent
  return (
    <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
      <Text textBreakStrategy="simple" style={{ color: unplayedColor, fontSize, lineHeight }}>
        {fullText}
      </Text>
      <View style={{ position: 'absolute', top: 0, left: 0, width: clipWidth, overflow: 'hidden' }}>
        <Text textBreakStrategy="simple" style={{ color: playedColor, fontSize, lineHeight, width: textWidth }}>
          {fullText}
        </Text>
      </View>
    </View>
  )
})

export default AnimatedFillWords
