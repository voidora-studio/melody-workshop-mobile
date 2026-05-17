import { memo } from 'react'

import Section from '../../components/Section'
import IsEnable from './IsEnable'
import HostInput from './HostInput'
import PortInput from './PortInput'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_network_proxy')}>
      <IsEnable />
      <HostInput />
      <PortInput />
    </Section>
  )
})
