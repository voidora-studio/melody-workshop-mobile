import { memo, useRef } from 'react'
import { TouchableOpacity } from 'react-native'

import Section from '../../components/Section'
import Theme from './Theme'
import IsAutoTheme from './IsAutoTheme'
import IsHideBgDark from './IsHideBgDark'
import IsDynamicBg from './IsDynamicBg'
import IsFontShadow from './IsFontShadow'
import ThemeEditor, { type ThemeEditorType } from './ThemeEditor'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
// import { useI18n } from '@/lang/i18n'

export default memo(() => {
  const themeEditorRef = useRef<ThemeEditorType>(null)
  const theme = useTheme()

  return (
    <>
      <Section title="主题编辑器">
        <TouchableOpacity
          onPress={() => themeEditorRef.current?.show()}
          style={{ ...styles.editorBtn, borderColor: theme['c-primary-light-300-alpha-800'], backgroundColor: theme['c-primary-background-hover'] }}
        >
          <Text style={{ color: theme['c-primary-font'] }}>打开主题编辑器</Text>
        </TouchableOpacity>
      </Section>
      <Theme />
      <IsAutoTheme />
      <IsHideBgDark />
      <IsDynamicBg />
      <IsFontShadow />
      <ThemeEditor ref={themeEditorRef} />
    </>
  )
})

const styles = createStyle({
  editorBtn: {
    marginLeft: 15,
    marginRight: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
})
