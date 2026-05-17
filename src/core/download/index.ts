import RNFS from 'react-native-fs'
import { getMusicUrl } from '@/core/music'
import { downloadFile, stopDownload, mkdir, existsFile, writeFile, privateStorageDirectoryPath } from '@/utils/fs'
import settingState from '@/store/setting/state'
import downloadActions from '@/store/download/action'
import listState from '@/store/list/state'
import { toast } from '@/utils/tools'

let downloadQueue: LX.Download.ListItem[] = []
let isProcessing = false
let activeCount = 0
const activeJobs = new Map<string, number>()

const getFileName = (musicInfo: LX.Music.MusicInfoOnline, ext: string) => {
  const pattern = settingState.setting['download.fileName'] || '歌名 - 歌手'
  return pattern
    .replace('歌名', musicInfo.name)
    .replace('歌手', musicInfo.singer)
    .replace(/[\\/:*?"<>|]/g, '_') + '.' + ext
}

const getListName = (listId?: string): string | null => {
  if (!listId) return null
  const list = listState.allList.find(l => l.id === listId)
  return list ? list.name : null
}

const getDownloadPath = async(musicInfo: LX.Music.MusicInfoOnline, ext: string, listId?: string): Promise<string> => {
  const baseDir = settingState.setting['download.savePath'] || `${privateStorageDirectoryPath}/download`
  const listName = settingState.setting['download.groupByList'] ? getListName(listId) : null
  const dir = listName ? `${baseDir}/${listName}` : baseDir
  const exists = await existsFile(dir)
  if (!exists) await mkdir(dir)
  const fileName = getFileName(musicInfo, ext)
  return `${dir}/${fileName}`
}

const writeLrcFile = async(filePath: string, lrc: string, tlrc?: string | null, rlrc?: string | null) => {
  const isGbk = settingState.setting['download.lyricEncoding'] === 'gbk'
  const lrcPath = filePath.replace(/\.\w+$/, '.lrc')
  let content = lrc
  if (settingState.setting['download.embedLyricTranslation'] && tlrc) {
    content += '\n' + tlrc
  }
  if (settingState.setting['download.embedLyricRoma'] && rlrc) {
    content += '\n' + rlrc
  }
  await writeFile(lrcPath, content, isGbk ? 'gbk' as any : 'utf-8')
}

const downloadOne = async(item: LX.Download.ListItem) => {
  try {
    const url = await getMusicUrl({
      musicInfo: item.metadata.musicInfo,
      quality: item.metadata.quality,
      isRefresh: false,
    })

    downloadActions.updateItem(item.id, { statusText: '下载中…' })

    const path = item.metadata.filePath || await getDownloadPath(item.metadata.musicInfo, item.metadata.ext)

    const jobId = RNFS.downloadFile({
      fromUrl: url,
      toFile: path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36',
      },
      progressDivider: 10,
      progress: (res) => {
        downloadActions.updateItem(item.id, {
          downloaded: res.bytesWritten,
          total: res.contentLength || 0,
          progress: res.contentLength ? res.bytesWritten / res.contentLength : 0,
          speed: '',
        })
      },
    })

    activeJobs.set(item.id, jobId.jobId)

    const result = await jobId.promise

    activeJobs.delete(item.id)

    if (result.statusCode === 200) {
      if (settingState.setting['download.isDownloadLrc']) {
        try {
          // Lyrics are not available at download time from MusicInfoOnline.
          // When the player fetches lyrics separately, pass them here as:
          // writeLrcFile(path, lrcText, tlrcText, rlrcText)
          // For now, LRC file writing requires separate lyric fetching logic.
        } catch (e) {
          console.log('Failed to write LRC file:', e)
        }
      }

      downloadActions.updateItem(item.id, {
        status: 'completed',
        statusText: '已完成',
        progress: 1,
        downloaded: result.bytesWritten,
        total: result.bytesWritten,
        metadata: { ...item.metadata, filePath: path },
      })

      if (settingState.setting['download.completeNotification']) {
        toast(`${item.metadata.musicInfo.name} 下载完成`)
      }
    } else {
      downloadActions.updateItem(item.id, {
        status: 'error',
        statusText: `下载失败 (${result.statusCode})`,
      })
    }
  } catch (err: any) {
    activeJobs.delete(item.id)
    if (item.status === 'pause') {
      downloadActions.updateItem(item.id, { status: 'pause', statusText: '已暂停' })
    } else {
      downloadActions.updateItem(item.id, {
        status: 'error',
        statusText: err?.message || '下载出错',
      })
    }
  }
}

const processQueue = async() => {
  if (isProcessing) return
  isProcessing = true

  const maxNum = parseInt(settingState.setting['download.maxDownloadNum'], 10) || 3

  const runNext = async() => {
    while (downloadQueue.length > 0 && activeCount < maxNum) {
      const item = downloadQueue.shift()
      if (!item) break

      if (item.status === 'pause') continue

      downloadActions.updateItem(item.id, { status: 'run', statusText: '获取链接中…' })

      if (settingState.setting['download.skipExistFile']) {
        const path = item.metadata.filePath || await getDownloadPath(item.metadata.musicInfo, item.metadata.ext)
        const exists = await existsFile(path)
        if (exists) {
          downloadActions.updateItem(item.id, {
            status: 'completed',
            statusText: '已完成',
            progress: 1,
            downloaded: 0,
            total: 0,
            metadata: { ...item.metadata, filePath: path },
          })
          continue
        }
      }

      activeCount++
      downloadOne(item).finally(() => {
        activeCount--
        void runNext()
      })
    }

    if (activeCount === 0) {
      isProcessing = false
    }
  }

  await runNext()
}

export const addDownload = async(musicInfo: LX.Music.MusicInfoOnline, quality?: LX.Quality, listId?: string) => {
  const id = `${musicInfo.id}_${Date.now()}`
  const ext: LX.Download.FileExt = 'mp3'
  const filePath = await getDownloadPath(musicInfo, ext, listId)

  const item: LX.Download.ListItem = {
    id,
    isComplate: false,
    status: 'waiting',
    statusText: '等待中',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '',
    metadata: {
      musicInfo,
      url: null,
      quality: quality || settingState.setting['download.quality'] || '128k',
      ext,
      fileName: getFileName(musicInfo, ext),
      filePath,
    },
  }

  downloadActions.addItem(item)
  downloadQueue.push(item)

  if (!isProcessing) void processQueue()
}

export const pauseDownload = (id: string) => {
  const jobId = activeJobs.get(id)
  if (jobId != null) {
    stopDownload(jobId)
    activeJobs.delete(id)
    activeCount--
    if (!isProcessing) void processQueue()
  }
  downloadActions.updateItem(id, { status: 'pause', statusText: '已暂停' })
  const idx = downloadQueue.findIndex(i => i.id === id)
  if (idx >= 0) downloadQueue[idx].status = 'pause'
}

export const resumeDownload = (id: string) => {
  const item = downloadQueue.find(i => i.id === id)
  if (item) {
    item.status = 'waiting'
    downloadActions.updateItem(id, { status: 'waiting', statusText: '等待中' })
    if (!isProcessing) void processQueue()
  } else {
    const stored = downloadActions.getState().list.find(i => i.id === id)
    if (stored) {
      downloadQueue.push({ ...stored, status: 'waiting' })
      downloadActions.updateItem(id, { status: 'waiting', statusText: '等待中' })
      if (!isProcessing) void processQueue()
    }
  }
}

export const removeDownload = (id: string) => {
  pauseDownload(id)
  const idx = downloadQueue.findIndex(i => i.id === id)
  if (idx >= 0) downloadQueue.splice(idx, 1)
  downloadActions.removeItem(id)
}

export const retryDownload = (id: string) => {
  downloadActions.updateItem(id, { status: 'waiting', statusText: '等待中', progress: 0, downloaded: 0, total: 0 })
  const stored = downloadActions.getState().list.find(i => i.id === id)
  if (stored) {
    downloadQueue.push({ ...stored, status: 'waiting' })
    if (!isProcessing) void processQueue()
  }
}

export const initDownloadList = (list: LX.Download.ListItem[]) => {
  const active = list.filter(i => i.status === 'run' || i.status === 'waiting')
  downloadQueue.push(...active)
  if (active.length > 0 && !isProcessing) void processQueue()
}
