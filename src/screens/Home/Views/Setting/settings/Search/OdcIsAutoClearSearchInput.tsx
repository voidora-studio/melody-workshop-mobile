import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isAutoClearInput = useSettingValue('odc.isAutoClearSearchInput')
  const handleUpdate = (isAutoClearInput: boolean) => {
    updateSetting({ 'odc.isAutoClearSearchInput': isAutoClearInput })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isAutoClearInput} onChange={handleUpdate} label={t('setting_search_odc_auto_clear_input')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
