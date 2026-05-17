import { memo, useCallback } from 'react'
import { View } from 'react-native'
import InputItem from '../../components/InputItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('network.proxy.enable')
  const host = useSettingValue('network.proxy.host')

  const setHost = useCallback((value: string, callback: (value: string) => void) => {
    callback(value)
    if (host === value) return
    updateSetting({ 'network.proxy.host': value })
  }, [host])

  if (!enabled) return null

  return (
    <View style={styles.inputContent}>
      <InputItem
        value={host}
        label={t('setting_network_proxy_host')}
        onChanged={setHost}
        placeholder="127.0.0.1"
      />
    </View>
  )
})

const styles = createStyle({
  inputContent: {
    marginTop: 8,
  },
})
