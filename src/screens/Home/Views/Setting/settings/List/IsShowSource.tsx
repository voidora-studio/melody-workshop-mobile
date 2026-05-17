import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowSource = useSettingValue('list.isShowSource')
  const handleUpdate = (isShowSource: boolean) => {
    updateSetting({ 'list.isShowSource': isShowSource })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowSource} onChange={handleUpdate} label={t('setting_list_show_source')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
