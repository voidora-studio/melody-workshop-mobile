import { useRef, forwardRef, useImperativeHandle, useState, useCallback, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native'
import Modal, { type ModalType } from '@/components/common/Modal'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import ColorPickerGrid from './ColorPickerGrid'
import { getAllThemes, saveTheme, removeTheme, BG_IMAGES } from '@/theme/themes'
import { buildActiveThemeColors } from '@/theme/themes'
import themeActions from '@/store/theme/action'
import settingState from '@/store/setting/state'
import { updateSetting } from '@/core/common'

export interface ThemeEditorType {
  show: () => void
}

const { createThemeColors } = require('@/theme/themes/utils')

const FONT_COLORS = [
  { name: '深色', color: 'rgb(33, 33, 33)' },
  { name: '浅色', color: 'rgb(229, 229, 229)' },
  { name: '白色', color: 'rgb(255, 255, 255)' },
]

const BG_OPTIONS: Array<{ name: string; key: string }> = [
  { name: '无背景', key: '' },
  { name: '水墨', key: 'china_ink.jpg' },
  { name: '月夜', key: 'landingMoon.png' },
  { name: '极光', key: 'jqbg.jpg' },
  { name: '木叶', key: 'myzcbg.jpg' },
  { name: '新年', key: 'xnkl.png' },
]

const MELODY_PRESETS = [
  {
    id: 'melody_spring',
    name: '旋律之春',
    primary: 'rgb(120, 200, 155)',
    font: 'rgb(33, 33, 33)',
    isDark: false,
    desc: '清新明亮的绿色主题',
  },
  {
    id: 'melody_sunset',
    name: '旋律落日',
    primary: 'rgb(235, 150, 80)',
    font: 'rgb(33, 33, 33)',
    isDark: false,
    desc: '温暖橙黄的黄昏色调',
  },
  {
    id: 'melody_midnight',
    name: '旋律午夜',
    primary: 'rgb(100, 120, 180)',
    font: 'rgb(229, 229, 229)',
    isDark: true,
    desc: '深邃宁静的暗色主题',
  },
  {
    id: 'melody_cherry',
    name: '旋律樱花',
    primary: 'rgb(235, 150, 170)',
    font: 'rgb(33, 33, 33)',
    isDark: false,
    desc: '粉嫩温柔的樱花色调',
  },
]

export default forwardRef<ThemeEditorType>((_, ref) => {
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)
  const [primaryColor, setPrimaryColor] = useState('rgb(77, 175, 124)')
  const [fontColor, setFontColor] = useState('rgb(33, 33, 33)')
  const [isDark, setIsDark] = useState(false)
  const [themeName, setThemeName] = useState('')
  const [bgImage, setBgImage] = useState('')
  const [customThemes, setCustomThemes] = useState<LX.Theme[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'presets' | 'saved'>('editor')

  useImperativeHandle(ref, () => ({
    show() {
      modalRef.current?.setVisible(true)
      void loadCustomThemes()
    },
  }))

  const loadCustomThemes = async () => {
    const themes = await getAllThemes()
    setCustomThemes(themes.userThemes)
  }

  const handleCreateTheme = useCallback(async () => {
    if (!themeName.trim()) {
      toast('请输入主题名称')
      return
    }

    const id = `custom_${Date.now()}`
    const themeColors = createThemeColors(primaryColor, fontColor, isDark)
    const newTheme: LX.Theme = {
      id,
      name: themeName.trim(),
      isDark,
      isCustom: true,
      config: {
        themeColors,
        extInfo: {
          'c-app-background': isDark ? 'rgba(0, 0, 0, 0)' : 'var(c-primary-light-600-alpha-700)',
          'c-main-background': isDark ? 'rgba(19, 19, 19, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          'bg-image': bgImage,
          'bg-image-position': 'center',
          'bg-image-size': 'cover',
          'c-badge-primary': 'var(c-primary)',
          'c-badge-secondary': isDark ? 'var(c-primary)' : '#4baed5',
          'c-badge-tertiary': isDark ? 'var(c-primary-dark-300)' : '#e7aa36',
        },
      },
    }

    await saveTheme(newTheme)
    toast(`主题「${themeName.trim()}」已保存`)
    setThemeName('')
    setBgImage('')
    void loadCustomThemes()
  }, [themeName, primaryColor, fontColor, isDark, bgImage])

  const handleApplyTheme = useCallback(async (appliedTheme: LX.Theme) => {
    await updateSetting({ 'theme.id': appliedTheme.id })
    themeActions.setTheme(appliedTheme)
    toast(`已应用主题「${appliedTheme.name}」`)
  }, [])

  const handleDeleteTheme = useCallback(async (id: string) => {
    await removeTheme(id)
    void loadCustomThemes()
    toast('主题已删除')
  }, [])

  const handleApplyPreset = useCallback(async (preset: typeof MELODY_PRESETS[number]) => {
    const themeColors = createThemeColors(preset.primary, preset.font, preset.isDark)
    const newTheme: LX.Theme = {
      id: preset.id,
      name: preset.name,
      isDark: preset.isDark,
      isCustom: true,
      config: {
        themeColors,
        extInfo: {
          'c-app-background': preset.isDark ? 'rgba(0, 0, 0, 0)' : 'var(c-primary-light-600-alpha-700)',
          'c-main-background': preset.isDark ? 'rgba(19, 19, 19, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          'bg-image': '',
          'bg-image-position': 'center',
          'bg-image-size': 'cover',
          'c-badge-primary': 'var(c-primary)',
          'c-badge-secondary': '#4baed5',
          'c-badge-tertiary': '#e7aa36',
        },
      },
    }
    await saveTheme(newTheme)
    await handleApplyTheme(newTheme)
  }, [handleApplyTheme])

  const tabStyle = (tab: string) => ({
    ...styles.tab,
    backgroundColor: activeTab === tab ? theme['c-primary-background'] : 'transparent',
    borderColor: theme['c-border-background'],
  } as const)
  const tabTextStyle = (tab: string) => ({
    color: activeTab === tab ? theme['c-primary-font'] : theme['c-font'],
    fontSize: 13,
  } as const)

  return (
    <Modal ref={modalRef}>
      <View style={{ ...styles.container, backgroundColor: theme['c-app-background'] }}>
        <Text style={styles.modalTitle}>主题编辑器</Text>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={tabStyle('editor')} onPress={() => setActiveTab('editor')}>
            <Text style={tabTextStyle('editor')}>创建</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tabStyle('presets')} onPress={() => setActiveTab('presets')}>
            <Text style={tabTextStyle('presets')}>旋律工坊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tabStyle('saved')} onPress={() => setActiveTab('saved')}>
            <Text style={tabTextStyle('saved')}>已保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'editor' && (
            <View>
              <View style={styles.section}>
                <Text style={styles.label}>主题名称</Text>
                <TextInput
                  style={{ ...styles.input, color: theme['c-font'], borderColor: theme['c-border-background'], backgroundColor: theme['c-primary-input-background'] }}
                  value={themeName}
                  onChangeText={setThemeName}
                  placeholder="我的自定义主题"
                  placeholderTextColor={theme['c-font-label']}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>主题色</Text>
                <ColorPickerGrid value={primaryColor} onChange={setPrimaryColor} />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>字体颜色</Text>
                <View style={styles.fontRow}>
                  {FONT_COLORS.map(fc => (
                    <TouchableOpacity
                      key={fc.color}
                      onPress={() => setFontColor(fc.color)}
                      style={{
                        ...styles.fontOption,
                        backgroundColor: fc.color,
                        borderColor: fontColor === fc.color ? theme['c-primary-font'] : 'transparent',
                        borderWidth: fontColor === fc.color ? 2.5 : 1,
                        borderStyle: fontColor === fc.color ? 'solid' : 'solid',
                      }}
                    >
                      <Text style={{ color: fc.color === 'rgb(33, 33, 33)' ? '#fff' : '#333', fontSize: 10 }}>{fc.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>模式</Text>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    onPress={() => setIsDark(false)}
                    style={{ ...styles.modeBtn, backgroundColor: !isDark ? theme['c-primary-background'] : 'transparent', borderColor: theme['c-border-background'] }}
                  >
                    <Text style={{ color: !isDark ? theme['c-primary-font'] : theme['c-font'] }}>浅色</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsDark(true)}
                    style={{ ...styles.modeBtn, backgroundColor: isDark ? theme['c-primary-background'] : 'transparent', borderColor: theme['c-border-background'] }}
                  >
                    <Text style={{ color: isDark ? theme['c-primary-font'] : theme['c-font'] }}>深色</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>背景图片</Text>
                <View style={styles.bgRow}>
                  {BG_OPTIONS.map(opt => {
                    const isSelected = bgImage === opt.key
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setBgImage(opt.key)}
                        style={{
                          ...styles.bgOption,
                          borderColor: isSelected ? theme['c-primary-font'] : theme['c-border-background'],
                          backgroundColor: isSelected ? theme['c-primary-background'] : 'transparent',
                        }}
                      >
                        {opt.key && BG_IMAGES[opt.key as keyof typeof BG_IMAGES] ? (
                          <Image source={BG_IMAGES[opt.key as keyof typeof BG_IMAGES]} style={styles.bgThumb} />
                        ) : (
                          <View style={{ ...styles.bgThumb, backgroundColor: theme['c-primary-light-400-alpha-600'], alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16, opacity: 0.4 }}>⊘</Text>
                          </View>
                        )}
                        <Text style={{ fontSize: 10, marginTop: 4 }}>{opt.name}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <Button onPress={handleCreateTheme}>
                <Text>保存主题</Text>
              </Button>
            </View>
          )}

          {activeTab === 'presets' && (
            <View>
              <Text style={styles.sectionDesc}>旋律工坊精选主题包，一键应用</Text>
              {MELODY_PRESETS.map(preset => {
                const presetBg = createThemeColors(preset.primary, preset.font, preset.isDark)['c-primary']
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => handleApplyPreset(preset)}
                    style={{ ...styles.presetCard, borderColor: theme['c-border-background'], backgroundColor: theme['c-primary-background-hover'] }}
                  >
                    <View style={{ ...styles.presetPreview, backgroundColor: preset.primary }}>
                      <View style={[styles.presetDot, { backgroundColor: preset.font }]} />
                    </View>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetDesc}>{preset.desc}</Text>
                    </View>
                    <View style={{ ...styles.presetBadge, backgroundColor: preset.isDark ? '#333' : '#fff' }}>
                      <Text style={{ fontSize: 10, color: preset.isDark ? '#fff' : '#333' }}>{preset.isDark ? '深色' : '浅色'}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {activeTab === 'saved' && (
            <View>
              <Text style={styles.sectionDesc}>已保存的自定义主题 ({customThemes.length}/10)</Text>
              {customThemes.length === 0 ? (
                <Text style={styles.emptyText}>暂无自定义主题</Text>
              ) : (
                customThemes.map(ct => (
                  <View key={ct.id} style={{ ...styles.savedCard, borderColor: theme['c-border-background'] }}>
                    <View style={styles.savedInfo}>
                      <View style={{ ...styles.savedPreview, backgroundColor: ct.config.themeColors['c-primary'] }}>
                        <View style={[styles.presetDot, { backgroundColor: ct.config.themeColors['c-1000'] }]} />
                      </View>
                      <View>
                        <Text style={styles.savedName}>{ct.name}</Text>
                        <Text style={styles.savedMeta}>{ct.isDark ? '深色' : '浅色'} · {ct.id}</Text>
                      </View>
                    </View>
                    <View style={styles.savedActions}>
                      <TouchableOpacity onPress={() => handleApplyTheme(ct)} style={styles.actionBtn}>
                        <Text style={{ color: theme['c-primary-font'], fontSize: 12 }}>应用</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteTheme(ct.id)} style={styles.actionBtn}>
                        <Text style={{ color: '#e74c3c', fontSize: 12 }}>删除</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
})

const styles = createStyle({
  container: {
    padding: 20,
    maxHeight: 520,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  content: {
    maxHeight: 380,
  },
  section: {
    marginBottom: 16,
  },
  sectionDesc: {
    fontSize: 12,
    marginBottom: 12,
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  fontRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fontOption: {
    width: 60,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bgOption: {
    width: 72,
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  bgThumb: {
    width: 56,
    height: 40,
    borderRadius: 6,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  presetPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  presetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetDesc: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  presetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  savedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedName: {
    fontSize: 14,
    fontWeight: '500',
  },
  savedMeta: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  savedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 30,
    fontSize: 13,
  },
})
