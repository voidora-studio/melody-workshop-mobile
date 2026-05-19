import { memo, useRef } from 'react'
import { View } from 'react-native'
import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import Text from '@/components/common/Text'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { externalStorageDirectoryPath } from '@/utils/fs'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const savePath = useSettingValue('download.savePath')
  const choosePathRef = useRef<ChoosePathType>(null)
  const defaultPath = `${externalStorageDirectoryPath}/Download/MelodyWorkshop`
  const displayPath = savePath || defaultPath

  const handleChangePath = () => {
    choosePathRef.current?.show({
      title: t('setting_download_save_path'),
      isPersist: true,
      dirOnly: true,
    })
  }

  const handleConfirmPath = (path: string) => {
    updateSetting({ 'download.savePath': path })
  }

  const handleReset = () => {
    updateSetting({ 'download.savePath': '' })
  }

  return (
    <SubTitle title={t('setting_download_save_path')}>
      <View style={styles.container}>
        <Text size={12} style={styles.path}>{displayPath}</Text>
        <View style={styles.buttons}>
          <Button onPress={handleChangePath}>{t('setting_download_save_path_browse')}</Button>
          {savePath ? <View style={styles.btnSpacing}><Button onPress={handleReset}>{t('setting_download_save_path_reset')}</Button></View> : null}
        </View>
      </View>
      <ChoosePath ref={choosePathRef} onConfirm={handleConfirmPath} />
    </SubTitle>
  )
})

const styles = createStyle({
  container: {
    paddingLeft: 25,
    marginBottom: 15,
  },
  path: {
    marginBottom: 6,
    opacity: 0.7,
  },
  buttons: {
    flexDirection: 'row',
  },
  btnSpacing: {
    marginLeft: 8,
  },
})
