import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { FILE_EXT_RXP } from '@/config/constant'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { handleExportSetting, handleImportSetting, handleExportAllData, handleImportAllData } from './actions'

export interface ExportType {
  action: 'import' | 'export'
  dataType: 'setting' | 'all'
}
const initExportInfo: ExportType = { action: 'import', dataType: 'setting' }

export interface DataImportExportType {
  import: (dataType: 'setting' | 'all') => void
  export: (dataType: 'setting' | 'all') => void
}

export default forwardRef<DataImportExportType, {}>((_props, ref) => {
  const [visible, setVisible] = useState(false)
  const choosePathRef = useRef<ChoosePathType>(null)
  const exportInfoRef = useRef<ExportType>({ ...initExportInfo })

  const showChooser = (action: 'import' | 'export', dataType: 'setting' | 'all') => {
    exportInfoRef.current = { action, dataType }
    const title = action === 'import'
      ? (dataType === 'setting' ? global.i18n.t('setting_backup_part_import_setting_desc') : global.i18n.t('setting_backup_all_import_desc'))
      : (dataType === 'setting' ? global.i18n.t('setting_backup_part_export_setting_desc') : global.i18n.t('setting_backup_all_export_desc'))
    const dirOnly = action === 'export'
    const filter = action === 'import' ? FILE_EXT_RXP : undefined

    const show = () => {
      choosePathRef.current?.show({
        title,
        dirOnly,
        filter,
      })
    }

    if (visible) {
      show()
    } else {
      setVisible(true)
      requestAnimationFrame(() => {
        show()
      })
    }
  }

  useImperativeHandle(ref, () => ({
    import(dataType: 'setting' | 'all') {
      showChooser('import', dataType)
    },
    export(dataType: 'setting' | 'all') {
      showChooser('export', dataType)
    },
  }))

  const onConfirmPath = (path: string) => {
    const { action, dataType } = exportInfoRef.current
    if (dataType === 'setting') {
      if (action === 'import') {
        handleImportSetting(path)
      } else {
        void handleExportSetting(path)
      }
    } else {
      if (action === 'import') {
        handleImportAllData(path)
      } else {
        void handleExportAllData(path)
      }
    }
  }

  return (
    visible
      ? <ChoosePath ref={choosePathRef} onConfirm={onConfirmPath} />
      : null
  )
})
