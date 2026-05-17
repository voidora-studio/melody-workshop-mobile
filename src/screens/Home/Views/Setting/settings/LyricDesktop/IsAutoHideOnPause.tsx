import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const value = useSettingValue('desktopLyric.autoHideOnPause')
  const onChange = (check: boolean) => {
    updateSetting({ 'desktopLyric.autoHideOnPause': check })
  }

  return (
    <CheckBoxItem check={value} label={t('setting_lyric_desktop_auto_hide_on_pause')} onChange={onChange} />
  )
})
