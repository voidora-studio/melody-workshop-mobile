import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

const QUALITY_LIST: LX.Quality[] = ['128k', '320k', 'flac', 'ape', 'wav']

const useActive = (id: LX.Quality) => {
  const quality = useSettingValue('download.quality')
  const isActive = useMemo(() => quality == id, [quality, id])
  return isActive
}

const Item = ({ id, name }: { id: LX.Quality, name: string }) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { updateSetting({ 'download.quality': id }) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return QUALITY_LIST.map(q => ({ id: q, name: t(`setting_download_quality_${q}` as any) }))
  }, [t])

  return (
    <SubTitle title={t('setting_download_quality')}>
      <View style={styles.list}>
        {list.map(({ id, name }) => <Item name={name} id={id} key={id} />)}
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
