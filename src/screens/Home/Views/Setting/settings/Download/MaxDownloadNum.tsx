import { memo, useCallback } from 'react'
import { View } from 'react-native'
import InputItem from '../../components/InputItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const maxDownloadNum = useSettingValue('download.maxDownloadNum')

  const setMaxDownloadNum = useCallback((value: string, callback: (value: string) => void) => {
    const num = value.replace(/\D/g, '')
    const n = parseInt(num, 10)
    const clamped = isNaN(n) || n < 1 ? '1' : n > 5 ? '5' : String(n)
    callback(clamped)
    if (maxDownloadNum === clamped) return
    updateSetting({ 'download.maxDownloadNum': clamped })
  }, [maxDownloadNum])

  return (
    <View style={styles.inputContent}>
      <InputItem
        value={maxDownloadNum}
        label={t('setting_download_max_download_num')}
        onChanged={setMaxDownloadNum}
        placeholder="1-5"
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
