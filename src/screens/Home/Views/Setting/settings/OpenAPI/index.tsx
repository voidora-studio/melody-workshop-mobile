import { memo } from 'react'

import Section from '../../components/Section'
import IsEnable from './IsEnable'
import PortInput from './PortInput'
import BindLan from './BindLan'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_open_api')}>
      <IsEnable />
      <PortInput />
      <BindLan />
    </Section>
  )
})
