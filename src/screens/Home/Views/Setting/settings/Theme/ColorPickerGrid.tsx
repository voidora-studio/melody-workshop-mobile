import { memo, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'

const PRESET_COLORS = [
  { name: '翡翠绿', color: 'rgb(77, 175, 124)' },
  { name: '清新绿', color: 'rgb(46, 204, 113)' },
  { name: '天空蓝', color: 'rgb(52, 152, 219)' },
  { name: '深海蓝', color: 'rgb(41, 128, 185)' },
  { name: '蛋雅蓝', color: 'rgb(77, 131, 175)' },
  { name: '靛青', color: 'rgb(79, 98, 208)' },
  { name: '紫色', color: 'rgb(155, 89, 182)' },
  { name: '粉色', color: 'rgb(241, 130, 141)' },
  { name: '红色', color: 'rgb(214, 69, 65)' },
  { name: '橙黄', color: 'rgb(245, 171, 53)' },
  { name: '橙色', color: 'rgb(230, 126, 34)' },
  { name: '棕色', color: 'rgb(188, 128, 68)' },
  { name: '灰色', color: 'rgb(108, 122, 137)' },
  { name: '青色', color: 'rgb(51, 110, 123)' },
  { name: '深灰', color: 'rgb(47, 47, 47)' },
  { name: '暗红', color: 'rgb(192, 57, 43)' },
]

const ColorSwatch = memo(({ color, isSelected, onSelect }: {
  color: string
  isSelected: boolean
  onSelect: () => void
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        ...styles.swatch,
        backgroundColor: color,
        borderColor: isSelected ? theme['c-primary-font'] : 'transparent',
        borderWidth: isSelected ? 2.5 : 0,
      }}
    />
  )
})

export default memo(({ value, onChange }: {
  value: string
  onChange: (color: string) => void
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {PRESET_COLORS.map(c => (
          <View key={c.color} style={styles.swatchWrapper}>
            <ColorSwatch color={c.color} isSelected={value === c.color} onSelect={() => onChange(c.color)} />
            <Text style={styles.swatchName}>{c.name}</Text>
          </View>
        ))}
      </View>
      <View style={{ ...styles.preview, backgroundColor: value }}>
        <Text style={{ ...styles.previewText, color: value === 'rgb(47, 47, 47)' ? '#fff' : '#333' }}>{value}</Text>
      </View>
    </View>
  )
})

const SWATCH_SIZE = 36
const styles = createStyle({
  container: {
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  swatchWrapper: {
    alignItems: 'center',
    width: SWATCH_SIZE + 8,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
  },
  swatchName: {
    fontSize: 9,
    marginTop: 3,
    textAlign: 'center',
  },
  preview: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
})
