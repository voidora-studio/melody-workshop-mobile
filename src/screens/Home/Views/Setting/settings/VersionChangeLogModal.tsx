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
    version: 'v1.2.2',
    date: '2026-05',
    items: [
      '歌词精度全面对齐桌面版',
      '修复逐字歌词填充动画卡顿与文字竖排重叠问题',
      '修复间奏时间被前一句歌词错误占用的问题',
      '修复 lxlyric 逐字模式下翻译/罗马音不显示的问题',
      '修复播放进度偏移，消除 AudioTrack 缓冲导致的输出延迟偏差',
      '修复暂停后进度条拖拽不同步的问题',
      '重构逐字歌词填充动画引擎，采用像素级裁剪方案',
      '新增 JSI 同步时间桥接，60fps 实时读取播放位置',
      '填充动画算法与桌面版 background-size 裁剪逻辑完全对齐',
    ],
  },
  {
    version: 'v1.1.1',
    date: '2026-05',
    items: [
      '修复逐字歌词动画颜色错误与卡顿问题',
      '优化逐字歌词动画性能，使用基于播放进度的 RAF 循环',
      '优化歌词滚动，修复已播放行卡住遮挡下一行的问题',
      '桌面歌词支持多行上下文显示',
      '修复下载文件保存到不可见目录的问题',
      '修复旧版更新公告弹窗',
    ],
  },
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
