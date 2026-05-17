import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'
import { Icon } from '@/components/common/Icon'
import { useSettingValue } from '@/store/setting/hook'
// import { AppColors } from '@/theme'


const DefaultBar = memo(({ barHeight }: { barHeight: number }) => {
  const theme = useTheme()

  return <View style={{ height: barHeight, borderRadius: 4, backgroundColor: theme['c-primary-light-300-alpha-800'], position: 'absolute', width: '100%', left: 0, top: 0 }}></View>
})

const BufferedBar = memo(({ progress, barHeight }: { progress: number, barHeight: number }) => {
  // console.log(bufferedProgress)
  const theme = useTheme()
  return <View style={{ height: barHeight, borderRadius: 4, backgroundColor: theme['c-primary-light-400-alpha-700'], position: 'absolute', width: `${progress * 100}%`, left: 0, top: 0 }}></View>
})


const PreassBar = memo(({ onDragState, setDragProgress, onSetProgress, contentHeight, contentPadding }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
  contentHeight: number
  contentPadding: number
}) => {
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, onDragState, setDragProgress)
  // const handlePress = useCallback((event: GestureResponderEvent) => {
  //   onPress(event.nativeEvent.locationX)
  // }, [onPress])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      // onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        // console.log(evt.nativeEvent.locationX, gestureState)
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
      // onPanResponderTerminate: (evt, gestureState) => {
      //   onDragEnd()
      // },
    }),
  ).current

  return <View onLayout={onLayout} style={{
    position: 'absolute',
    left: 0,
    top: 0,
    height: contentHeight,
    paddingTop: contentPadding,
    paddingBottom: contentPadding,
    width: '100%',
    zIndex: 6,
  }} {...panResponder.panHandlers} />
})


const progressStyleConfig = {
  mini: { barHeight: 2.5, dotScale: 0.6, contentPadding: 8 },
  middle: { barHeight: 3.6, dotScale: 0.8, contentPadding: 10 },
  full: { barHeight: 5, dotScale: 1, contentPadding: 12 },
}

const Progress = ({ progress, duration, buffered }: {
  progress: number
  duration: number
  buffered: number
}) => {
  // const { progress: bufferProgress } = usePlayTimeBuffer()
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const barStyle = useSettingValue('playDetail.progressStyle')
  const cfg = progressStyleConfig[barStyle]
  const progressHeight = useMemo(() => cfg.barHeight, [cfg])
  const progressContentPadding = useMemo(() => cfg.contentPadding, [cfg])
  const progressContentHeight = useMemo(() => progressContentPadding * 2 + progressHeight, [progressContentPadding, progressHeight])

  const progressHeightSize = scaleSizeH(progressHeight)
  const progressDotSize = scaleSizeW(progressContentHeight * cfg.dotScale)

  // console.log(progress)
  const progressStr: `${number}%` = `${progress * 100}%`

  const progressDotStyle = useMemo(() => {
    return {
      width: progressDotSize,
      position: 'absolute',
      right: -progressDotSize / 2,
      top: -(progressDotSize - progressHeightSize) / 2,
    } as const
  }, [progressDotSize, progressHeightSize])

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((progress: number) => {
    global.app_event.setProgress(progress * durationRef.current)
  }, [])

  return (
    <View style={{
      width: '100%',
      height: progressContentHeight,
      paddingTop: progressContentPadding,
      paddingBottom: progressContentPadding,
      zIndex: 1,
    }}>
      <View>
        <DefaultBar barHeight={progressHeight} />
        <BufferedBar progress={buffered} barHeight={progressHeight} />
        {
          draging
            ? (
                <>
                  <View style={{ height: progressHeight, borderRadius: 4, backgroundColor: theme['c-primary-light-100-alpha-700'], width: progressStr, position: 'absolute', left: 0, top: 0 }} />
                  <View style={{ height: progressHeight, borderRadius: 4, backgroundColor: theme['c-primary-light-100-alpha-600'], width: `${dragProgress * 100}%`, position: 'absolute', left: 0, top: 0 }}>
                    <Icon name="full_stop" color={theme['c-primary-light-100']} rawSize={progressDotSize} style={progressDotStyle} />
                  </View>
                </>
              ) : (
                <View style={{ height: progressHeight, borderRadius: 4, backgroundColor: theme['c-primary-light-100-alpha-400'], width: progressStr, position: 'absolute', left: 0, top: 0 }}>
                  <Icon name="full_stop" color={theme['c-primary-light-100']} rawSize={progressDotSize} style={progressDotStyle} />
                </View>
              )
        }

      </View>
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} contentHeight={progressContentHeight} contentPadding={progressContentPadding} />
      {/* <View style={{ ...styles.progressBar, height: '100%', width: progressStr }}><Pressable style={styles.progressDot}></Pressable></View> */}
    </View>
  )
}

export default Progress
