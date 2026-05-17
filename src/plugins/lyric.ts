import { useEffect, useState } from 'react'
import Lyric, { type Lines } from 'lrc-file-parser'
import settingState from '@/store/setting/state'
import { buildLxlyricMap, type WordData } from '@/utils/lxlyricParser'
export type { WordData }
export type Line = Lines[number]
type PlayHook = (line: number, text: string) => void
type SetLyricHook = (lines: Lines) => void
type WordPlayHook = (lineNum: number, wordIndex: number) => void

// word data map: line start time -> WordData[]
let lxlyricWordsMap: Map<number, WordData[]> = new Map()

const lrcTools = {
  isInited: false,
  lrc: null as Lyric | null,
  currentLineData: { line: 0, text: '' },
  currentLines: [] as Lines,
  playHooks: [] as PlayHook[],
  setLyricHooks: [] as SetLyricHook[],
  wordPlayHooks: [] as WordPlayHook[],
  isPlay: false,
  isShowTranslation: false,
  isShowRoma: false,
  isPlayLxlrc: false,
  lyricText: '',
  translationText: '' as string | null | undefined,
  romaText: '' as string | null | undefined,
  currentWordLine: -1,
  currentWordIndex: -1,
  init() {
    if (this.isInited) return
    this.isInited = true
    this.lrc = new Lyric({
      onPlay: this.onPlay.bind(this),
      onSetLyric: this.onSetLyric.bind(this),
      offset: 100, // offset time(ms), default is 150 ms
    })
  },
  onPlay(line: number, text: string) {
    this.currentLineData.line = line
    this.currentLineData.text = text
    for (const hook of this.playHooks) hook(line, text)

    if (this.isPlayLxlrc && lxlyricWordsMap.size > 0 && line >= 0 && line < lrcTools.currentLines.length) {
      const lrcLine = lrcTools.currentLines[line]
      const words = lxlyricWordsMap.get(lrcLine.time)
      if (words && words.length > 0) {
        this.currentWordLine = line
        this.currentWordIndex = -1
      }
    }
  },
  onSetLyric(lines: Lines) {
    this.currentLines = lines
    this.currentLineData.line = 0
    this.currentLineData.text = ''
    this.currentWordLine = -1
    this.currentWordIndex = -1
    for (const hook of this.playHooks) hook(-1, '')
    for (const hook of this.setLyricHooks) hook(lines)
    for (const hook of this.wordPlayHooks) hook(-1, -1)
  },
  addPlayHook(hook: PlayHook) {
    this.playHooks.push(hook)
    hook(this.currentLineData.line, this.currentLineData.text)
  },
  removePlayHook(hook: PlayHook) {
    this.playHooks.splice(this.playHooks.indexOf(hook), 1)
  },
  addSetLyricHook(hook: SetLyricHook) {
    this.setLyricHooks.push(hook)
    hook(this.currentLines)
  },
  removeSetLyricHook(hook: SetLyricHook) {
    this.setLyricHooks.splice(this.setLyricHooks.indexOf(hook), 1)
  },
  addWordPlayHook(hook: WordPlayHook) {
    this.wordPlayHooks.push(hook)
    hook(this.currentWordLine, this.currentWordIndex)
  },
  removeWordPlayHook(hook: WordPlayHook) {
    this.wordPlayHooks.splice(this.wordPlayHooks.indexOf(hook), 1)
  },
  setLyric() {
    const extendedLyrics = [] as string[]
    if (this.isShowTranslation && this.translationText) extendedLyrics.push(this.translationText)
    if (this.isShowRoma && this.romaText) extendedLyrics.push(this.romaText)
    if (settingState.setting['player.isSwapLyricTranslationAndRoma']) extendedLyrics.reverse()
    this.lrc!.setLyric(this.lyricText, extendedLyrics)
  },
  updateWordProgress(lineNum: number, elapsedInLine: number) {
    if (!this.isPlayLxlrc) return
    if (lineNum !== this.currentWordLine) return
    const lrcLine = this.currentLines[lineNum]
    if (!lrcLine) return
    const words = lxlyricWordsMap.get(lrcLine.time)
    if (!words || words.length === 0) return

    let newIndex = -1
    for (let i = words.length - 1; i >= 0; i--) {
      if (elapsedInLine >= words[i].offset) {
        newIndex = i
        break
      }
    }
    if (newIndex !== this.currentWordIndex) {
      this.currentWordIndex = newIndex
      for (const hook of this.wordPlayHooks) hook(lineNum, newIndex)
    }
  },
}


