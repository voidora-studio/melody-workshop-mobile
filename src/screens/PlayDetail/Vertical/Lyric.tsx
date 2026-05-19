import { memo, useMemo, useEffect, useRef, useCallback } from 'react'
import { Animated, View, FlatList, type FlatListProps, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent, Alert, Pressable, Text as RNText } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { type Line, useLrcSet, getLxlyricWords, isLxlyricEnabled, type WordData } from '@/plugins/lyric'
import { createStyle } from '@/utils/tools'
// import { useComponentIds } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { AnimatedColorText } from '@/components/common/Text'
import { setSpText } from '@/utils/pixelRatio'
import playerState from '@/store/player/state'
import { useProgress, useIsPlay } from '@/store/player/hook'
import { scrollTo } from '@/utils/scroll'
import PlayLine, { type PlayLineType } from '../components/PlayLine'
import AnimatedPlayingWord from '../components/AnimatedPlayingWord'
import Clipboard from '@react-native-clipboard/clipboard'
import searchActions from '@/store/search/action'
import { Navigation } from 'react-native-navigation'
import commonState from '@/store/common/state'

type FlatListType = FlatListProps<Line>

interface LineProps {
  line: Line
  lineNum: number
  activeLine: number
  isZoomActiveLrc: boolean
  lxlyricWords: WordData[] | null
  lxlyricWordIndex: number
  wordProgressAnim: Animated.Value
  onLayout: (lineNum: number, height: number, width: number) => void
}
const LrcLine = memo(({ line, lineNum, activeLine, isZoomActiveLrc, lxlyricWords, lxlyricWordIndex, wordProgressAnim, onLayout }: LineProps) => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('playDetail.vertical.style.lrcFontSize')
  const textAlign = useSettingValue('playDetail.style.align')
  const size = lrcFontSize / 10
  const lineHeight = setSpText(size) * 1.3
  const isActive = activeLine == lineNum
  const zoomScale = isZoomActiveLrc && isActive ? 1.15 : 1

  const colors = useMemo(() => {
    return isActive ? [
      theme['c-primary'],
      theme['c-primary-alpha-200'],
      1,
    ] as const : [
      theme['c-350'],
      theme['c-300'],
      0.6,
    ] as const
  }, [isActive, theme])

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    onLayout(lineNum, nativeEvent.layout.height, nativeEvent.layout.width)
  }

  // textBreakStrategy="simple" 用于解决某些设备上字体被截断的问题
  // https://stackoverflow.com/a/72822360
  const handleLongPress = () => {
    const mainText = line.text
    Alert.alert(
      mainText,
      undefined,
      [
        {
          text: global.i18n.t('lyric_menu_copy'),
          onPress: () => {
            Clipboard.setString(mainText)
          },
        },
        {
          text: global.i18n.t('lyric_menu_search'),
          onPress: () => {
            searchActions.setSearchText(mainText)
            const homeId = commonState.componentIds.home
            if (homeId) void Navigation.popToRoot(homeId)
          },
        },
        { text: global.i18n.t('cancel'), style: 'cancel' },
      ],
    )
  }

  return (
    <Pressable onLongPress={handleLongPress}>
      <View style={[styles.line, zoomScale !== 1 && { transform: [{ scale: zoomScale }] }]} onLayout={handleLayout}>
        {lxlyricWords && isActive ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start' }}>
            {lxlyricWords.map((word, wi) => {
              const isPlayed = wi < lxlyricWordIndex
              const isCurrent = wi === lxlyricWordIndex
              if (isCurrent) {
                return (
                  <AnimatedPlayingWord
                    key={wi}
                    word={word}
                    animValue={wordProgressAnim}
                    playedColor={theme['c-primary']}
                    unplayedColor={theme['c-350']}
                    size={size}
                    lineHeight={lineHeight}
                  />
                )
              }
              return (
                <RNText key={wi} textBreakStrategy="simple" style={{
                  fontSize: setSpText(size),
                  lineHeight,
                  color: isPlayed ? theme['c-primary'] : theme['c-350'],
                  opacity: isPlayed ? 1 : 0.6,
                  fontWeight: 'normal',
                }}>{word.text}</RNText>
              )
            })}
          </View>
        ) : (
          <AnimatedColorText style={{
            ...styles.lineText,
            textAlign,
            lineHeight,
          }} textBreakStrategy="simple" color={colors[0]} opacity={colors[2]} size={size}>{line.text}</AnimatedColorText>
        )}
        {
          line.extendedLyrics.map((lrc, index) => {
            return (<AnimatedColorText style={{
              ...styles.lineTranslationText,
              textAlign,
              lineHeight: lineHeight * 0.8,
            }} textBreakStrategy="simple" key={index} color={colors[1]} opacity={colors[2]} size={size * 0.8}>{lrc}</AnimatedColorText>)
          })
        }
      </View>
    </Pressable>
  )
}, (prevProps, nextProps) => {
  const isPrevActive = prevProps.activeLine === prevProps.lineNum
  const isNextActive = nextProps.activeLine === nextProps.lineNum
  if (isPrevActive !== isNextActive) return false
  if (isNextActive) {
    return prevProps.lxlyricWordIndex === nextProps.lxlyricWordIndex &&
      prevProps.line === nextProps.line &&
      prevProps.wordProgressAnim === nextProps.wordProgressAnim
  }
  return prevProps.line === nextProps.line &&
    prevProps.activeLine != nextProps.lineNum &&
    nextProps.activeLine != nextProps.lineNum
})
const wait = async() => new Promise(resolve => setTimeout(resolve, 100))

