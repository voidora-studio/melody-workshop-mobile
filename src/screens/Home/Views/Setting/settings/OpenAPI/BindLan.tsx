import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('openAPI.enable')
  const bindLan = useSettingValue('openAPI.bindLan')
  const setBindLan = (check: boolean) => {
    updateSetting({ 'openAPI.bindLan': check })
  }

  if (!enabled) return null

  return (
    <CheckBoxItem check={bindLan} label={t('setting_open_api_bind_lan')} onChange={setBindLan} />
  )
})
