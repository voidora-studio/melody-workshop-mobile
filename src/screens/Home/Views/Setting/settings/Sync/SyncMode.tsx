import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type SyncMode = LX.AppSetting['sync.mode']

const setSyncMode = (mode: SyncMode) => {
  updateSetting({ 'sync.mode': mode })
}

const useActive = (mode: SyncMode) => {
  const syncMode = useSettingValue('sync.mode')
  const isActive = useMemo(() => syncMode == mode, [syncMode, mode])
  return isActive
}

const Item = ({ id, name }: { id: SyncMode, name: string }) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setSyncMode(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      { id: 'client' as const, name: t('setting_sync_mode_client') },
      { id: 'server' as const, name: t('setting_sync_mode_server') },
    ]
  }, [t])

  return (
    <SubTitle title={t('setting_sync_mode')}>
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
