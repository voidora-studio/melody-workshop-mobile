import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowAnimation = useSettingValue('common.isShowAnimation')
  const handleUpdate = (isShowAnimation: boolean) => {
    updateSetting({ 'common.isShowAnimation': isShowAnimation })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowAnimation} onChange={handleUpdate} label={t('setting_basic_show_animation')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
