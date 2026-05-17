import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isSaveScrollLocation = useSettingValue('list.isSaveScrollLocation')
  const handleUpdate = (isSaveScrollLocation: boolean) => {
    updateSetting({ 'list.isSaveScrollLocation': isSaveScrollLocation })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isSaveScrollLocation} onChange={handleUpdate} label={t('setting_list_save_scroll_location')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
