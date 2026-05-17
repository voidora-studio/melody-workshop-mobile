import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const value = useSettingValue('download.embedCover')
  const onChange = (check: boolean) => {
    updateSetting({ 'download.embedCover': check })
  }

  return (
    <CheckBoxItem check={value} label={t('setting_download_embed_cover')} onChange={onChange} />
  )
})
