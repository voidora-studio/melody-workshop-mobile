import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isPlayLxlrc = useSettingValue('player.isPlayLxlrc')
  const setIsPlayLxlrc = (check: boolean) => {
    updateSetting({ 'player.isPlayLxlrc': check })
  }

  return (
    <CheckBoxItem check={isPlayLxlrc} label={t('setting_player_is_play_lxlrc')} onChange={setIsPlayLxlrc} />
  )
})