// Compute active line index from audio progress instead of relying on lrc-file-parser's internal timer
const useActiveLine = (lyricLines: Line[]) => {
  const progress = useProgress()
  const isPlay = useIsPlay()
  return useMemo(() => {
    if (!lyricLines.length || !isPlay) return -1
    const currentTimeMs = progress.nowPlayTime * 1000
    for (let i = lyricLines.length - 1; i >= 0; i--) {
      if (currentTimeMs >= lyricLines[i].time) {
        return i
      }
    }
    return -1
  }, [lyricLines, progress.nowPlayTime, isPlay])
}

// Compute word index from audio progress
const useActiveWordIndex = (activeLine: number, lyricLines: Line[]) => {
  const progress = useProgress()
  const isPlay = useIsPlay()
  return useMemo(() => {
    if (!isLxlyricEnabled() || activeLine < 0 || !lyricLines.length || !isPlay) return -1
    const words = getLxlyricWords(activeLine)
    if (!words || words.length === 0) return -1
    const currentTimeMs = progress.nowPlayTime * 1000
    const lineTime = lyricLines[activeLine]?.time ?? 0
    const elapsedInLine = currentTimeMs - lineTime
    if (elapsedInLine < 0) return -1
    for (let i = words.length - 1; i >= 0; i--) {
      if (elapsedInLine >= words[i].offset) return i
    }
    return -1
  }, [activeLine, lyricLines, progress.nowPlayTime, isPlay])
}