export const init = async() => {
  lrcTools.init()
}

export const setLyric = (lyric: string, translation?: string, romalrc?: string) => {
  lrcTools.isPlay = false
  lrcTools.lyricText = lyric
  lrcTools.translationText = translation
  lrcTools.romaText = romalrc
  lrcTools.setLyric()
}

export const setLxlyric = (lxlyric: string) => {
  lxlyricWordsMap = buildLxlyricMap(lxlyric)
  lrcTools.isPlayLxlrc = !!lxlyric && settingState.setting['player.isPlayLxlrc']
  if (!lxlyric || lxlyricWordsMap.size === 0) {
    lrcTools.isPlayLxlrc = false
  }
}

export const updateWordProgress = (lineNum: number, currentTimeMs: number) => {
  if (!lrcTools.isPlayLxlrc) return
  const lrcLine = lrcTools.currentLines[lineNum]
  if (!lrcLine) return
  const elapsedInLine = currentTimeMs - lrcLine.time
  if (elapsedInLine < 0) return
  lrcTools.updateWordProgress(lineNum, elapsedInLine)
}

export const updateWordProgressByTime = (currentTimeMs: number) => {
  updateWordProgress(lrcTools.currentLineData.line, currentTimeMs)
}

export const isPlayLxlrcActive = () => lrcTools.isPlayLxlrc

export const isLxlyricEnabled = () => lrcTools.isPlayLxlrc

export const getLxlyricWords = (lineNum: number): WordData[] | null => {
  if (!lrcTools.isPlayLxlrc) return null
  const lrcLine = lrcTools.currentLines[lineNum]
  if (!lrcLine) return null
  return lxlyricWordsMap.get(lrcLine.time) ?? null
}

export const setPlaybackRate = (playbackRate: number) => {
  lrcTools.lrc!.setPlaybackRate(playbackRate)
}
export const toggleTranslation = (isShow: boolean) => {
  lrcTools.isShowTranslation = isShow
  if (!lrcTools.lyricText) return
  lrcTools.setLyric()
}
export const toggleRoma = (isShow: boolean) => {
  lrcTools.isShowRoma = isShow
  if (!lrcTools.lyricText) return
  lrcTools.setLyric()
}
export const play = (time: number) => {
  // console.log(time)
  lrcTools.isPlay = true
  lrcTools.lrc!.play(time)
}
export const pause = () => {
  // console.log('pause')
  lrcTools.isPlay = false
  lrcTools.lrc!.pause()
}

// on lyric play hook
export const useLrcPlay = (autoUpdate = true) => {
  const [lrcInfo, setLrcInfo] = useState(lrcTools.currentLineData)
  useEffect(() => {
    if (!autoUpdate) return
    const setLrcCallback: SetLyricHook = () => {
      setLrcInfo({ line: 0, text: '' })
    }
    const playCallback: PlayHook = (line, text) => {
      setLrcInfo({ line, text })
    }
    lrcTools.addSetLyricHook(setLrcCallback)
    lrcTools.addPlayHook(playCallback)
    setLrcInfo(lrcTools.currentLineData)
    return () => {
      lrcTools.removeSetLyricHook(setLrcCallback)
      lrcTools.removePlayHook(playCallback)
    }
  }, [autoUpdate])

  return lrcInfo
}

// on lyric set hook
export const useLrcSet = () => {
  const [lines, setLines] = useState<Lines>(lrcTools.currentLines)
  useEffect(() => {
    const callback = (lines: Lines) => {
      setLines(lines)
    }
    lrcTools.addSetLyricHook(callback)
    return () => { lrcTools.removeSetLyricHook(callback) }
  }, [])

  return lines
}

export const useLxlyricWordPlay = () => {
  const [wordInfo, setWordInfo] = useState({ lineNum: lrcTools.currentWordLine, wordIndex: lrcTools.currentWordIndex })
  useEffect(() => {
    const callback: WordPlayHook = (lineNum, wordIndex) => {
      setWordInfo({ lineNum, wordIndex })
    }
    lrcTools.addWordPlayHook(callback)
    return () => { lrcTools.removeWordPlayHook(callback) }
  }, [])

  return wordInfo
}

