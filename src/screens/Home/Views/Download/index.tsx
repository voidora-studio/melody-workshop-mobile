import { memo, useCallback } from 'react'
import { View, FlatList, TouchableOpacity, Alert } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useDownloadList } from '@/store/download/hook'
import { pauseDownload, resumeDownload, removeDownload, retryDownload } from '@/core/download'
import downloadActions from '@/store/download/action'
import { useI18n } from '@/lang'

const DownloadItem = memo(({ item }: { item: LX.Download.ListItem }) => {
  const theme = useTheme()
  const t = useI18n()

  const handlePause = useCallback(() => pauseDownload(item.id), [item.id])
  const handleResume = useCallback(() => resumeDownload(item.id), [item.id])
  const handleRemove = useCallback(() => removeDownload(item.id), [item.id])
  const handleRetry = useCallback(() => retryDownload(item.id), [item.id])

  const progressPercent = Math.min(Math.round((item.progress || 0) * 100), 100)
  const isCompleted = item.status === 'completed'
  const isError = item.status === 'error'
  const isRunning = item.status === 'run'
  const isWaiting = item.status === 'waiting'
  const isPaused = item.status === 'pause'

  return (
    <View style={{ ...styles.item, borderBottomColor: theme['c-border-background'] }}>
      <View style={styles.itemInfo}>
        <Text numberOfLines={1} color={theme['c-font']}>{item.metadata.musicInfo.name}</Text>
        <Text size={11} color={theme['c-500']} numberOfLines={1}>
          {item.metadata.musicInfo.singer} · {item.metadata.quality}
        </Text>
      </View>
      <View style={styles.itemStatus}>
        <View style={styles.progressRow}>
          <View style={{ ...styles.progressBg, backgroundColor: theme['c-primary-light-700-alpha-200'] }}>
            <View style={{ ...styles.progressFill, width: `${progressPercent}%`, backgroundColor: isError ? '#f44' : theme['c-primary-font'] }} />
          </View>
          <Text size={11} color={theme['c-300']} style={styles.progressText}>
            {isCompleted ? '100%' : `${progressPercent}%`}
          </Text>
        </View>
        <Text size={11} color={theme['c-400']}>{item.statusText}</Text>
      </View>
      <View style={styles.actions}>
        {isRunning || isWaiting ? (
          <TouchableOpacity onPress={handlePause} style={styles.actionBtn}>
            <Icon name="pause" size={16} color={theme['c-350']} />
          </TouchableOpacity>
        ) : null}
        {isPaused ? (
          <TouchableOpacity onPress={handleResume} style={styles.actionBtn}>
            <Icon name="play" size={16} color={theme['c-350']} />
          </TouchableOpacity>
        ) : null}
        {isError ? (
          <TouchableOpacity onPress={handleRetry} style={styles.actionBtn}>
            <Icon name="refresh" size={16} color={theme['c-350']} />
          </TouchableOpacity>
        ) : null}
        {isCompleted || isError ? (
          <TouchableOpacity onPress={handleRemove} style={styles.actionBtn}>
            <Icon name="close" size={16} color={theme['c-350']} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
})

const ListEmpty = memo(() => {
  const t = useI18n()
  const theme = useTheme()
  return (
    <View style={styles.empty}>
      <Text color={theme['c-400']}>{t('download_empty')}</Text>
    </View>
  )
})

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const list = useDownloadList()

  const renderItem = useCallback(({ item }: { item: LX.Download.ListItem }) => (
    <DownloadItem item={item} />
  ), [])

  const keyExtractor = useCallback((item: LX.Download.ListItem) => item.id, [])

  const completedCount = list.filter(i => i.status === 'completed').length

  const handleClearCompleted = useCallback(() => {
    downloadActions.clearCompleted()
  }, [])

  const handleClearAll = useCallback(() => {
    Alert.alert(
      t('confirm'),
      t('download_clear_all_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('confirm'), onPress: () => downloadActions.clearAll() },
      ],
    )
  }, [t])

  return (
    <View style={styles.container}>
      <View style={{ ...styles.header, borderBottomColor: theme['c-border-background'] }}>
        <Text size={16}>{t('nav_download')}</Text>
        <View style={styles.headerRight}>
          <Text size={12} color={theme['c-400']}>{t('download_task_count', { count: list.length })}</Text>
          {completedCount > 0 ? (
            <TouchableOpacity onPress={handleClearCompleted} style={styles.headerBtn}>
              <Text size={12} color={theme['c-primary-font']}>{t('download_clear_completed')}</Text>
            </TouchableOpacity>
          ) : null}
          {list.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
              <Text size={12} color={theme['c-300']}>{t('download_clear_all')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmpty}
        style={styles.list}
      />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemStatus: {
    width: 100,
    alignItems: 'flex-end',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBg: {
    width: 50,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginLeft: 4,
    width: 36,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionBtn: {
    padding: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
})
