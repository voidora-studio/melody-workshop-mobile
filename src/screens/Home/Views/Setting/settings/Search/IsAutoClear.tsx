import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isAutoClear = useSettingValue('search.isAutoClear')
  const handleUpdate = (isAutoClear: boolean) => {
    updateSetting({ 'search.isAutoClear': isAutoClear })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isAutoClear} onChange={handleUpdate} label={t('setting_search_is_auto_clear')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
