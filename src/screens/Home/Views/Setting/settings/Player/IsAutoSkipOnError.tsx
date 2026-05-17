import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const autoSkipOnError = useSettingValue('player.autoSkipOnError')
  const setAutoSkipOnError = (autoSkipOnError: boolean) => {
    updateSetting({ 'player.autoSkipOnError': autoSkipOnError })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={autoSkipOnError} label={t('setting_player_auto_skip_on_error')} onChange={setAutoSkipOnError} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
