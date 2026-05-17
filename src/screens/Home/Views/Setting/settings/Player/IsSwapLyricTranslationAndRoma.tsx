import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const swapLyric = useSettingValue('player.isSwapLyricTranslationAndRoma')
  const setSwapLyric = (check: boolean) => {
    updateSetting({ 'player.isSwapLyricTranslationAndRoma': check })
  }

  return (
    <CheckBoxItem check={swapLyric} label={t('setting_player_swap_lyric_translation_and_roma')} onChange={setSwapLyric} />
  )
})
