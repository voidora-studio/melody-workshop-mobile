import { memo, useCallback, useRef } from 'react'
import { View, TextInput } from 'react-native'

import SubTitle from '../../components/SubTitle'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { updateSetting } from '@/core/common'


export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const fontFamily = useSettingValue('desktopLyric.fontFamily')
  const inputRef = useRef<TextInput>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleChangeText = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      updateSetting({ 'desktopLyric.fontFamily': text })
    }, 500)
  }, [])

  return (
    <SubTitle title={t('setting_lyric_desktop_font_family')}>
      <View style={styles.content}>
        <TextInput
          ref={inputRef}
          defaultValue={fontFamily}
          onChangeText={handleChangeText}
          placeholder={t('setting_lyric_desktop_font_family_placeholder')}
          style={[styles.input, { color: theme['c-font'], borderColor: theme['c-border-background'] }]}
        />
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 14,
  },
})
