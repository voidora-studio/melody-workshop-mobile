import { memo, useCallback } from 'react'
import { View } from 'react-native'
import InputItem from '../components/InputItem'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const mirrorUrl = useSettingValue('version.githubMirror')

  const setMirrorUrl = useCallback((value: string, callback: (value: string) => void) => {
    callback(value)
    if (mirrorUrl === value) return
    updateSetting({ 'version.githubMirror': value })
  }, [mirrorUrl])

  return (
    <View style={styles.container}>
      <Text style={styles.desc} size={12}>{t('version_mirror_desc')}</Text>
      <InputItem
        value={mirrorUrl}
        label={t('version_mirror')}
        onChanged={setMirrorUrl}
        placeholder={t('version_mirror_placeholder')}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    marginTop: 16,
    paddingLeft: 5,
  },
  desc: {
    opacity: 0.6,
    paddingHorizontal: 25,
    marginBottom: 8,
    lineHeight: 18,
  },
})
