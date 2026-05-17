import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isDownloadLrc = useSettingValue('download.isDownloadLrc')
  const setIsDownloadLrc = (check: boolean) => {
    updateSetting({ 'download.isDownloadLrc': check })
  }

  return (
    <CheckBoxItem check={isDownloadLrc} label={t('setting_download_is_download_lrc')} onChange={setIsDownloadLrc} />
  )
})
