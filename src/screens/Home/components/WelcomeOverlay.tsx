import { memo, useEffect, useRef, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

const { width } = Dimensions.get('window')

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const isShowWelcome = useSettingValue('common.isShowWelcome')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isShowWelcome && !visible) {
      setVisible(true)
    }
  }, [isShowWelcome, visible])

  const handleDismiss = () => {
    updateSetting({ 'common.isShowWelcome': true })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: theme['c-app-background'], shadowColor: theme['c-100'] }]}>
        <Text style={styles.title}>{t('welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('welcome_subtitle')}</Text>
        <View style={styles.features}>
          <Text style={styles.featureText}>• 支持多音源搜索与播放</Text>
          <Text style={styles.featureText}>• 歌单管理、收藏与下载</Text>
          <Text style={styles.featureText}>• 多设备数据同步</Text>
          <Text style={styles.featureText}>• 桌面歌词与蓝牙歌词</Text>
          <Text style={styles.featureText}>• 个性化主题与设置</Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-primary-background'] }]} onPress={handleDismiss}>
          <Text style={[styles.btnText, { color: theme['c-primary-font'] }]}>{t('welcome_get_started')}</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>旋律工坊 · 用心听音乐</Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    width: width * 0.8,
    maxWidth: 360,
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 26,
    paddingLeft: 8,
  },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  btnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 12,
    opacity: 0.5,
  },
})
