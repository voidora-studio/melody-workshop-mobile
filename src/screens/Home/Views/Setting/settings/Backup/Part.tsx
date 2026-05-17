import { memo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { useI18n } from '@/lang'
import ListImportExport, { type ListImportExportType } from './ListImportExport'
import DataImportExport, { type DataImportExportType } from './DataImportExport'


export default memo(() => {
  const t = useI18n()
  const listImportExportRef = useRef<ListImportExportType>(null)
  const dataImportExportRef = useRef<DataImportExportType>(null)

  return (
    <>
      <SubTitle title={t('setting_backup_part')}>
        <View style={styles.list}>
          <Button onPress={() => listImportExportRef.current?.import()}>{t('setting_backup_part_import_list')}</Button>
          <Button onPress={() => listImportExportRef.current?.export()}>{t('setting_backup_part_export_list')}</Button>
          <Button onPress={() => dataImportExportRef.current?.import('setting')}>{t('setting_backup_part_import_setting')}</Button>
          <Button onPress={() => dataImportExportRef.current?.export('setting')}>{t('setting_backup_part_export_setting')}</Button>
        </View>
      </SubTitle>
      <SubTitle title={t('setting_backup_all')}>
        <View style={styles.list}>
          <Button onPress={() => dataImportExportRef.current?.import('all')}>{t('setting_backup_all_import')}</Button>
          <Button onPress={() => dataImportExportRef.current?.export('all')}>{t('setting_backup_all_export')}</Button>
        </View>
      </SubTitle>
      <ListImportExport ref={listImportExportRef} />
      <DataImportExport ref={dataImportExportRef} />
    </>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
  },
})
