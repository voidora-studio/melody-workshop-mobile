import { memo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { toast, confirmDialog } from '@/utils/tools'
import { useI18n } from '@/lang'
import { clearListMusics, removeUserList } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'

export default memo(() => {
  const t = useI18n()
  const [clearing, setClearing] = useState(false)

  const handleClearList = () => {
    void confirmDialog({
      message: t('setting_other_clear_all_list_confirm'),
      confirmButtonText: t('list_remove_tip_button'),
    }).then(confirm => {
      if (!confirm) return
      setClearing(true)
      const userListIds = listState.userList.map(l => l.id)
      Promise.all([
        clearListMusics([LIST_IDS.DEFAULT, LIST_IDS.LOVE, ...userListIds]),
        userListIds.length ? removeUserList(userListIds) : Promise.resolve(),
      ]).then(() => {
        toast(t('setting_other_clear_all_list_success_tip'))
      }).finally(() => {
        setClearing(false)
      })
    })
  }

  return (
    <>
      <SubTitle title={t('setting_other_clear_all_list_btn')}>
        <View style={styles.clearBtn}>
          <Button disabled={clearing} onPress={handleClearList}>{t('setting_other_clear_all_list_btn')}</Button>
        </View>
      </SubTitle>
    </>
  )
})

const styles = StyleSheet.create({
  clearBtn: {
    flexDirection: 'row',
  },
})
