import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const enable = useSettingValue('network.proxy.enable')
  const setEnable = (check: boolean) => {
    updateSetting({ 'network.proxy.enable': check })
  }

  return (
    <CheckBoxItem check={enable} label={t('setting_network_proxy_enable')} onChange={setEnable} />
  )
})
