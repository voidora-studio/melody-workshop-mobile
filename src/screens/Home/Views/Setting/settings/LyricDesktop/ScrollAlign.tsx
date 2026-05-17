import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type Align = LX.AppSetting['desktopLyric.scrollAlign']

const setValue = (mode: Align) => {
  updateSetting({ 'desktopLyric.scrollAlign': mode })
}

const useActive = (mode: Align) => {
  const value = useSettingValue('desktopLyric.scrollAlign')
  const isActive = useMemo(() => value == mode, [value, mode])
  return isActive
}

const Item = ({ id, name }: { id: Align, name: string }) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setValue(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      { id: 'top' as Align, name: 'Top' },
      { id: 'center' as Align, name: 'Center' },
    ]
  }, [])

  return (
    <SubTitle title={t('setting_lyric_desktop_scroll_align')}>
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
