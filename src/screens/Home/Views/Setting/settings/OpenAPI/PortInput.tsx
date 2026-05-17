import { memo, useCallback } from 'react'
import { View } from 'react-native'
import InputItem from '../../components/InputItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('openAPI.enable')
  const port = useSettingValue('openAPI.port')

  const setPort = useCallback((value: string, callback: (value: string) => void) => {
    const portStr = value.replace(/\D/g, '')
    callback(portStr)
    if (port === portStr) return
    updateSetting({ 'openAPI.port': portStr })
  }, [port])

  if (!enabled) return null

  return (
    <View style={styles.inputContent}>
      <InputItem
        value={port}
        label={t('setting_open_api_port')}
        onChanged={setPort}
        placeholder="23330"
        inputMode="numeric"
      />
    </View>
  )
})

const styles = createStyle({
  inputContent: {
    marginTop: 8,
  },
})
