import { pinyin } from 'pinyin-pro'

/**
 * Convert Chinese text to phoneme representations for forced alignment.
 * Uses pinyin-pro to generate pinyin without tones.
 *
 * Example: "你好世界" → ["ni", "hao", "shi", "jie"]
 * Non-Chinese characters are kept as-is.
 */
export const textToPhonemes = (text: string): string[] => {
  try {
    return pinyin(text, { toneType: 'none', type: 'array' }) as string[]
  } catch {
    // Fallback: identity mapping
    return text.split('')
  }
}

/**
 * Check if a character is a Chinese character (CJK Unified Ideographs).
 */
export const isChinese = (char: string): boolean => {
  const code = char.charCodeAt(0)
  return (code >= 0x4E00 && code <= 0x9FFF)
    || (code >= 0x3400 && code <= 0x4DBF)  // CJK Extension A
    || (code >= 0xF900 && code <= 0xFAFF)  // CJK Compatibility
}

/**
 * Count Chinese characters in a string (for syllable estimation).
 */
export const countChineseChars = (text: string): number => {
  let count = 0
  for (const char of text) {
    if (isChinese(char)) count++
  }
  return count
}
