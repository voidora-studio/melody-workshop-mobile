import { memo } from 'react'

import Section from '../../components/Section'
import DownloadFileName from './DownloadFileName'
import MaxDownloadNum from './MaxDownloadNum'
import IsSkipExistFile from './IsSkipExistFile'
import IsDownloadLrc from './IsDownloadLrc'
import IsUseOtherSource from './IsUseOtherSource'
import DownloadQuality from './DownloadQuality'
import SavePath from './SavePath'
import IsGroupByList from './IsGroupByList'
import LyricEncoding from './LyricEncoding'
import IsEmbedCover from './IsEmbedCover'
import IsEmbedLyric from './IsEmbedLyric'
import IsEmbedLyricTranslation from './IsEmbedLyricTranslation'
import IsEmbedLyricRoma from './IsEmbedLyricRoma'
import IsEmbedLyricLxlrc from './IsEmbedLyricLxlrc'
import IsCompleteNotification from './IsCompleteNotification'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_download')}>
      <DownloadFileName />
      <MaxDownloadNum />
      <IsSkipExistFile />
      <SavePath />
      <IsDownloadLrc />
      <LyricEncoding />
      <IsUseOtherSource />
      <DownloadQuality />
      <IsGroupByList />
      <IsEmbedCover />
      <IsEmbedLyric />
      <IsEmbedLyricTranslation />
      <IsEmbedLyricRoma />
      <IsEmbedLyricLxlrc />
      <IsCompleteNotification />
    </Section>
  )
})
