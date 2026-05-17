import { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsEnableAudioOffload from './IsEnableAudioOffload'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowBluetoothLyric from './IsShowBluetoothLyric'
import IsShowBluetoothFullLyric from './IsShowBluetoothFullLyric'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsS2T from './IsS2T'
import IsAutoSkipOnError from './IsAutoSkipOnError'
import IsPlayLxlrc from './IsPlayLxlrc'
import IsSwapLyricTranslationAndRoma from './IsSwapLyricTranslationAndRoma'
import IsMute from './IsMute'
import MaxCache from './MaxCache'
import ProgressStyle from './ProgressStyle'
import { useI18n } from '@/lang'


export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_player')}>
      <IsSavePlayTime />
      <IsAutoCleanPlayedList />
      <IsAutoSkipOnError />
      <IsPlayLxlrc />
      <IsSwapLyricTranslationAndRoma />
      <IsMute />
      <IsHandleAudioFocus />
      <IsEnableAudioOffload />
      <IsShowBluetoothLyric />
      <IsShowBluetoothFullLyric />
      <IsShowNotificationImage />
      <IsShowLyricTranslation />
      <IsShowLyricRoma />
      <IsS2T />
      <MaxCache />
      <PlayHighQuality />
      <ProgressStyle />
    </Section>
  )
})
