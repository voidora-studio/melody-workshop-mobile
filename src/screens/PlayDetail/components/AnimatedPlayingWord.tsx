import { memo, useMemo } from 'react'
import { Animated, View, Text as RNText } from 'react-native'
import { setSpText } from '@/utils/pixelRatio'
import type { WordData } from '@/plugins/lyric'

interface Props {
  word: WordData
  animValue: Animated.Value
  playedColor: string
  unplayedColor: string
  size: number
  lineHeight: number
}

const AnimatedPlayingWord = memo(({ word, animValue, playedColor, unplayedColor, size, lineHeight }: Props) => {
  const fontStyle = useMemo(() => ({
    fontSize: setSpText(size),
    lineHeight,
    fontWeight: 'bold' as const,
  }), [size, lineHeight])

  const opacityPlayed = useMemo(() =>
    animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    [animValue],
  )

  const opacityUnplayed = useMemo(() =>
    animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
    [animValue],
  )

  return (
    <View style={{ position: 'relative' }}>
      {/* Invisible placeholder to establish layout dimensions */}
      <RNText textBreakStrategy="simple" style={{ ...fontStyle, color: 'transparent' }}>
        {word.text}
      </RNText>
      {/* Unplayed color (fades out as word plays) */}
      <Animated.Text textBreakStrategy="simple" style={{
        ...fontStyle,
        position: 'absolute', left: 0, top: 0,
        color: unplayedColor,
        opacity: opacityUnplayed,
      }}>{word.text}</Animated.Text>
      {/* Played color (fades in as word plays) */}
      <Animated.Text textBreakStrategy="simple" style={{
        ...fontStyle,
        position: 'absolute', left: 0, top: 0,
        color: playedColor,
        opacity: opacityPlayed,
      }}>{word.text}</Animated.Text>
    </View>
  )
})

export default AnimatedPlayingWord
