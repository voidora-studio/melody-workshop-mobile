import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_PREFIX = '@lyrics:'

export interface LyricWord {
  word: string
  startTime: number
  endTime: number
}

export interface LyricLine {
  startTime: number
  endTime: number
  words: LyricWord[]
}

const getKey = (songId: string): string => `${CACHE_PREFIX}${songId}`

export const getLyricsFromCache = async(songId: string): Promise<LyricLine[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(getKey(songId))
    if (!raw) return null
    return JSON.parse(raw) as LyricLine[]
  } catch {
    return null
  }
}

export const setLyricsToCache = async(songId: string, data: LyricLine[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(getKey(songId), JSON.stringify(data))
  } catch {
    // Silently fail — cache is non-critical
  }
}

export const removeLyricsFromCache = async(songId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getKey(songId))
  } catch {
    // Silently fail
  }
}
