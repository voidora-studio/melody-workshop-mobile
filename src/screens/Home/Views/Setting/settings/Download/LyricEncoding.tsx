import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type Encoding = LX.AppSetting['download.lyricEncoding']

const setEncoding = (mode: Encoding) => {
  updateSetting({ 'download.lyricEncoding': mode })
}

const useActive = (mode: Encoding) => {
  const encoding = useSettingValue('download.lyricEncoding')
  const isActive = useMemo(() => encoding == mode, [encoding, mode])
  return isActive
}

const Item = ({ id, name }: { id: Encoding, name: string }) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setEncoding(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      { id: 'utf-8' as Encoding, name: 'UTF-8' },
      { id: 'gbk' as Encoding, name: 'GBK' },
    ]
  }, [])

  return (
    <SubTitle title={t('setting_download_lyric_encoding')}>
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
