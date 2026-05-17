import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type Direction = LX.AppSetting['desktopLyric.direction']

const setValue = (mode: Direction) => {
  updateSetting({ 'desktopLyric.direction': mode })
}

const useActive = (mode: Direction) => {
  const value = useSettingValue('desktopLyric.direction')
  const isActive = useMemo(() => value == mode, [value, mode])
  return isActive
}

const Item = ({ id, name }: { id: Direction, name: string }) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setValue(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      { id: 'horizontal' as Direction, name: t('setting_lyric_desktop_direction_horizontal') },
      { id: 'vertical' as Direction, name: t('setting_lyric_desktop_direction_vertical') },
    ]
  }, [t])

  return (
    <SubTitle title={t('setting_lyric_desktop_direction')}>
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
