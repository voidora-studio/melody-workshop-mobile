import { memo } from 'react'

import Section from '../../components/Section'
import AddMusicLocationType from './AddMusicLocationType'
import IsClickPlayList from './IsClickPlayList'
import IsShowAlbumName from './IsShowAlbumName'
import IsShowInterval from './IsShowInterval'
import IsShowSource from './IsShowSource'
import IsSaveScrollLocation from './IsSaveScrollLocation'
import ActionButtonsVisible from './ActionButtonsVisible'

import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_list')}>
      <IsClickPlayList />
      <IsShowAlbumName />
      <IsShowInterval />
      <IsShowSource />
      <IsSaveScrollLocation />
      <ActionButtonsVisible />
      <AddMusicLocationType />
    </Section>
  )
})
