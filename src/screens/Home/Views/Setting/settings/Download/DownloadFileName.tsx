import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type FileNameMode = LX.AppSetting['download.fileName']

const setFileName = (mode: FileNameMode) => {
  updateSetting({ 'download.fileName': mode })
}

const useActive = (mode: FileNameMode) => {
  const fileName = useSettingValue('download.fileName')
  const isActive = useMemo(() => fileName == mode, [fileName, mode])
  return isActive
}

const Item = ({ id, name }: { id: FileNameMode, name: string }) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setFileName(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      { id: '歌名 - 歌手' as const, name: t('setting_download_file_name_1') },
      { id: '歌手 - 歌名' as const, name: t('setting_download_file_name_2') },
      { id: '歌名' as const, name: t('setting_download_file_name_3') },
    ]
  }, [t])

  return (
    <SubTitle title={t('setting_download_file_name')}>
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
