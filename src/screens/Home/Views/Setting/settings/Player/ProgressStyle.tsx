import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type Style = LX.AppSetting['playDetail.progressStyle']

const setValue = (mode: Style) => {
  updateSetting({ 'playDetail.progressStyle': mode })
}

const useActive = (mode: Style) => {
  const value = useSettingValue('playDetail.progressStyle')
  const isActive = useMemo(() => value == mode, [value, mode])
  return isActive
}

const Item = ({ id, name }: { id: Style, name: string }) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setValue(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      { id: 'mini' as Style, name: t('setting_player_progress_style_mini') },
      { id: 'middle' as Style, name: t('setting_player_progress_style_middle') },
      { id: 'full' as Style, name: t('setting_player_progress_style_full') },
    ]
  }, [t])

  return (
    <SubTitle title={t('setting_player_progress_style')}>
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
