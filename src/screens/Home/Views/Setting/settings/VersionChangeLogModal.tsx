import { forwardRef, useImperativeHandle, useState, useRef } from 'react'
import { View, ScrollView } from 'react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'

export interface ChangeLogModalType {
  show: () => void
}

const changeLogs = [
  {
    version: 'v1.0.0',
    date: '2026-05',
    items: [
      '旋律工坊移动版初始发布',
      '基于 LX Music Mobile 重构',
      '全新 Melody Workshop 主题包',
      '优化逐字歌词动画与显示',
      '优化播放体验',
    ],
  },
]

export default forwardRef<ChangeLogModalType>((_props, ref) => {
  const t = useI18n()
  const popupRef = useRef<PopupType>(null)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show() {
      if (!visible) {
        setVisible(true)
        requestAnimationFrame(() => {
          popupRef.current?.setVisible(true)
        })
      } else {
        popupRef.current?.setVisible(true)
      }
    },
  }))

  if (!visible) return null

  return (
    <Popup ref={popupRef} title={t('changelog_title')}>
      <ScrollView style={styles.container}>
        {changeLogs.map((log, idx) => (
          <View key={idx} style={styles.versionBlock}>
            <View style={styles.versionHeader}>
              <Text style={styles.versionText}>{log.version}</Text>
              <Text style={styles.dateText}>{log.date}</Text>
            </View>
            {log.items.map((item, i) => (
              <Text key={i} style={styles.itemText}>• {item}</Text>
            ))}
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
  versionBlock: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  versionText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  itemText: {
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 4,
  },
})
