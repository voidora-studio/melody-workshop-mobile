import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const actionButtonsVisible = useSettingValue('list.actionButtonsVisible')
  const setActionButtonsVisible = (check: boolean) => {
    updateSetting({ 'list.actionButtonsVisible': check })
  }

  return (
    <CheckBoxItem check={actionButtonsVisible} label={t('setting_list_action_buttons_visible')} onChange={setActionButtonsVisible} />
  )
})
