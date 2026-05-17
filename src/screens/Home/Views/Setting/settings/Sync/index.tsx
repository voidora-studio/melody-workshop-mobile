import { memo, useState } from 'react'

import Section from '../../components/Section'
import IsEnable from './IsEnable'
import History from './History'
import SyncMode from './SyncMode'
import SyncServerPort from './SyncServerPort'
import SyncMaxSnapshotNum from './SyncMaxSnapshotNum'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  const [host, setHost] = useState('')

  return (
    <Section title={t('setting_sync')}>
      <SyncMode />
      <SyncServerPort />
      <SyncMaxSnapshotNum />
      <IsEnable host={host} setHost={setHost} />
      <History setHost={setHost} />
    </Section>
  )
})
