import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const randomAnimate = useSettingValue('common.randomAnimate')
  const setRandomAnimate = (check: boolean) => {
    updateSetting({ 'common.randomAnimate': check })
  }

  return (
    <CheckBoxItem check={randomAnimate} label={t('setting_basic_random_animate')} onChange={setRandomAnimate} />
  )
})
