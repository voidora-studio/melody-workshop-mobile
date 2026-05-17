import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const focusSearchBox = useSettingValue('search.isFocusSearchBox')
  const setFocusSearchBox = (check: boolean) => {
    updateSetting({ 'search.isFocusSearchBox': check })
  }

  return (
    <CheckBoxItem check={focusSearchBox} label={t('setting_search_focus_search_box')} onChange={setFocusSearchBox} />
  )
})
