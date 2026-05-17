import { saveData, getData } from '@/plugins/storage'
import playerState from '@/store/player/state'
import { throttle } from '@/utils/common'

const STORAGE_KEY = 'listen_sessions'

interface SessionRecord {
  name: string
  singer: string
  time: number
  duration: number
}

interface SessionData {
  sessions: SessionRecord[]
}

let sessionData: SessionData = { sessions: [] }
let currentRecord: { name: string; singer: string; startTime: number } | null = null
let isLoaded = false

const persistThrottled = throttle(() => {
  void saveData(STORAGE_KEY, sessionData)
}, 5000)

export const initListenSession = async () => {
  const data = await getData<SessionData>(STORAGE_KEY)
  if (data) sessionData = data
  isLoaded = true
}

export const clearListenSessions = async () => {
  sessionData = { sessions: [] }
  await saveData(STORAGE_KEY, sessionData)
}

export const getListenSessions = (): SessionData => {
  return sessionData
}

export const getListenStats = () => {
  const sessions = sessionData.sessions
  const totalSessions = sessions.length
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0)
  const songCountMap = new Map<string, number>()
  const artistCountMap = new Map<string, number>()
  const songDurationMap = new Map<string, number>()

  for (const s of sessions) {
    const songKey = `${s.name} - ${s.singer}`
    songCountMap.set(songKey, (songCountMap.get(songKey) ?? 0) + 1)
    songDurationMap.set(songKey, (songDurationMap.get(songKey) ?? 0) + s.duration)
    artistCountMap.set(s.singer, (artistCountMap.get(s.singer) ?? 0) + 1)
  }

  const topSongs = [...songCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const topArtists = [...artistCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return {
    totalSessions,
    totalDuration,
    topSongs,
    topArtists,
  }
}

export const recordPlayStart = () => {
  const musicInfo = playerState.musicInfo
  if (!musicInfo.name) return
  currentRecord = {
    name: musicInfo.name,
    singer: musicInfo.singer || 'Unknown',
    startTime: Date.now(),
  }
}

export const recordPlayEnd = () => {
  if (!currentRecord) return
  const duration = Date.now() - currentRecord.startTime
  if (duration < 30000) { // ignore plays shorter than 30s
    currentRecord = null
    return
  }
  sessionData.sessions.push({
    name: currentRecord.name,
    singer: currentRecord.singer,
    time: currentRecord.startTime,
    duration,
  })
  currentRecord = null
  persistThrottled()
}

export const exportSessionsJson = async (): Promise<string> => {
  return JSON.stringify(sessionData, null, 2)
}
