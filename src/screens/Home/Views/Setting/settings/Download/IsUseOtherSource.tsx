import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isUseOtherSource = useSettingValue('download.isUseOtherSource')
  const setIsUseOtherSource = (check: boolean) => {
    updateSetting({ 'download.isUseOtherSource': check })
  }

  return (
    <CheckBoxItem check={isUseOtherSource} label={t('setting_download_is_use_other_source')} onChange={setIsUseOtherSource} />
  )
})
