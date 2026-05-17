import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import settingState from '@/store/setting/state'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { setVolume } from '@/plugins/player'

export default memo(() => {
  const t = useI18n()
  const isMute = useSettingValue('player.isMute')

  const toggleMute = (muted: boolean) => {
    updateSetting({ 'player.isMute': muted })
    void setVolume(muted ? 0 : settingState.setting['player.volume'])
  }

  return (
    <CheckBoxItem check={isMute} label={t('setting_player_is_mute')} onChange={toggleMute} />
  )
})
