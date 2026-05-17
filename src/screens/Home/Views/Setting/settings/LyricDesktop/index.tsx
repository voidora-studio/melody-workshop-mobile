import { memo } from 'react'

import Section from '../../components/Section'
import IsShowLyric from './IsShowLyric'
import IsLockLyric from './IsLockLyric'
import IsShowToggleAnima from './IsShowToggleAnima'
import IsSingleLine from './IsSingleLine'
import TextSize from './TextSize'
import ViewWidth from './ViewWidth'
import MaxLineNum from './MaxLineNum'
import TextOpacity from './TextOpacity'
import TextPositionX from './TextPositionX'
import TextPositionY from './TextPositionY'
import { useI18n } from '@/lang'
import Theme from './Theme'
import IsZoomActiveLine from './IsZoomActiveLine'
import IsAutoHideOnPause from './IsAutoHideOnPause'
import IsEllipsisMode from './IsEllipsisMode'
import LineGap from './LineGap'
import FontWeight from './FontWeight'
import FontFamily from './FontFamily'
import Direction from './Direction'
import ScrollAlign from './ScrollAlign'
import TextAlign from './TextAlign'
// import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_lyric_desktop')}>
      <IsShowLyric />
      <IsLockLyric />
      <IsShowToggleAnima />
      <IsSingleLine />
      <Theme />
      <TextSize />
      <ViewWidth />
      <MaxLineNum />
      <TextOpacity />
      <TextPositionX />
      <TextPositionY />
      <LineGap />
      <IsZoomActiveLine />
      <FontWeight />
      <FontFamily />
      <Direction />
      <ScrollAlign />
      <TextAlign />
      <IsEllipsisMode />
      <IsAutoHideOnPause />
    </Section>
  )
})
