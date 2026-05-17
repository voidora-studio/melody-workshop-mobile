import { forwardRef, useImperativeHandle, useState, useCallback, useRef } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { getListMusics, removeListMusics } from '@/core/list'
import listState from '@/store/list/state'

export interface DuplicateMusicModalType {
  show: () => void
}

interface DuplicateGroup {
  target: LX.Music.MusicInfo
  duplicates: LX.Music.MusicInfo[]
}

export default forwardRef<DuplicateMusicModalType>((_props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const popupRef = useRef<PopupType>(null)
  const [visible, setVisible] = useState(false)
  const [groups, setGroups] = useState<DuplicateGroup[]>([])

  useImperativeHandle(ref, () => ({
    show() {
      const listId = listState.activeListId
      void getListMusics(listId).then(musics => {
        const seen = new Map<string, number[]>()
        for (let i = 0; i < musics.length; i++) {
          const m = musics[i]
          const key = `${m.name}|${m.singer}`
          if (!seen.has(key)) seen.set(key, [i])
          else seen.get(key)!.push(i)
        }
        const result: DuplicateGroup[] = []
        for (const [, indices] of seen) {
          if (indices.length > 1) {
            result.push({
              target: musics[indices[0]],
              duplicates: indices.slice(1).map(i => musics[i]),
            })
          }
        }
        if (!visible) {
          setVisible(true)
          requestAnimationFrame(() => {
            setGroups(result)
            popupRef.current?.setVisible(true)
          })
        } else {
          setGroups(result)
          popupRef.current?.setVisible(true)
        }
      })
    },
  }))

  const handleMerge = useCallback((group: DuplicateGroup) => {
    const listId = listState.activeListId
    const ids = group.duplicates.map(m => m.id)
    void removeListMusics(listId, ids).then(() => {
      toast(t('duplicate_music_merge'))
      setGroups(prev => prev.filter(g => g !== group))
    })
  }, [t])

  if (!visible) return null

  return (
    <Popup ref={popupRef} title={t('duplicate_music_title')}>
      <ScrollView style={styles.container}>
        {groups.length === 0 ? (
          <Text style={styles.emptyText}>{t('duplicate_music_no_duplicates')}</Text>
        ) : (
          <Text style={styles.summary}>{t('duplicate_music_found', { count: groups.reduce((s, g) => s + g.duplicates.length, 0) })}</Text>
        )}
        {groups.map((group, idx) => (
          <View key={idx} style={styles.group}>
            <View style={styles.groupInfo}>
              <Text style={styles.songName} numberOfLines={1}>{group.target.name}</Text>
              <Text style={styles.singer} numberOfLines={1}>{group.target.singer}</Text>
              <Text style={styles.count}>+{group.duplicates.length}</Text>
            </View>
            <TouchableOpacity style={styles.mergeBtn} onPress={() => handleMerge(group)}>
              <Text style={{ color: theme['c-primary'], fontSize: 13 }}>{t('duplicate_music_merge')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </Popup>
  )
})

const styles = createStyle({
  container: {
    maxHeight: 400,
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 14,
    color: '#999',
  },
  summary: {
    fontSize: 13,
    marginBottom: 10,
    color: '#999',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  songName: {
    flex: 2,
    fontSize: 14,
  },
  singer: {
    flex: 1,
    fontSize: 12,
    color: '#999',
  },
  count: {
    fontSize: 12,
    color: '#ff4444',
    marginLeft: 8,
  },
  mergeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
})
