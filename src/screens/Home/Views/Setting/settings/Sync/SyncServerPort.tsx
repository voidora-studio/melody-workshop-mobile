import { memo, useCallback } from 'react'
import { View } from 'react-native'
import InputItem from '../../components/InputItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const syncMode = useSettingValue('sync.mode')
  const serverPort = useSettingValue('sync.server.port')

  const setServerPort = useCallback((value: string, callback: (value: string) => void) => {
    const port = value.replace(/\D/g, '')
    callback(port)
    if (serverPort === port) return
    updateSetting({ 'sync.server.port': port })
  }, [serverPort])

  if (syncMode !== 'server') return null

  return (
    <View style={styles.inputContent}>
      <InputItem
        value={serverPort}
        label={t('setting_sync_server_port')}
        onChanged={setServerPort}
        placeholder={t('setting_sync_server_port_tip')}
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
