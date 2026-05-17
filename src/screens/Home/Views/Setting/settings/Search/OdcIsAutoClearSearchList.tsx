import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isAutoClearList = useSettingValue('odc.isAutoClearSearchList')
  const handleUpdate = (isAutoClearList: boolean) => {
    updateSetting({ 'odc.isAutoClearSearchList': isAutoClearList })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isAutoClearList} onChange={handleUpdate} label={t('setting_search_odc_auto_clear_list')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
