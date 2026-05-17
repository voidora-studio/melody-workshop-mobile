import { memo } from 'react'

import Section from '../../components/Section'
import IsShowHotSearch from './IsShowHotSearch'
import IsShowHistorySearch from './IsShowHistorySearch'
import IsAutoClear from './IsAutoClear'
import OdcIsAutoClearSearchInput from './OdcIsAutoClearSearchInput'
import OdcIsAutoClearSearchList from './OdcIsAutoClearSearchList'
import IsFocusSearchBox from './IsFocusSearchBox'

import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_search')}>
      <IsShowHotSearch />
      <IsShowHistorySearch />
      <IsAutoClear />
      <OdcIsAutoClearSearchInput />
      <OdcIsAutoClearSearchList />
      <IsFocusSearchBox />
    </Section>
  )
})
