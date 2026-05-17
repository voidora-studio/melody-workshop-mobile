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
  const maxSsnapshotNum = useSettingValue('sync.server.maxSsnapshotNum')

  const setMaxSsnapshotNum = useCallback((value: string, callback: (value: string) => void) => {
    const num = value.replace(/\D/g, '')
    const n = parseInt(num, 10)
    const clamped = isNaN(n) || n < 1 ? '1' : String(n)
    callback(clamped)
    if (maxSsnapshotNum === clamped) return
    updateSetting({ 'sync.server.maxSsnapshotNum': clamped })
  }, [maxSsnapshotNum])

  if (syncMode !== 'server') return null

  return (
    <View style={styles.inputContent}>
      <InputItem
        value={maxSsnapshotNum}
        label={t('setting_sync_max_snapshot_num')}
        onChanged={setMaxSsnapshotNum}
        placeholder="10"
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