export default () => {
  const lyricLines = useLrcSet()
  const line = useActiveLine(lyricLines)
  const lxlyricWordIndex = useActiveWordIndex(line, lyricLines)
  // lxlyricWords for the active line (for RAF word animation)
  const lxlyricWords = useMemo(() => {
    if (line < 0) return null
    return getLxlyricWords(line)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, lyricLines])

  // Single parent-level RAF loop for smooth word progress animation
  const wordProgressAnim = useRef(new Animated.Value(0)).current
  const wordRafRef = useRef<number | null>(null)
  const isPlay = useIsPlay()

  useEffect(() => {
    let running = true

    if (!isPlay || line < 0 || !lxlyricWords || lxlyricWords.length === 0) {
      wordProgressAnim.setValue(0)
      return
    }

    const lineTime = lyricLines[line]?.time ?? 0
    let lastSyncTime = playerState.progress.nowPlayTime
    let lastSyncWall = Date.now()

    const tick = () => {
      if (!running) return

      // Read latest progress directly from store (always fresh)
      const currentStoreTime = playerState.progress.nowPlayTime
      if (currentStoreTime !== lastSyncTime) {
        lastSyncTime = currentStoreTime
        lastSyncWall = Date.now()
      }

      // Smooth time estimation using wall clock between store updates
      const estimatedMs = lastSyncTime * 1000 + (Date.now() - lastSyncWall)
      const elapsedInLine = estimatedMs - lineTime

      if (elapsedInLine >= 0) {
        let wi = -1
        for (let i = lxlyricWords.length - 1; i >= 0; i--) {
          if (elapsedInLine >= lxlyricWords[i].offset) {
            wi = i
            break
          }
        }
        if (wi >= 0) {
          const wordElapsed = estimatedMs - lineTime - lxlyricWords[wi].offset
          wordProgressAnim.setValue(Math.min(1, Math.max(0, wordElapsed / lxlyricWords[wi].duration)))
        } else {
          wordProgressAnim.setValue(0)
        }
      } else {
        wordProgressAnim.setValue(0)
      }

      wordRafRef.current = requestAnimationFrame(tick)
    }

    wordRafRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      if (wordRafRef.current !== null) {
        cancelAnimationFrame(wordRafRef.current)
        wordRafRef.current = null
      }
    }
  }, [line, isPlay, lxlyricWords, wordProgressAnim, lyricLines])

  const flatListRef = useRef<FlatList>(null)
  const playLineRef = useRef<PlayLineType>(null)
  const isPauseScrollRef = useRef(true)
  const scrollTimoutRef = useRef<NodeJS.Timeout | null>(null)
  const delayScrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const lineRef = useRef({ line: 0, prevLine: 0 })
  const isFirstSetLrc = useRef(true)
  const scrollInfoRef = useRef<NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'] | null>(null)
  const listLayoutInfoRef = useRef<{ spaceHeight: number, lineHeights: number[] }>({ spaceHeight: 0, lineHeights: [] })
  const scrollCancelRef = useRef<(() => void) | null>(null)
  const isShowLyricProgressSetting = useSettingValue('playDetail.isShowLyricProgressSetting')
  const isZoomActiveLrc = useSettingValue('playDetail.isZoomActiveLrc')
  const lyricDelayScroll = useSettingValue('playDetail.lyricDelayScroll')

  const handleScrollToActive = (index = lineRef.current.line) => {
    if (index < 0) return
    if (flatListRef.current) {
      if (scrollInfoRef.current && lineRef.current.line - lineRef.current.prevLine == 1) {
        let offset = listLayoutInfoRef.current.spaceHeight
        for (let line = 0; line < index; line++) {
          offset += listLayoutInfoRef.current.lineHeights[line]
        }
        offset += (listLayoutInfoRef.current.lineHeights[line] ?? 0) / 2
        try {
          scrollCancelRef.current = scrollTo(flatListRef.current, scrollInfoRef.current, offset - scrollInfoRef.current.layoutMeasurement.height * 0.42, 600, () => {
            scrollCancelRef.current = null
          })
        } catch {}
      } else {
        if (scrollCancelRef.current) {
          scrollCancelRef.current()
          scrollCancelRef.current = null
        }
        try {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.42,
          })
        } catch {}
      }
    }
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollInfoRef.current = nativeEvent
    if (isPauseScrollRef.current) {
      playLineRef.current?.updateScrollInfo(nativeEvent)
    }
  }
  const handleScrollBeginDrag = () => {
    isPauseScrollRef.current = true
    playLineRef.current?.setVisible(true)
    if (delayScrollTimeout.current) {
      clearTimeout(delayScrollTimeout.current)
      delayScrollTimeout.current = null
    }
    if (scrollTimoutRef.current) {
      clearTimeout(scrollTimoutRef.current)
      scrollTimoutRef.current = null
    }
    if (scrollCancelRef.current) {
      scrollCancelRef.current()
      scrollCancelRef.current = null
    }
  }

  const onScrollEndDrag = () => {
    if (!isPauseScrollRef.current) return
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
    scrollTimoutRef.current = setTimeout(() => {
      playLineRef.current?.setVisible(false)
      scrollTimoutRef.current = null
      isPauseScrollRef.current = false
      if (!playerState.isPlay) return
      handleScrollToActive()
    }, 3000)
  }


  useEffect(() => {
    return () => {
      if (delayScrollTimeout.current) {
        clearTimeout(delayScrollTimeout.current)
        delayScrollTimeout.current = null
      }
      if (scrollTimoutRef.current) {
        clearTimeout(scrollTimoutRef.current)
        scrollTimoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    listLayoutInfoRef.current.lineHeights = []
    lineRef.current.prevLine = 0
    lineRef.current.line = 0
    if (!flatListRef.current) return
    flatListRef.current.scrollToOffset({
      offset: 0,
      animated: false,
    })
    if (!lyricLines.length) return
    playLineRef.current?.updateLyricLines(lyricLines)
    requestAnimationFrame(() => {
      if (isFirstSetLrc.current) {
        isFirstSetLrc.current = false
        setTimeout(() => {
          isPauseScrollRef.current = false
          handleScrollToActive()
        }, 100)
      } else {
        if (delayScrollTimeout.current) clearTimeout(delayScrollTimeout.current)
        delayScrollTimeout.current = setTimeout(() => {
          handleScrollToActive(0)
        }, 100)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lyricLines])

  useEffect(() => {
    if (line < 0) return
    lineRef.current.prevLine = lineRef.current.line
    lineRef.current.line = line
    if (!flatListRef.current || isPauseScrollRef.current) return

    if (line - lineRef.current.prevLine != 1) {
      handleScrollToActive()
      return
    }

    delayScrollTimeout.current = setTimeout(() => {
      delayScrollTimeout.current = null
      handleScrollToActive()
    }, lyricDelayScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line])

  useEffect(() => {
    requestAnimationFrame(() => {
      playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
      playLineRef.current?.updateLyricLines(lyricLines)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowLyricProgressSetting])

  const handleScrollToIndexFailed: FlatListType['onScrollToIndexFailed'] = (info) => {
    void wait().then(() => {
      handleScrollToActive(info.index)
    })
  }

  const handleLineLayout = useCallback<LineProps['onLayout']>((lineNum, height) => {
    listLayoutInfoRef.current.lineHeights[lineNum] = height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])

  const handleSpaceLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    listLayoutInfoRef.current.spaceHeight = nativeEvent.layout.height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])

  const handlePlayLine = useCallback((time: number) => {
    playLineRef.current?.setVisible(false)
    global.app_event.setProgress(time)
  }, [])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => {
    const isActive = index === line
    return (
      <LrcLine line={item} lineNum={index} activeLine={line} isZoomActiveLrc={isZoomActiveLrc}
        lxlyricWords={isActive ? lxlyricWords : null}
        lxlyricWordIndex={isActive ? lxlyricWordIndex : -1}
        wordProgressAnim={wordProgressAnim}
        onLayout={handleLineLayout} />
    )
  }
  const getkey: FlatListType['keyExtractor'] = (item, index) => `${index}${item.text}`

  const spaceComponent = useMemo(() => (
    <View style={styles.space} onLayout={handleSpaceLayout}></View>
  ), [handleSpaceLayout])

  return (
    <>
      <FlatList
        data={lyricLines}
        renderItem={renderItem}
        keyExtractor={getkey}
        style={styles.container}
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={spaceComponent}
        ListFooterComponent={spaceComponent}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        fadingEdgeLength={100}
        initialNumToRender={Math.max(line + 10, 10)}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onScroll={handleScroll}
      />
      { isShowLyricProgressSetting ? <PlayLine ref={playLineRef} onPlayLine={handlePlayLine} /> : null }
    </>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  space: {
    paddingTop: '100%',
  },
  line: {
    paddingTop: 10,
    paddingBottom: 10,
    // opacity: 0,
  },
  lineText: {
    textAlign: 'center',
    // fontSize: 16,
    // lineHeight: 20,
    // paddingTop: 5,
    // paddingBottom: 5,
    // opacity: 0,
  },
  lineTranslationText: {
    textAlign: 'center',
    // fontSize: 13,
    // lineHeight: 17,
    paddingTop: 5,
    // paddingBottom: 5,
  },
})
