import { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { View, FlatList, type FlatListProps, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent, Alert, Pressable } from 'react-native'
import { type Line, type WordData, useLrcSet, getLxlyricLines_, isLxlyricEnabled } from '@/plugins/lyric'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { AnimatedColorText } from '@/components/common/Text'
import { setSpText } from '@/utils/pixelRatio'
import playerState from '@/store/player/state'
import { useIsPlay } from '@/store/player/hook'
import { scrollTo } from '@/utils/scroll'
import PlayLine, { type PlayLineType } from '../components/PlayLine'
import AnimatedFillWords from '../components/AnimatedFillLine'
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
  words: WordData[] | null
  onLayout: (lineNum: number, height: number, width: number) => void
}
const LrcLine = memo(({ line, lineNum, activeLine, isZoomActiveLrc, words, onLayout }: LineProps) => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('playDetail.horizontal.style.lrcFontSize')
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
        {words && isActive ? (
          <View style={{ flexDirection: 'row', justifyContent: textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start' }}>
            <AnimatedFillWords
              words={words}
              lineTime={line.time}
              playedColor={theme['c-primary']}
              unplayedColor={theme['c-350']}
              size={size}
              lineHeight={lineHeight}
            />
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
    return prevProps.words === nextProps.words &&
      prevProps.line === nextProps.line
  }
  return prevProps.line === nextProps.line &&
    prevProps.activeLine != nextProps.lineNum &&
    nextProps.activeLine != nextProps.lineNum
})
const wait = async() => new Promise(resolve => setTimeout(resolve, 100))

// Compute active line index from JSI sync position for sub-frame latency.
// Falls back to async progress when JSI is unavailable.
// Uses full millisecond precision for pixel-accurate line matching.
const useActiveLine = (lyricLines: Line[]) => {
  const isPlay = useIsPlay()
  const [currentTimeMs, setCurrentTimeMs] = useState(0)

  useEffect(() => {
    if (!isPlay || !lyricLines.length) {
      return
    }
    let raf: number
    const tick = () => {
      const pos = global.getPositionSync?.()
      if (typeof pos === 'number' && pos >= 0) {
        setCurrentTimeMs(pos * 1000)
      } else {
        setCurrentTimeMs(playerState.progress.nowPlayTime * 1000)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlay, lyricLines.length])

  return useMemo(() => {
    if (!lyricLines.length) return -1
    for (let i = lyricLines.length - 1; i >= 0; i--) {
      if (currentTimeMs >= lyricLines[i].time) {
        return i
      }
    }
    return -1
  }, [lyricLines, currentTimeMs])
}

export default () => {
  const lyricLines = useLrcSet()

  // Build display lines from lxlyric when available, fall back to LRC
  const displayLines = useMemo(() => {
    if (isLxlyricEnabled()) {
      const lxLines = getLxlyricLines_()
      if (lxLines.length > 0) {
        return lxLines.map(lxLine => {
          const match = lyricLines.find(l => l.time === lxLine.time)
          return {
            time: lxLine.time,
            text: lxLine.words.map(w => w.text).join(''),
            words: lxLine.words,
            extendedLyrics: match?.extendedLyrics ?? [],
          }
        })
      }
    }
    return lyricLines
  }, [lyricLines])

  const line = useActiveLine(displayLines as Line[])

  // Words for the active line: real lxlyric data, or null (line-mode)
  const activeLineWords = useMemo(() => {
    if (line < 0) return null
    const lineData = displayLines[line] as any
    if (lineData?.words?.length) return lineData.words as WordData[]
    return null
  }, [line, displayLines])

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
      // console.log('handleScrollToActive', index)
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
    // linesRef.current = lyricLines
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
      <LrcLine line={item as Line} lineNum={index} activeLine={line} isZoomActiveLrc={isZoomActiveLrc}
        words={isActive && !!activeLineWords?.length ? activeLineWords : null}
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
        data={displayLines}
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
