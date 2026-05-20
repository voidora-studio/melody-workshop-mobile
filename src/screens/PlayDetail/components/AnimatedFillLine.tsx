import { memo, useMemo, useState } from 'react'
import { Animated, View, Text as RNText } from 'react-native'
import { setSpText } from '@/utils/pixelRatio'

interface Props {
  text: string
  animValue: Animated.Value
  playedColor: string
  unplayedColor: string
  size: number
  lineHeight: number
}

const AnimatedFillLine = memo(({ text, animValue, playedColor, unplayedColor, size, lineHeight }: Props) => {
  const [textWidth, setTextWidth] = useState(0)

  const fontStyle = useMemo(() => ({
    fontSize: setSpText(size),
    lineHeight,
    fontWeight: 'bold' as const,
  }), [size, lineHeight])

  const clipWidth = useMemo(() =>
    animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, textWidth || 1],
      extrapolate: 'clamp',
    }),
    [animValue, textWidth],
  )

  return (
    <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
      {/* Unplayed text (full width, used for measurement) */}
      <View onLayout={e => setTextWidth(e.nativeEvent.layout.width)}>
        <RNText textBreakStrategy="simple" style={{ ...fontStyle, color: unplayedColor, opacity: 0.6 }}>
          {text}
        </RNText>
      </View>
      {/* Played text, clipped from left to right as animValue progresses */}
      <Animated.View style={{
        position: 'absolute', left: 0, top: 0,
        width: clipWidth,
        overflow: 'hidden',
      }}>
        <RNText textBreakStrategy="simple" style={{ ...fontStyle, color: playedColor }}>
          {text}
        </RNText>
      </Animated.View>
    </View>
  )
})

export default AnimatedFillLine
